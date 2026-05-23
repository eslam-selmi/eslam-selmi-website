-- Assignments table
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text,
  due_date timestamptz,
  max_score numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_course ON public.assignments(course_id);
CREATE INDEX idx_assignments_module ON public.assignments(module_id);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage assignments" ON public.assignments
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "enrolled view assignments" ON public.assignments
  FOR SELECT USING (
    has_role(auth.uid(),'admin') OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = assignments.course_id
        AND e.user_id = auth.uid()
        AND e.status = 'approved'
        AND e.blocked = false
    )
  );

CREATE TRIGGER assignments_set_updated BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Submissions table
CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text,
  link text,
  score numeric,
  feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  UNIQUE (assignment_id, user_id)
);

CREATE INDEX idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_user ON public.assignment_submissions(user_id);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage submissions" ON public.assignment_submissions
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "trainee view own submissions" ON public.assignment_submissions
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

CREATE POLICY "trainee create own submission" ON public.assignment_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.enrollments e ON e.course_id = a.course_id
      WHERE a.id = assignment_submissions.assignment_id
        AND e.user_id = auth.uid()
        AND e.status = 'approved'
        AND e.blocked = false
    )
  );

CREATE POLICY "trainee update own submission ungraded" ON public.assignment_submissions
  FOR UPDATE USING (auth.uid() = user_id AND graded_at IS NULL)
  WITH CHECK (auth.uid() = user_id AND score IS NULL);

-- Notify enrollees on new assignment
CREATE OR REPLACE FUNCTION public.trg_assignment_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _course_title text;
BEGIN
  SELECT title INTO _course_title FROM public.courses WHERE id = NEW.course_id;
  PERFORM public.notify_course_enrollees(
    NEW.course_id,
    'واجب جديد 📝',
    'تم نشر واجب: ' || NEW.title || ' — ' || COALESCE(_course_title,''),
    '/portal'
  );
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.trg_assignment_created() FROM PUBLIC;

CREATE TRIGGER assignment_created_notify AFTER INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.trg_assignment_created();

-- Notify trainee on grading
CREATE OR REPLACE FUNCTION public.trg_submission_graded()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _title text;
BEGIN
  IF NEW.score IS DISTINCT FROM OLD.score AND NEW.score IS NOT NULL THEN
    SELECT title INTO _title FROM public.assignments WHERE id = NEW.assignment_id;
    INSERT INTO public.notifications(user_id,title,body,link)
    VALUES (NEW.user_id, 'تم تقييم واجبك ✅',
      'حصلت على ' || NEW.score::text || ' في: ' || COALESCE(_title,''),
      '/portal');
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.trg_submission_graded() FROM PUBLIC;

CREATE TRIGGER submission_graded_notify AFTER UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.trg_submission_graded();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignment_submissions;