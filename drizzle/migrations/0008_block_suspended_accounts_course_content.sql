DROP POLICY IF EXISTS "enrolled view items" ON public.module_items;
CREATE POLICY "enrolled view items" ON public.module_items FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) OR EXISTS (
    SELECT 1 FROM public.course_modules m JOIN public.enrollments e ON e.course_id = m.course_id
    JOIN public.profiles p ON p.id = e.user_id
    WHERE m.id = module_items.module_id AND e.user_id = auth.uid()
      AND e.status = 'approved'::public.enrollment_status AND e.blocked = false AND p.account_blocked = false));
DROP POLICY IF EXISTS "enrolled read course files" ON storage.objects;
CREATE POLICY "enrolled read course files" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'course-files' AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR EXISTS (
    SELECT 1 FROM public.module_items mi JOIN public.course_modules cm ON cm.id = mi.module_id
    JOIN public.enrollments e ON e.course_id = cm.course_id
    JOIN public.profiles p ON p.id = e.user_id
    WHERE mi.kind = 'file' AND mi.url = objects.name AND e.user_id = auth.uid()
      AND e.status = 'approved'::public.enrollment_status AND e.blocked = false AND p.account_blocked = false)));