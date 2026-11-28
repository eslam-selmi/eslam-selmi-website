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

DROP POLICY IF EXISTS "tenant learner reads own course files" ON storage.objects;
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
  public.approve_tenant_request(uuid, integer, boolean, boolean, boolean, boolean), public.reject_tenant_request(uuid),
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

DROP TRIGGER IF EXISTS submission_tenant_grade_guard ON public.assignment_submissions;
DROP FUNCTION IF EXISTS public.trg_submission_tenant_grade_guard();
DROP POLICY IF EXISTS "tenant admin manages own sessions" ON public.course_sessions;
DROP POLICY IF EXISTS "tenant admin manages own assignments" ON public.assignments;
DROP POLICY IF EXISTS "tenant admin reads own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "tenant admin grades own submissions" ON public.assignment_submissions;
DROP FUNCTION IF EXISTS public.assignment_tenant(uuid);
-- Restore finance objects changed by section 14 (original definitions copied from 20260523140436 and 20260626083801).
DROP TRIGGER IF EXISTS trg_tenant_payment_amount ON public.payments;
DROP TRIGGER IF EXISTS trg_tenant_installment_amount ON public.installments;
DROP FUNCTION IF EXISTS public.trg_tenant_amount_positive();
DROP POLICY IF EXISTS "tenant admin manages own payments" ON public.payments;
DROP POLICY IF EXISTS "tenant admin manages own installments" ON public.installments;
DROP POLICY IF EXISTS "tenant admin manages own coupons" ON public.coupons;
DROP POLICY IF EXISTS "tenant admin reads own redemptions" ON public.coupon_redemptions;
DROP POLICY IF EXISTS "authenticated view active coupons" ON public.coupons; -- stays absent (removed by 20260608040105)
DROP INDEX IF EXISTS public.coupons_tenant_code_key;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_code_key UNIQUE (code);
ALTER TABLE public.coupons DROP COLUMN IF EXISTS tenant_id;
DROP POLICY IF EXISTS "tenant admin reads own tool files" ON storage.objects;
DROP POLICY IF EXISTS "tenant admin uploads own tool files" ON storage.objects;
DROP POLICY IF EXISTS "tenant admin updates own tool files" ON storage.objects;
DROP POLICY IF EXISTS "tenant admin deletes own tool files" ON storage.objects;
DROP POLICY IF EXISTS "tenant learner reads own certificate file" ON storage.objects;
DROP POLICY IF EXISTS "tenant admin reads own certificates" ON storage.objects;
DROP POLICY IF EXISTS "tenant admin uploads own certificates" ON storage.objects;
DROP POLICY IF EXISTS "tenant admin updates own certificates" ON storage.objects;
DROP POLICY IF EXISTS "tenant admin deletes own certificates" ON storage.objects;
DROP TRIGGER IF EXISTS landing_theme_gate ON public.tenant_landing;
DROP FUNCTION IF EXISTS public.trg_landing_theme_gate();
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _c RECORD;
  _price numeric;
  _discount numeric;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT * INTO _c FROM public.coupons WHERE code = _code AND active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  IF _c.expires_at IS NOT NULL AND _c.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  IF _c.max_uses IS NOT NULL AND _c.used_count >= _c.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'exhausted');
  END IF;

  IF _c.course_id IS NOT NULL AND _c.course_id <> _course_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'wrong_course');
  END IF;

  IF EXISTS (SELECT 1 FROM public.coupon_redemptions WHERE coupon_id = _c.id AND user_id = _uid) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_used');
  END IF;

  SELECT COALESCE(price, 0) INTO _price FROM public.courses WHERE id = _course_id;
  IF _c.discount_type = 'percent' THEN
    _discount := round(_price * _c.discount_value / 100.0, 2);
  ELSE
    _discount := LEAST(_c.discount_value, _price);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'coupon_id', _c.id,
    'code', _c.code,
    'discount_type', _c.discount_type,
    'discount_value', _c.discount_value,
    'discount_amount', _discount,
    'final_price', GREATEST(_price - _discount, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_coupon_to_enrollment(_enrollment_id uuid, _code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _en RECORD;
  _c RECORD;
  _price numeric;
  _discount numeric;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT * INTO _en FROM public.enrollments WHERE id = _enrollment_id;
  IF NOT FOUND OR _en.user_id <> _uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF _en.coupon_code IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_applied');
  END IF;

  SELECT * INTO _c FROM public.coupons WHERE code = _code AND active = true FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  IF _c.expires_at IS NOT NULL AND _c.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  IF _c.max_uses IS NOT NULL AND _c.used_count >= _c.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'exhausted');
  END IF;

  IF _c.course_id IS NOT NULL AND _c.course_id <> _en.course_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'wrong_course');
  END IF;

  IF EXISTS (SELECT 1 FROM public.coupon_redemptions WHERE coupon_id = _c.id AND user_id = _uid) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_used');
  END IF;

  SELECT COALESCE(price, 0) INTO _price FROM public.courses WHERE id = _en.course_id;
  IF _c.discount_type = 'percent' THEN
    _discount := round(_price * _c.discount_value / 100.0, 2);
  ELSE
    _discount := LEAST(_c.discount_value, _price);
  END IF;

  -- Bypass enrollment guard for this trusted definer-context update
  PERFORM set_config('app.bypass_enrollment_guard', 'on', true);
  UPDATE public.enrollments
     SET coupon_code = _c.code,
         discount_amount = _discount
   WHERE id = _enrollment_id;
  PERFORM set_config('app.bypass_enrollment_guard', 'off', true);

  INSERT INTO public.coupon_redemptions(coupon_id, user_id, enrollment_id, discount_amount)
  VALUES (_c.id, _uid, _enrollment_id, _discount);

  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = _c.id;

  RETURN jsonb_build_object(
    'ok', true,
    'discount_amount', _discount,
    'final_price', GREATEST(_price - _discount, 0)
  );
