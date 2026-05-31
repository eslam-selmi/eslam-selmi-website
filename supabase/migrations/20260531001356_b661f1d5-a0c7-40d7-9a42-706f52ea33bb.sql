DROP POLICY IF EXISTS "trainer update modules of assigned courses" ON public.course_modules;

CREATE POLICY "trainer update modules of assigned courses"
ON public.course_modules
FOR UPDATE
USING (public.is_trainer_of_course(course_id) AND public.trainer_has_perm(course_id, 'can_edit_content'))
WITH CHECK (public.is_trainer_of_course(course_id) AND public.trainer_has_perm(course_id, 'can_edit_content'));
