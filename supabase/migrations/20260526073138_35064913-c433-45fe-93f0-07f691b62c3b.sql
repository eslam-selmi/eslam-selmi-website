
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS brand_primary_color text,
  ADD COLUMN IF NOT EXISTS brand_tagline_ar text,
  ADD COLUMN IF NOT EXISTS brand_tagline_en text;

CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_unique ON public.courses(slug) WHERE slug IS NOT NULL;

DROP POLICY IF EXISTS "anon view active courses" ON public.courses;
CREATE POLICY "anon view active courses"
ON public.courses FOR SELECT
TO anon
USING (active = true AND is_archived = false);
