CREATE POLICY "Deny all reads on course_leads"
ON public.course_leads
FOR SELECT
TO anon, authenticated
USING (false);