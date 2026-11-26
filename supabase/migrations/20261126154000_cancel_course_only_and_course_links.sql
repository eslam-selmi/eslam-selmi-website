-- Cancelled by the owner (Nov 26 15:36): no course-only accounts, no automatic course links.
-- Idempotent. Does not touch real accounts, enrollments or progress.
DROP TRIGGER IF EXISTS courses_autoslug_trg ON public.courses;
DROP FUNCTION IF EXISTS public.courses_autoslug();
DROP TABLE IF EXISTS public.course_only_accounts;
-- Slugs that the automatic trigger filled on Nov 26 are cleared again (they were NULL before).
UPDATE public.courses SET slug = NULL WHERE (id::text LIKE '1be4b4dd%' AND slug = '1be4b4') OR (id::text LIKE 'e1e170cc%' AND slug = 'test-qa') OR (id::text LIKE '90458811%' AND slug = 'tna');
