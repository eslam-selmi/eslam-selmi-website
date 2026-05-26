
-- 1. force_password_reset on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_reset boolean NOT NULL DEFAULT false;

-- 2. soft-delete on courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- 3. suspended on user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

-- 4. granular trainer permissions per (course, trainer)
CREATE TABLE IF NOT EXISTS public.trainer_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_trainer_id uuid NOT NULL UNIQUE,
  can_edit_content boolean NOT NULL DEFAULT true,
  can_view_trainees boolean NOT NULL DEFAULT true,
  can_grade_assignments boolean NOT NULL DEFAULT true,
  can_grade_graduation boolean NOT NULL DEFAULT true,
  can_approve_enrollments boolean NOT NULL DEFAULT false,
  can_archive_course boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trainer_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage trainer_permissions" ON public.trainer_permissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "trainer view own permissions" ON public.trainer_permissions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.course_trainers ct
    WHERE ct.id = trainer_permissions.course_trainer_id
      AND ct.user_id = auth.uid()
  ));

CREATE TRIGGER trg_trainer_permissions_updated
  BEFORE UPDATE ON public.trainer_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create default permissions when a trainer is assigned to a course
CREATE OR REPLACE FUNCTION public.trg_course_trainer_inserted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.trainer_permissions (course_trainer_id)
  VALUES (NEW.id)
  ON CONFLICT (course_trainer_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_course_trainer_inserted ON public.course_trainers;
CREATE TRIGGER trg_course_trainer_inserted
  AFTER INSERT ON public.course_trainers
  FOR EACH ROW EXECUTE FUNCTION public.trg_course_trainer_inserted();

-- Backfill permissions for existing course_trainers rows
INSERT INTO public.trainer_permissions (course_trainer_id)
SELECT ct.id FROM public.course_trainers ct
WHERE NOT EXISTS (SELECT 1 FROM public.trainer_permissions tp WHERE tp.course_trainer_id = ct.id);

-- 5. Update is_trainer_of_course to exclude suspended trainers
CREATE OR REPLACE FUNCTION public.is_trainer_of_course(_course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_trainers ct
    JOIN public.user_roles ur ON ur.user_id = ct.user_id AND ur.role = 'trainer'
    WHERE ct.course_id = _course_id
      AND ct.user_id = auth.uid()
      AND ur.is_suspended = false
  )
$$;

-- 6. Update authenticated view courses policy to hide archived
DROP POLICY IF EXISTS "authenticated view active courses" ON public.courses;
CREATE POLICY "authenticated view active courses" ON public.courses
  FOR SELECT TO authenticated
  USING (
    (active = true AND is_archived = false)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 7. Helper: check trainer permission on a course
CREATE OR REPLACE FUNCTION public.trainer_has_perm(_course_id uuid, _perm text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _ok boolean;
BEGIN
  EXECUTE format('
    SELECT COALESCE(bool_or(tp.%I), false)
    FROM public.course_trainers ct
    JOIN public.trainer_permissions tp ON tp.course_trainer_id = ct.id
    JOIN public.user_roles ur ON ur.user_id = ct.user_id AND ur.role = ''trainer''
    WHERE ct.course_id = $1 AND ct.user_id = auth.uid() AND ur.is_suspended = false
  ', _perm) INTO _ok USING _course_id;
  RETURN COALESCE(_ok, false);
END;
$$;

-- 8. Update grading policy to use permission
DROP POLICY IF EXISTS "trainer grade submissions in assigned courses" ON public.assignment_submissions;
CREATE POLICY "trainer grade submissions in assigned courses" ON public.assignment_submissions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND public.is_trainer_of_course(a.course_id)
      AND (
        (a.is_graduation_project = true AND public.trainer_has_perm(a.course_id, 'can_grade_graduation'))
        OR (a.is_graduation_project = false AND public.trainer_has_perm(a.course_id, 'can_grade_assignments'))
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND public.is_trainer_of_course(a.course_id)
  ));
