
UPDATE storage.buckets SET public = false WHERE id = 'course-files';

DROP POLICY IF EXISTS "course files read by name" ON storage.objects;

CREATE POLICY "enrolled read course files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-files' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR EXISTS (
      SELECT 1
      FROM public.module_items mi
      JOIN public.course_modules cm ON cm.id = mi.module_id
      JOIN public.enrollments e ON e.course_id = cm.course_id
      WHERE mi.kind = 'file'
        AND mi.url = storage.objects.name
        AND e.user_id = auth.uid()
        AND e.status = 'approved'::public.enrollment_status
    )
  )
);
