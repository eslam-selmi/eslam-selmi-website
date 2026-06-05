
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.course_leads;

CREATE POLICY "Anyone can submit a valid lead"
  ON public.course_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(email) BETWEEN 5 AND 320
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND language IN ('en','ar')
    AND (user_agent IS NULL OR char_length(user_agent) <= 500)
  );
