-- Tenant foundation (PREPARED, not applied to any live database).
-- NOT purely additive. It also: writes tenant_id on every existing courses row (backfill, then NOT NULL);
-- drops and recreates two courses SELECT policies; replaces trg_enrollment_guard_trainee();
-- adds a RESTRICTIVE enrollments insert policy; adds a trigger on course_trainers (if that table exists).
-- Existing content stays in the platform (owner) tenant via a column default.
-- The whole file runs in one transaction: a failure leaves nothing applied.
-- Trainer tenants get their own admin membership, learner membership and course rows.
-- Platform admin = existing user_roles 'admin' (unchanged).

-- 1. Tenants ---------------------------------------------------------------
BEGIN;

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  kind text NOT NULL DEFAULT 'trainer' CHECK (kind IN ('platform','trainer')),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  -- owner-controlled switches; all OFF by default for trainers
  feature_tools_upload boolean NOT NULL DEFAULT false,
  feature_landing boolean NOT NULL DEFAULT false,
  feature_custom_domain boolean NOT NULL DEFAULT false,
  max_courses integer CHECK (max_courses IS NULL OR max_courses >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS tenants_one_platform ON public.tenants ((kind)) WHERE kind = 'platform';
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

INSERT INTO public.tenants (slug, kind, name, status, feature_tools_upload, feature_landing, feature_custom_domain)
VALUES ('platform-owner', 'platform', 'Eslam Selmi', 'active', true, true, true)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.platform_tenant_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT id FROM public.tenants WHERE kind = 'platform' LIMIT 1 $$;

CREATE TABLE IF NOT EXISTS public.tenant_members (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','learner')),
  -- a trainer's own learners start 'pending' and are approved by that trainer (or the owner); only 'approved' gets access
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id, role)
);
CREATE INDEX IF NOT EXISTS tenant_members_user_idx ON public.tenant_members(user_id);
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- 2. Helpers (server-side, SECURITY DEFINER, read auth.uid() themselves) -----
CREATE OR REPLACE FUNCTION public.is_platform_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND COALESCE(is_suspended,false) = false) $$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_tenant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (SELECT 1 FROM public.tenant_members m JOIN public.tenants t ON t.id = m.tenant_id
   WHERE m.tenant_id = _tenant AND m.user_id = auth.uid() AND m.role = 'admin' AND t.status = 'active') $$;

