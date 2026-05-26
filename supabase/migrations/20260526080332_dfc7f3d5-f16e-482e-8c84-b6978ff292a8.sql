
-- Graduation project: visibility toggle + reference url
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reference_url text;

-- Submission file attachment (graduation project)
ALTER TABLE public.assignment_submissions
  ADD COLUMN IF NOT EXISTS file_path text;

-- Private bucket for graduation project uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-files', 'assignment-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: trainees manage own files under {course_id}/{user_id}/...
DROP POLICY IF EXISTS "assignment-files admin all" ON storage.objects;
CREATE POLICY "assignment-files admin all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'assignment-files' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'assignment-files' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "assignment-files trainee read own" ON storage.objects;
CREATE POLICY "assignment-files trainee read own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assignment-files'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "assignment-files trainee insert own" ON storage.objects;
CREATE POLICY "assignment-files trainee insert own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assignment-files'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "assignment-files trainee update own" ON storage.objects;
CREATE POLICY "assignment-files trainee update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'assignment-files'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "assignment-files trainee delete own" ON storage.objects;
CREATE POLICY "assignment-files trainee delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assignment-files'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );
