
CREATE TABLE public.course_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_leads ENABLE ROW LEVEL SECURITY;

-- Public insert (anyone can subscribe)
CREATE POLICY "Anyone can submit a lead"
  ON public.course_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public select — leads remain private. Owner can read via service role.
