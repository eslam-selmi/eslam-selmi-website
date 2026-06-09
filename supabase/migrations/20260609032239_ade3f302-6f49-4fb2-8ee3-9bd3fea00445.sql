DROP POLICY IF EXISTS "authenticated view additions" ON public.latest_additions;
CREATE POLICY "public view additions" ON public.latest_additions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "authenticated view additions settings" ON public.latest_additions_settings;
CREATE POLICY "public view additions settings" ON public.latest_additions_settings FOR SELECT TO anon, authenticated USING (true);