END;
$function$;
DROP FUNCTION IF EXISTS public.enrollment_tenant(uuid);
DROP FUNCTION IF EXISTS public.tenant_cert_path_ok(uuid, uuid, text);

-- restore original public RPCs
CREATE OR REPLACE FUNCTION public.get_featured_feedback() RETURNS TABLE (
  id uuid, trainee_name text, course_title text, rating numeric, comments text, created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id,
    split_part(coalesce(nullif(e.name_ar,''), nullif(p.full_name,''), 'متدرب'), ' ', 1)
      || coalesce(' ' || left(nullif(split_part(coalesce(nullif(e.name_ar,''), p.full_name, ''), ' ', 2),''),1) || '.', ''),
    c.title,
    round((coalesce(f.content_rating,0)+coalesce(f.trainer_rating,0)+coalesce(f.expectations_rating,0))::numeric
      / nullif((f.content_rating IS NOT NULL)::int+(f.trainer_rating IS NOT NULL)::int+(f.expectations_rating IS NOT NULL)::int,0), 1),
    f.comments, f.created_at
  FROM public.course_feedback f
  JOIN public.courses c ON c.id = f.course_id
  LEFT JOIN public.profiles p ON p.id = f.user_id
  LEFT JOIN public.enrollments e ON e.user_id = f.user_id AND e.course_id = f.course_id
  WHERE f.is_featured AND f.comments IS NOT NULL AND length(trim(f.comments)) > 0
  ORDER BY f.created_at DESC LIMIT 24
$$;
CREATE OR REPLACE FUNCTION public.verify_certificate(_enrollment_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN e.id IS NULL OR e.certificate_issued = false THEN
      jsonb_build_object('ok', false, 'error', 'not_found')
    ELSE
      jsonb_build_object(
        'ok', true,
        'trainee_name_ar', e.name_ar,
        'trainee_name_en', e.name_en,
        'course_title', c.title,
        'course_description', c.description,
        'total_hours', c.total_hours,
        'issued_at', e.updated_at,
        'certificate_id', e.id
      )
  END
  FROM public.enrollments e
  LEFT JOIN public.courses c ON c.id = e.course_id
  WHERE e.id = _enrollment_id;
$$;

COMMIT;