CREATE OR REPLACE FUNCTION public.is_tenant_learner(_tenant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (SELECT 1 FROM public.tenant_members m JOIN public.tenants t ON t.id = m.tenant_id
  WHERE m.tenant_id = _tenant AND m.user_id = auth.uid() AND m.role = 'learner' AND m.status = 'approved' AND t.status = 'active') $$;

CREATE OR REPLACE FUNCTION public.tenant_feature(_tenant uuid, _feature text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT COALESCE((SELECT CASE _feature
    WHEN 'tools_upload' THEN feature_tools_upload
    WHEN 'landing' THEN feature_landing
    WHEN 'custom_domain' THEN feature_custom_domain END
  FROM public.tenants WHERE id = _tenant AND status = 'active'), false) $$;

-- tenants / members policies
CREATE POLICY "platform admin manages tenants" ON public.tenants FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "tenant members read own tenant" ON public.tenants FOR SELECT TO authenticated
  USING (public.is_tenant_admin(id) OR public.is_tenant_learner(id));
CREATE POLICY "platform admin manages members" ON public.tenant_members FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "tenant admin reads own members" ON public.tenant_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_tenant_admin(tenant_id));

-- Owner-only fields cannot be changed by anyone but the platform admin (no tenant_admin UPDATE policy exists;
-- this guard also covers a future one).
CREATE OR REPLACE FUNCTION public.trg_tenants_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'only the platform owner can change tenants';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER tenants_guard BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.trg_tenants_guard();

-- 3. Trainer requests ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  specialty text,
  requested_slug text NOT NULL CHECK (requested_slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by uuid,
  decided_at timestamptz,
  tenant_id uuid REFERENCES public.tenants(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS tenant_requests_one_pending ON public.tenant_requests(user_id) WHERE status = 'pending';
ALTER TABLE public.tenant_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user creates own pending request" ON public.tenant_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending' AND decided_by IS NULL AND tenant_id IS NULL);
CREATE POLICY "user reads own request" ON public.tenant_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY "platform admin manages requests" ON public.tenant_requests FOR UPDATE TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.approve_tenant_request(_request uuid, _max_courses integer DEFAULT 3,
  _tools_upload boolean DEFAULT false, _landing boolean DEFAULT true, _custom_domain boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.tenant_requests; t uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'platform admin only'; END IF;
  SELECT * INTO r FROM public.tenant_requests WHERE id = _request FOR UPDATE;
  IF NOT FOUND OR r.status <> 'pending' THEN RAISE EXCEPTION 'request not pending'; END IF;
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = r.requested_slug) THEN RAISE EXCEPTION 'slug already taken'; END IF;
  INSERT INTO public.tenants (slug, kind, name, max_courses, feature_tools_upload, feature_landing, feature_custom_domain)
  VALUES (r.requested_slug, 'trainer', r.full_name, _max_courses, _tools_upload, _landing, _custom_domain)
  RETURNING id INTO t;
  INSERT INTO public.tenant_members (tenant_id, user_id, role, status) VALUES (t, r.user_id, 'admin', 'approved');
  UPDATE public.tenant_requests SET status = 'approved', decided_by = auth.uid(), decided_at = now(), tenant_id = t WHERE id = _request;
  RETURN t;
END $$;

CREATE OR REPLACE FUNCTION public.reject_tenant_request(_request uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'platform admin only'; END IF;
  UPDATE public.tenant_requests SET status = 'rejected', decided_by = auth.uid(), decided_at = now()
   WHERE id = _request AND status = 'pending';
END $$;

-- 4. Learner self-registration on a trainer's tenant -------------------------
CREATE OR REPLACE FUNCTION public.join_tenant_as_learner(_slug text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  SELECT id INTO t FROM public.tenants WHERE slug = _slug AND status = 'active' AND kind = 'trainer';
  IF t IS NULL THEN RAISE EXCEPTION 'unknown tenant'; END IF;
  INSERT INTO public.tenant_members (tenant_id, user_id, role) VALUES (t, auth.uid(), 'learner') ON CONFLICT DO NOTHING;
  RETURN t;
END $$;

-- A trainer (or the owner) approves, blocks or re-pends a learner of THAT tenant only. This is separate from the
-- owner's profile activation rule, which is not touched.
CREATE OR REPLACE FUNCTION public.set_tenant_learner_status(_tenant uuid, _user uuid, _status text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_platform_admin() OR public.is_tenant_admin(_tenant)) THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF _status NOT IN ('pending','approved','blocked') THEN RAISE EXCEPTION 'bad status'; END IF;
  UPDATE public.tenant_members SET status = _status WHERE tenant_id = _tenant AND user_id = _user AND role = 'learner';
  IF NOT FOUND THEN RAISE EXCEPTION 'not a learner of this tenant'; END IF;
END $$;

-- Public, safe-fields-only lookup for a tenant landing page.
CREATE OR REPLACE FUNCTION public.get_public_tenant(_slug text)
RETURNS TABLE (id uuid, slug text, name text, feature_landing boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT id, slug, name, feature_landing FROM public.tenants WHERE slug = _slug AND status = 'active' AND kind = 'trainer' $$;

-- 5. Branded landing content per tenant ------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_landing (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  headline text, subtitle text, about text, brand_color text, logo_url text,
  published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_landing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published landing" ON public.tenant_landing FOR SELECT TO anon, authenticated
  USING (published AND public.tenant_feature(tenant_id, 'landing'));
CREATE POLICY "tenant admin manages landing" ON public.tenant_landing FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id) AND public.tenant_feature(tenant_id, 'landing'))
  WITH CHECK (public.is_tenant_admin(tenant_id) AND public.tenant_feature(tenant_id, 'landing'));
CREATE POLICY "platform admin manages landing" ON public.tenant_landing FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- 6. Custom domains: stored state only. DNS check + hosting attach are NOT implemented here.
CREATE TABLE IF NOT EXISTS public.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostname text NOT NULL UNIQUE CHECK (hostname = lower(hostname) AND hostname ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  verification_token text NOT NULL DEFAULT substr(replace(gen_random_uuid()::text,'-',''),1,24),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','verified','active','disabled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant admin requests domain" ON public.tenant_domains FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_admin(tenant_id) AND public.tenant_feature(tenant_id, 'custom_domain') AND status = 'requested');
CREATE POLICY "tenant admin reads domains" ON public.tenant_domains FOR SELECT TO authenticated
  USING (public.is_tenant_admin(tenant_id) OR public.is_platform_admin());
CREATE POLICY "platform admin manages domains" ON public.tenant_domains FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- 7. Tenant ownership of courses (existing rows default to the platform tenant) --
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
UPDATE public.courses SET tenant_id = public.platform_tenant_id() WHERE tenant_id IS NULL;
ALTER TABLE public.courses ALTER COLUMN tenant_id SET DEFAULT public.platform_tenant_id();
ALTER TABLE public.courses ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS courses_tenant_idx ON public.courses(tenant_id);

CREATE OR REPLACE FUNCTION public.course_tenant(_course uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT tenant_id FROM public.courses WHERE id = _course $$;

-- Course limit + tenant immutability, enforced in the database.
CREATE OR REPLACE FUNCTION public.trg_courses_tenant_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lim integer; cnt integer;
BEGIN
  IF auth.uid() IS NULL OR public.is_platform_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'course tenant cannot be changed';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_tenant_admin(NEW.tenant_id) THEN RAISE EXCEPTION 'not an admin of this tenant'; END IF;
    SELECT max_courses INTO lim FROM public.tenants WHERE id = NEW.tenant_id FOR UPDATE;
    SELECT count(*) INTO cnt FROM public.courses WHERE tenant_id = NEW.tenant_id;
    IF lim IS NOT NULL AND cnt >= lim THEN RAISE EXCEPTION 'course limit reached (%)', lim; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER courses_tenant_guard BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.trg_courses_tenant_guard();

-- Additive tenant-admin access (scoped by the course's tenant).
CREATE POLICY "tenant admin manages own courses" ON public.courses FOR ALL TO authenticated
  USING (public.is_tenant_admin(tenant_id)) WITH CHECK (public.is_tenant_admin(tenant_id));
CREATE POLICY "tenant admin manages own modules" ON public.course_modules FOR ALL TO authenticated
  USING (public.is_tenant_admin(public.course_tenant(course_id))) WITH CHECK (public.is_tenant_admin(public.course_tenant(course_id)));
CREATE POLICY "tenant admin manages own items" ON public.module_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_modules m WHERE m.id = module_id AND public.is_tenant_admin(public.course_tenant(m.course_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.course_modules m WHERE m.id = module_id AND public.is_tenant_admin(public.course_tenant(m.course_id))));
CREATE POLICY "tenant admin manages own assignments" ON public.assignments FOR ALL TO authenticated
  USING (public.is_tenant_admin(public.course_tenant(course_id))) WITH CHECK (public.is_tenant_admin(public.course_tenant(course_id)));
CREATE POLICY "tenant admin reads own enrollments" ON public.enrollments FOR SELECT TO authenticated
  USING (public.is_tenant_admin(public.course_tenant(course_id)));
CREATE POLICY "tenant admin updates own enrollments" ON public.enrollments FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(public.course_tenant(course_id))) WITH CHECK (public.is_tenant_admin(public.course_tenant(course_id)));
CREATE POLICY "tenant admin reads own learners profiles" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members m WHERE m.user_id = profiles.id AND m.role = 'learner' AND public.is_tenant_admin(m.tenant_id)));

-- RESTRICTIVE: a learner can only enroll in a trainer's course after joining that tenant.
CREATE POLICY "enroll only in joined tenant" ON public.enrollments AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin()
    OR public.course_tenant(course_id) = public.platform_tenant_id()
    OR public.is_tenant_learner(public.course_tenant(course_id))
    OR public.is_tenant_admin(public.course_tenant(course_id)));

-- 8. Enrollment guard: let a tenant admin review enrollments of their own tenant (same function, one added allowance).

-- Extend enrollment guard to also protect grace_until
CREATE OR REPLACE FUNCTION public.trg_enrollment_guard_trainee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF current_setting('app.bypass_enrollment_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;
  -- Tenant admin: may change review fields of enrollments in their own tenant, never the course or learner.
  -- Least privilege: status, blocked and notes only. Certificates, discounts, coupons and grace dates stay with the platform admin.
  IF public.is_tenant_admin(public.course_tenant(OLD.course_id))
     AND NEW.course_id IS NOT DISTINCT FROM OLD.course_id
     AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id
     AND NEW.certificate_issued IS NOT DISTINCT FROM OLD.certificate_issued
     AND NEW.certificate_url IS NOT DISTINCT FROM OLD.certificate_url
     AND NEW.certificate_url_ar IS NOT DISTINCT FROM OLD.certificate_url_ar
     AND NEW.certificate_url_en IS NOT DISTINCT FROM OLD.certificate_url_en
     AND NEW.discount_amount IS NOT DISTINCT FROM OLD.discount_amount
     AND NEW.coupon_code IS NOT DISTINCT FROM OLD.coupon_code
     AND NEW.grace_until IS NOT DISTINCT FROM OLD.grace_until THEN
    RETURN NEW;
  END IF;
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
END;
$$;


-- 9. Storage: tenant-prefixed paths. Trainer files live under  t/<tenant_id>/...  in course-files.
-- Existing admin-only write policies stay; trainers get NO access outside their own prefix.
CREATE OR REPLACE FUNCTION public.storage_tenant_of(_name text) RETURNS uuid
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN split_part(_name, '/', 1) = 't'
              AND split_part(_name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         THEN split_part(_name, '/', 2)::uuid END $$;

CREATE POLICY "tenant admin reads own course files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'course-files' AND public.storage_tenant_of(name) IS NOT NULL
         AND public.is_tenant_admin(public.storage_tenant_of(name)));
CREATE POLICY "tenant admin uploads own course files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-files' AND public.storage_tenant_of(name) IS NOT NULL
         AND public.is_tenant_admin(public.storage_tenant_of(name))
         AND public.tenant_feature(public.storage_tenant_of(name), 'tools_upload'));
CREATE POLICY "tenant admin updates own course files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'course-files' AND public.storage_tenant_of(name) IS NOT NULL
         AND public.is_tenant_admin(public.storage_tenant_of(name)) AND public.tenant_feature(public.storage_tenant_of(name), 'tools_upload'))
  WITH CHECK (bucket_id = 'course-files' AND public.storage_tenant_of(name) IS NOT NULL
         AND public.is_tenant_admin(public.storage_tenant_of(name)) AND public.tenant_feature(public.storage_tenant_of(name), 'tools_upload'));
CREATE POLICY "tenant admin deletes own course files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'course-files' AND public.storage_tenant_of(name) IS NOT NULL
         AND public.is_tenant_admin(public.storage_tenant_of(name)));

-- 10. Keep the owner's public catalogue the owner's. Trainer courses are not readable through the general
-- course policies; they are served by get_public_tenant_courses (landing) or to that tenant's own learners.
DROP POLICY IF EXISTS "anon view active courses" ON public.courses;
DROP POLICY IF EXISTS "authenticated view active courses" ON public.courses;
CREATE POLICY "anon view active courses" ON public.courses FOR SELECT TO anon
  USING (active = true AND is_archived = false AND tenant_id = public.platform_tenant_id());
CREATE POLICY "authenticated view active courses" ON public.courses FOR SELECT TO authenticated
  USING (((active = true AND is_archived = false)
          AND (tenant_id = public.platform_tenant_id() OR public.is_tenant_learner(tenant_id)))
         OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.get_public_tenant_courses(_slug text)
RETURNS TABLE (id uuid, title text, description text, total_hours numeric, cover_emoji text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.title, c.description, c.total_hours, c.cover_emoji
  FROM public.courses c JOIN public.tenants t ON t.id = c.tenant_id
  JOIN public.tenant_landing l ON l.tenant_id = t.id
  WHERE t.slug = _slug AND t.status = 'active' AND t.kind = 'trainer' AND t.feature_landing AND l.published
    AND c.active = true AND c.is_archived = false
  ORDER BY c.created_at $$;
GRANT EXECUTE ON FUNCTION public.get_public_tenant(text), public.get_public_tenant_courses(text) TO anon, authenticated;

-- 11. Domains: no client (not even the owner's browser session) may mark a domain verified or active.
-- Only a server-side verifier (service role, no auth.uid()) can, once DNS check + hosting attach exist.
CREATE OR REPLACE FUNCTION public.trg_tenant_domains_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.status IN ('verified','active')
     AND (TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status) THEN
    RAISE EXCEPTION 'domain verification is not available yet';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tenant_domains_guard BEFORE INSERT OR UPDATE ON public.tenant_domains
  FOR EACH ROW EXECUTE FUNCTION public.trg_tenant_domains_guard();

-- 12. Trainer colour theme: one of ten fixed keys, validated in the database. Applies only to that tenant's page.
ALTER TABLE public.tenant_landing ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'terracotta'
  CHECK (theme IN ('terracotta','ocean','forest','plum','sand','rose','slate','midnight','mint','saffron'));

-- 13. Legacy trainers feature: stale course_trainers rows must never reach a tenant course.
-- Legacy trainer policies key on course_trainers and are not tenant-aware; this blocks the link instead of dropping policies.
CREATE OR REPLACE FUNCTION public.trg_course_trainers_platform_only() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.course_tenant(NEW.course_id) IS DISTINCT FROM public.platform_tenant_id() THEN
    RAISE EXCEPTION 'legacy trainer assignment is only allowed on platform courses';
  END IF;
  RETURN NEW;
END $$;
DO $do$ BEGIN
  IF to_regclass('public.course_trainers') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS course_trainers_platform_only ON public.course_trainers';
    EXECUTE 'CREATE TRIGGER course_trainers_platform_only BEFORE INSERT OR UPDATE ON public.course_trainers FOR EACH ROW EXECUTE FUNCTION public.trg_course_trainers_platform_only()';
  END IF;
END $do$;

COMMIT;
