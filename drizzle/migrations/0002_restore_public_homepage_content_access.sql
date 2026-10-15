-- Keep role checks restricted to authenticated callers; visitors see published content only.
ALTER POLICY "Anyone can view active partners" ON public.partners TO authenticated;
CREATE POLICY "Visitors read active partners" ON public.partners FOR SELECT TO anon USING (is_active = true);
ALTER POLICY "Anyone can view active contracts" ON public.contracts TO authenticated;
CREATE POLICY "Visitors read active contracts" ON public.contracts FOR SELECT TO anon USING (is_active = true);
ALTER POLICY "Anyone can read published interviews" ON public.interviews TO authenticated;
CREATE POLICY "Visitors read published interviews" ON public.interviews FOR SELECT TO anon USING (is_published = true);
ALTER POLICY "Snapshots readable by everyone" ON public.snapshots TO authenticated;
CREATE POLICY "Visitors read visible snapshots" ON public.snapshots FOR SELECT TO anon USING (is_visible = true);
ALTER POLICY "Public can read published trainings" ON public.trainings TO authenticated;
CREATE POLICY "Visitors read published trainings" ON public.trainings FOR SELECT TO anon USING (is_published = true);
ALTER POLICY "Admins manage trainings" ON public.trainings TO authenticated;
ALTER POLICY "admin manage site_content" ON public.site_content TO authenticated;
GRANT SELECT ON public.partners, public.contracts, public.interviews, public.snapshots, public.trainings, public.site_content TO anon;