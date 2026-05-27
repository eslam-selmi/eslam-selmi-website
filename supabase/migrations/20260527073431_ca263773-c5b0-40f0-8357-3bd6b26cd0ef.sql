
DROP POLICY IF EXISTS "authenticated read platform_settings" ON public.platform_settings;

CREATE OR REPLACE FUNCTION public.get_activation_contact()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'admin_whatsapp_e164', admin_whatsapp_e164,
    'activation_request_template_ar', activation_request_template_ar,
    'activation_request_template_en', activation_request_template_en
  )
  FROM public.platform_settings LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_activation_contact() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_activation_contact() TO authenticated;

DROP POLICY IF EXISTS "trainer grade submissions in assigned courses" ON public.assignment_submissions;
CREATE POLICY "trainer grade submissions in assigned courses"
  ON public.assignment_submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND public.is_trainer_of_course(a.course_id)
      AND ((a.is_graduation_project = true AND public.trainer_has_perm(a.course_id, 'can_grade_graduation'))
        OR (a.is_graduation_project = false AND public.trainer_has_perm(a.course_id, 'can_grade_assignments')))))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND public.is_trainer_of_course(a.course_id)
      AND ((a.is_graduation_project = true AND public.trainer_has_perm(a.course_id, 'can_grade_graduation'))
        OR (a.is_graduation_project = false AND public.trainer_has_perm(a.course_id, 'can_grade_assignments')))));

CREATE OR REPLACE FUNCTION public.trg_submission_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.assignment_id IS DISTINCT FROM OLD.assignment_id THEN
    RAISE EXCEPTION 'assignment_id cannot be changed';
  END IF;
  IF NEW.link IS NOT NULL AND NEW.link !~* '^https?://' THEN
    RAISE EXCEPTION 'link must be an http(s) URL';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_submission_guard ON public.assignment_submissions;
CREATE TRIGGER trg_submission_guard
  BEFORE INSERT OR UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.trg_submission_guard();

ALTER TABLE public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_link_http_chk;
ALTER TABLE public.assignment_submissions
  ADD CONSTRAINT assignment_submissions_link_http_chk
  CHECK (link IS NULL OR link ~* '^https?://') NOT VALID;

DROP POLICY IF EXISTS "assignment-files trainee read own" ON storage.objects;
DROP POLICY IF EXISTS "assignment-files trainee insert own" ON storage.objects;
DROP POLICY IF EXISTS "assignment-files trainee update own" ON storage.objects;
DROP POLICY IF EXISTS "assignment-files trainee delete own" ON storage.objects;

CREATE POLICY "assignment-files trainee read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'assignment-files' AND (storage.foldername(name))[2] = auth.uid()::text
    AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid()
      AND e.course_id::text = (storage.foldername(name))[1]
      AND e.status = 'approved'::enrollment_status AND e.blocked = false));

CREATE POLICY "assignment-files trainee insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assignment-files' AND (storage.foldername(name))[2] = auth.uid()::text
    AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid()
      AND e.course_id::text = (storage.foldername(name))[1]
      AND e.status = 'approved'::enrollment_status AND e.blocked = false));

CREATE POLICY "assignment-files trainee update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'assignment-files' AND (storage.foldername(name))[2] = auth.uid()::text
    AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid()
      AND e.course_id::text = (storage.foldername(name))[1]
      AND e.status = 'approved'::enrollment_status AND e.blocked = false));

CREATE POLICY "assignment-files trainee delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'assignment-files' AND (storage.foldername(name))[2] = auth.uid()::text
    AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid()
      AND e.course_id::text = (storage.foldername(name))[1]
      AND e.status = 'approved'::enrollment_status AND e.blocked = false));

DROP POLICY IF EXISTS "enrolled read course files" ON storage.objects;
CREATE POLICY "enrolled read course files" ON storage.objects FOR SELECT
  USING (bucket_id = 'course-files' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.module_items mi
      JOIN public.course_modules cm ON cm.id = mi.module_id
      JOIN public.enrollments e ON e.course_id = cm.course_id
      WHERE mi.kind = 'file' AND mi.url = objects.name
        AND e.user_id = auth.uid() AND e.status = 'approved'::enrollment_status AND e.blocked = false)));

REVOKE EXECUTE ON FUNCTION public.trainer_has_perm(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.trg_course_trainer_inserted() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.trainer_has_perm(uuid, text) TO authenticated;
