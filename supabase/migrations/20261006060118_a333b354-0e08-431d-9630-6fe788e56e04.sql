CREATE TABLE public.course_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  content_rating smallint NOT NULL CHECK (content_rating BETWEEN 1 AND 5),
  trainer_rating smallint NOT NULL CHECK (trainer_rating BETWEEN 1 AND 5),
  expectations_rating smallint NOT NULL CHECK (expectations_rating BETWEEN 1 AND 5),
  would_recommend boolean NOT NULL,
  pace text NOT NULL CHECK (pace IN ('slow','right','fast')),
  comments text CHECK (char_length(comments) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE ON public.course_feedback TO authenticated;
GRANT ALL ON public.course_feedback TO service_role;
ALTER TABLE public.course_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainees read own feedback, admins and course trainers read all"
ON public.course_feedback FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.is_trainer_of_course(course_id));
CREATE POLICY "Approved trainees submit own feedback"
ON public.course_feedback FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid() AND e.course_id = course_feedback.course_id AND e.status = 'approved'));
CREATE POLICY "Trainees update own feedback"
ON public.course_feedback FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER course_feedback_updated_at BEFORE UPDATE ON public.course_feedback
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();