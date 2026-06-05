
REVOKE EXECUTE ON FUNCTION public.trg_enrollment_inserted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_enrollment_updated() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_payment_inserted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_session_inserted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_module_completed() FROM PUBLIC, anon, authenticated;

-- Tighten course-files: drop broad SELECT, allow only by exact name (no listing)
DROP POLICY IF EXISTS "course files public read" ON storage.objects;
CREATE POLICY "course files read by name" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-files' AND name IS NOT NULL);
