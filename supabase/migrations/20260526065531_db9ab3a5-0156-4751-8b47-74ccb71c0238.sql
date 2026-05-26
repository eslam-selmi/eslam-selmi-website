-- 1. course_trainers table
CREATE TABLE IF NOT EXISTS public.course_trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);

ALTER TABLE public.course_trainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage course_trainers"
  ON public.course_trainers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "trainer view own assignments"
  ON public.course_trainers FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Helper function
CREATE OR REPLACE FUNCTION public.is_trainer_of_course(_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_trainers
    WHERE course_id = _course_id AND user_id = auth.uid()
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_trainer_of_course(uuid) TO authenticated;

-- 3. Extend RLS policies for trainer access

-- courses: trainers see their courses (even if inactive)
CREATE POLICY "trainer view assigned courses"
  ON public.courses FOR SELECT
  USING (public.is_trainer_of_course(id));

-- course_modules
CREATE POLICY "trainer view modules of assigned courses"
  ON public.course_modules FOR SELECT
  USING (public.is_trainer_of_course(course_id));

CREATE POLICY "trainer update modules of assigned courses"
  ON public.course_modules FOR UPDATE
  USING (public.is_trainer_of_course(course_id))
  WITH CHECK (public.is_trainer_of_course(course_id));

-- module_items
CREATE POLICY "trainer view items of assigned courses"
  ON public.module_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.course_modules m
    WHERE m.id = module_items.module_id AND public.is_trainer_of_course(m.course_id)
  ));

-- course_sessions
CREATE POLICY "trainer view sessions of assigned courses"
  ON public.course_sessions FOR SELECT
  USING (public.is_trainer_of_course(course_id));

-- assignments
CREATE POLICY "trainer view assignments of assigned courses"
  ON public.assignments FOR SELECT
  USING (public.is_trainer_of_course(course_id));

-- assignment_submissions: trainers see and grade submissions for their courses
CREATE POLICY "trainer view submissions in assigned courses"
  ON public.assignment_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND public.is_trainer_of_course(a.course_id)
  ));

CREATE POLICY "trainer grade submissions in assigned courses"
  ON public.assignment_submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND public.is_trainer_of_course(a.course_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND public.is_trainer_of_course(a.course_id)
  ));

-- enrollments: trainers see enrollments in their assigned courses
CREATE POLICY "trainer view enrollments of assigned courses"
  ON public.enrollments FOR SELECT
  USING (public.is_trainer_of_course(course_id));

-- profiles: trainers see profiles of trainees enrolled in their courses
CREATE POLICY "trainer view enrolled trainee profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.user_id = profiles.id
      AND public.is_trainer_of_course(e.course_id)
  ));
