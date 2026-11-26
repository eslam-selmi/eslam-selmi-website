-- Course-only accounts: a normal auth user + profile + enrollment, flagged so the site only opens its course(s).
-- Removing the row converts the same account to a regular trainee (same user id, enrollments and progress kept).
CREATE TABLE IF NOT EXISTS public.course_only_accounts (
  user_id uuid PRIMARY KEY,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_only_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.course_only_accounts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.course_only_accounts TO authenticated;
DROP POLICY IF EXISTS "own course-only flag" ON public.course_only_accounts;
CREATE POLICY "own course-only flag" ON public.course_only_accounts FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Stable course URL: every course gets a slug automatically (/course-<slug>). It routes to the course; it grants no access.
CREATE OR REPLACE FUNCTION public.courses_autoslug() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $f$
DECLARE base text; cand text; n int := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND btrim(NEW.slug) <> '' THEN RETURN NEW; END IF;
  base := trim(both '-' from regexp_replace(lower(coalesce(NEW.title,'')), '[^a-z0-9]+', '-', 'g'));
  base := left(base, 40);
  IF base = '' OR base IS NULL THEN base := substr(replace(NEW.id::text,'-',''),1,6); END IF;
  cand := base;
  WHILE EXISTS (SELECT 1 FROM public.courses c WHERE c.slug = cand AND c.id <> NEW.id) LOOP
    n := n + 1; cand := base || '-' || n;
  END LOOP;
  NEW.slug := cand;
  RETURN NEW;
END $f$;
REVOKE ALL ON FUNCTION public.courses_autoslug() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS courses_autoslug_trg ON public.courses;
CREATE TRIGGER courses_autoslug_trg BEFORE INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.courses_autoslug();
-- Fill missing slugs on existing courses (never changes a slug that is already set).
UPDATE public.courses SET title = title WHERE slug IS NULL;
