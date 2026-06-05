-- Remove the trainer's broad SELECT policy on enrollments
DROP POLICY IF EXISTS "trainer view enrollments of assigned courses" ON public.enrollments;

-- Provide a safe, column-scoped view for trainers
CREATE OR REPLACE VIEW public.trainer_enrollments
WITH (security_invoker = false) AS
SELECT
  e.id,
  e.course_id,
  e.user_id,
  e.status,
  e.blocked,
  e.name_ar,
  e.name_en,
  e.certificate_issued,
  e.certificate_requested_at,
  e.created_at,
  e.updated_at
FROM public.enrollments e
WHERE public.is_trainer_of_course(e.course_id);

GRANT SELECT ON public.trainer_enrollments TO authenticated;