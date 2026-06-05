
CREATE TABLE public.course_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  course_title text,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country_code text,
  language text NOT NULL DEFAULT 'ar',
  notes text,
  status text NOT NULL DEFAULT 'new',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.course_interests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.course_interests TO authenticated;
GRANT ALL ON public.course_interests TO service_role;

ALTER TABLE public.course_interests ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can submit interest
CREATE POLICY "anyone can insert interest"
  ON public.course_interests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read/update/delete
CREATE POLICY "admins read interest"
  ON public.course_interests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins update interest"
  ON public.course_interests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete interest"
  ON public.course_interests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER course_interests_set_updated_at
  BEFORE UPDATE ON public.course_interests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX course_interests_course_id_idx ON public.course_interests(course_id);
CREATE INDEX course_interests_created_at_idx ON public.course_interests(created_at DESC);

-- Add is_upcoming flag on courses for admin to mark courses that are not yet open
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_upcoming boolean NOT NULL DEFAULT false;
