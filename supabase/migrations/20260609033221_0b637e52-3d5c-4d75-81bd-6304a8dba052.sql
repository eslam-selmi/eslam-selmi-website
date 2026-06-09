
-- courses: scope helper-function policies to authenticated only
DROP POLICY IF EXISTS "admin manage courses" ON public.courses;
CREATE POLICY "admin manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "trainer view assigned courses" ON public.courses;
CREATE POLICY "trainer view assigned courses" ON public.courses
  FOR SELECT TO authenticated
  USING (is_trainer_of_course(id));

-- site_popups: same fix
DROP POLICY IF EXISTS "admin manage popups" ON public.site_popups;
CREATE POLICY "admin manage popups" ON public.site_popups
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "admin view all popups" ON public.site_popups;
CREATE POLICY "admin view all popups" ON public.site_popups
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
