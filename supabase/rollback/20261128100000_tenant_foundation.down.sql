-- ROLLBACK for 20261128100000_tenant_foundation.sql. PREPARED, NOT APPLIED. Lives outside supabase/migrations on purpose
-- so no tool runs it automatically. Run it by hand only after review.
--
-- Safety: it refuses to run if any trainer tenant, trainer course or tenant member exists, because dropping the tables
-- would delete that data. If trainers exist, export/review first and remove them deliberately; this script never
-- deletes owner content (owner courses only lose the extra tenant_id column; every other owner column is untouched).
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.tenants WHERE kind = 'trainer')
     OR EXISTS (SELECT 1 FROM public.courses WHERE tenant_id <> public.platform_tenant_id())
     OR EXISTS (SELECT 1 FROM public.tenant_members WHERE role = 'learner') THEN
    RAISE EXCEPTION 'trainer data exists: rollback refused. Review and export it first.';
  END IF;
END $$;

-- 1. Restore the original course read policies (definitions from migrations 20260526071640 and 20260526073138).
DROP POLICY IF EXISTS "anon view active courses" ON public.courses;
DROP POLICY IF EXISTS "authenticated view active courses" ON public.courses;
CREATE POLICY "anon view active courses" ON public.courses FOR SELECT TO anon
  USING (active = true AND is_archived = false);
CREATE POLICY "authenticated view active courses" ON public.courses FOR SELECT TO authenticated
  USING ((active = true AND is_archived = false) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Restore the original enrollment guard (definition from migration 20260704053141).
CREATE OR REPLACE FUNCTION public.trg_enrollment_guard_trainee()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  IF current_setting('app.bypass_enrollment_guard', true) = 'on' THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.certificate_issued IS DISTINCT FROM OLD.certificate_issued
     OR NEW.certificate_url IS DISTINCT FROM OLD.certificate_url
     OR NEW.certificate_url_ar IS DISTINCT FROM OLD.certificate_url_ar
     OR NEW.certificate_url_en IS DISTINCT FROM OLD.certificate_url_en
     OR NEW.blocked IS DISTINCT FROM OLD.blocked
     OR NEW.course_id IS DISTINCT FROM OLD.course_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.notes IS DISTINCT FROM OLD.notes
     OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount
     OR NEW.coupon_code IS DISTINCT FROM OLD.coupon_code
     OR NEW.grace_until IS DISTINCT FROM OLD.grace_until THEN
    RAISE EXCEPTION 'Not allowed to modify protected enrollment fields';
  END IF;
  RETURN NEW;
END; $$;

-- 3. Drop the additive policies, triggers and storage policies.
DROP POLICY IF EXISTS "tenant admin manages own courses" ON public.courses;
DROP POLICY IF EXISTS "tenant admin manages own modules" ON public.course_modules;
DROP POLICY IF EXISTS "tenant admin manages own items" ON public.module_items;
DROP POLICY IF EXISTS "tenant admin manages own assignments" ON public.assignments;
DROP POLICY IF EXISTS "tenant admin reads own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "tenant admin updates own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "tenant admin reads own learners profiles" ON public.profiles;
DROP POLICY IF EXISTS "enroll only in joined tenant" ON public.enrollments;
DROP POLICY IF EXISTS "tenant admin reads own course files" ON storage.objects;
DROP POLICY IF EXISTS "tenant admin uploads own course files" ON storage.objects;
DROP POLICY IF EXISTS "tenant admin updates own course files" ON storage.objects;
DROP POLICY IF EXISTS "tenant admin deletes own course files" ON storage.objects;
DROP TRIGGER IF EXISTS courses_tenant_guard ON public.courses;
DROP TRIGGER IF EXISTS tenant_domains_guard ON public.tenant_domains;
DROP TRIGGER IF EXISTS tenants_guard ON public.tenants;

-- 4. Remove the tenant_id column from courses, then the new tables and functions.
DROP INDEX IF EXISTS public.courses_tenant_idx;
ALTER TABLE public.courses DROP COLUMN IF EXISTS tenant_id;
DROP TABLE IF EXISTS public.tenant_domains CASCADE;
DROP TABLE IF EXISTS public.tenant_landing CASCADE;
DROP TABLE IF EXISTS public.tenant_requests CASCADE;
DROP TABLE IF EXISTS public.tenant_members CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP FUNCTION IF EXISTS public.get_public_tenant_courses(text), public.get_public_tenant(text),
  public.join_tenant_as_learner(text), public.set_tenant_learner_status(uuid, uuid, text),
  public.approve_tenant_request(uuid, integer, boolean, boolean, boolean), public.reject_tenant_request(uuid),
  public.course_tenant(uuid), public.storage_tenant_of(text), public.tenant_feature(uuid, text),
  public.is_tenant_learner(uuid), public.is_tenant_admin(uuid), public.is_platform_admin(),
  public.platform_tenant_id(), public.trg_courses_tenant_guard(), public.trg_tenant_domains_guard(),
  public.trg_tenants_guard() CASCADE;

DO $do$ BEGIN
  IF to_regclass('public.course_trainers') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS course_trainers_platform_only ON public.course_trainers';
  END IF;
END $do$;
DROP FUNCTION IF EXISTS public.trg_course_trainers_platform_only();

COMMIT;
