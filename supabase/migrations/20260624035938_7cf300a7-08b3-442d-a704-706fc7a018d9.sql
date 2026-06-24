
DROP POLICY IF EXISTS "public read public-uploads" ON storage.objects;
DROP POLICY IF EXISTS "admin write public-uploads" ON storage.objects;
DROP POLICY IF EXISTS "admin update public-uploads" ON storage.objects;
DROP POLICY IF EXISTS "admin delete public-uploads" ON storage.objects;

CREATE POLICY "public read public-uploads" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'public-uploads');

CREATE POLICY "admin write public-uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin update public-uploads" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'public-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin delete public-uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'public-uploads' AND public.has_role(auth.uid(), 'admin'));
