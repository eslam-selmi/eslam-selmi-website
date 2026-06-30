
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  role_ar TEXT,
  role_en TEXT,
  period_ar TEXT,
  period_en TEXT,
  cover_url TEXT,
  challenge_ar TEXT,
  challenge_en TEXT,
  solution_ar TEXT,
  solution_en TEXT,
  result_ar TEXT,
  result_en TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trainings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.trainings TO authenticated;
GRANT ALL ON public.trainings TO service_role;

ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published trainings"
  ON public.trainings FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage trainings"
  ON public.trainings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trainings_updated_at
  BEFORE UPDATE ON public.trainings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.site_content (section_key, label, content, is_visible)
VALUES ('home.trainings', 'Home — Trainings', '{}'::jsonb, true)
ON CONFLICT (section_key) DO NOTHING;
