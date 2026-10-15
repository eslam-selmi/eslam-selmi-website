ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS certificate_settings jsonb NOT NULL DEFAULT '{}'::jsonb;
DROP POLICY IF EXISTS "users read own certificates" ON storage.objects;
CREATE POLICY "users read own certificates" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'certificates' AND (public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid()
      AND (e.certificate_url = objects.name OR e.certificate_url_ar = objects.name OR e.certificate_url_en = objects.name))));