
CREATE TABLE public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text,
  description_ar text,
  description_en text,
  cover_url text,
  resource_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.interviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published interviews"
  ON public.interviews FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage interviews"
  ON public.interviews FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER interviews_set_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Register homepage section toggle (visible by default)
INSERT INTO public.site_content (section_key, label, content, is_visible)
VALUES ('home.interviews', 'قسم المقابلات', '{}'::jsonb, true)
ON CONFLICT (section_key) DO NOTHING;
