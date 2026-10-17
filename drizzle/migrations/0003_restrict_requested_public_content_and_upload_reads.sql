DROP POLICY IF EXISTS "public view site_content" ON public.site_content;
CREATE POLICY "public visible site content" ON public.site_content FOR SELECT TO anon USING (is_visible OR section_key = 'site.maintenance');
CREATE POLICY "authenticated visible site content" ON public.site_content FOR SELECT TO authenticated USING (is_visible OR section_key = 'site.maintenance');

CREATE FUNCTION public.get_public_site_visibility()
RETURNS TABLE(section_key text, is_visible boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT s.section_key, s.is_visible FROM public.site_content s $$;
REVOKE ALL ON FUNCTION public.get_public_site_visibility() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_site_visibility() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "public view additions" ON public.latest_additions;
CREATE POLICY "public visible additions" ON public.latest_additions FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.site_content s WHERE s.section_key = 'home.latest_additions' AND s.is_visible));
ALTER POLICY "admin manage additions" ON public.latest_additions TO authenticated;
DROP POLICY IF EXISTS "public view additions settings" ON public.latest_additions_settings;
CREATE POLICY "public visible additions settings" ON public.latest_additions_settings FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.site_content s WHERE s.section_key = 'home.latest_additions' AND s.is_visible));
ALTER POLICY "admin manage additions settings" ON public.latest_additions_settings TO authenticated;

DROP POLICY IF EXISTS "Anyone can read custom countries" ON public.custom_countries;
CREATE POLICY "read own custom countries" ON public.custom_countries FOR SELECT TO authenticated USING (created_by = (SELECT auth.uid()));
REVOKE SELECT ON public.custom_countries FROM anon;
CREATE FUNCTION public.get_public_custom_countries()
RETURNS TABLE(id uuid, name_ar text, name_en text, dial text, flag text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT c.id, c.name_ar, c.name_en, c.dial, c.flag FROM public.custom_countries c WHERE length(trim(c.name_ar)) > 0 AND length(trim(c.name_en)) > 0 ORDER BY c.name_ar $$;
REVOKE ALL ON FUNCTION public.get_public_custom_countries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_custom_countries() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "public read public-uploads" ON storage.objects;
CREATE POLICY "owners and admins read public-uploads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'public-uploads' AND (owner_id = (SELECT auth.uid()::text) OR public.has_role((SELECT auth.uid()), 'admin')));