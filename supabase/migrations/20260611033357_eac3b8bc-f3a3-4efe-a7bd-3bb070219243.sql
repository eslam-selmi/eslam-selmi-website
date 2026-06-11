
-- 1) Fix testimonials public read policy (anon couldn't execute has_role)
DROP POLICY IF EXISTS "public read visible testimonials" ON public.testimonials;
CREATE POLICY "anon read visible testimonials"
  ON public.testimonials FOR SELECT
  TO anon
  USING (is_visible = true);
CREATE POLICY "auth read testimonials"
  ON public.testimonials FOR SELECT
  TO authenticated
  USING (is_visible = true OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Success Cases
CREATE TABLE IF NOT EXISTS public.success_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  name_ar text NOT NULL,
  name_en text,
  description_ar text,
  description_en text,
  challenges_ar text,
  challenges_en text,
  solutions_ar text,
  solutions_en text,
  results_ar text,
  results_en text,
  tools text[] DEFAULT ARRAY[]::text[],
  cover_image_url text,
  gallery_urls text[] DEFAULT ARRAY[]::text[],
  external_url text,
  display_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.success_cases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.success_cases TO authenticated;
GRANT ALL ON public.success_cases TO service_role;

ALTER TABLE public.success_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read visible success cases"
  ON public.success_cases FOR SELECT TO anon
  USING (is_visible = true);
CREATE POLICY "auth read success cases"
  ON public.success_cases FOR SELECT TO authenticated
  USING (is_visible = true OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins manage success cases"
  ON public.success_cases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_success_cases_updated_at
  BEFORE UPDATE ON public.success_cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
