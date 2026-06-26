
-- 1) course_interests: validate insert
DROP POLICY IF EXISTS "anyone can insert interest" ON public.course_interests;
CREATE POLICY "anyone can insert interest"
  ON public.course_interests FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 200
    AND char_length(email) BETWEEN 5 AND 320
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND (phone IS NULL OR char_length(phone) <= 30)
    AND (notes IS NULL OR char_length(notes) <= 2000)
    AND (user_agent IS NULL OR char_length(user_agent) <= 500)
    AND (course_title IS NULL OR char_length(course_title) <= 300)
    AND (country_code IS NULL OR char_length(country_code) <= 80)
    AND char_length(language) <= 8
  );

-- 2) consultation_slots: restrict select to admin + own bookings + open (unbooked) slots
DROP POLICY IF EXISTS "Authenticated can view consultation slots" ON public.consultation_slots;
CREATE POLICY "View open or own consultation slots"
  ON public.consultation_slots FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR booked_by = auth.uid()
    OR booked_by IS NULL
  );

-- 3) custom_countries: drop permissive authenticated insert (admin-manage policy still allows admins)
DROP POLICY IF EXISTS "Authenticated can add a custom country" ON public.custom_countries;

-- 4) enrollments: extend trainee guard to protect discount_amount/coupon_code,
-- with an escape hatch for SECURITY DEFINER RPCs (apply_coupon_to_enrollment).
CREATE OR REPLACE FUNCTION public.trg_enrollment_guard_trainee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip guard if caller is admin
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Allow trusted SECURITY DEFINER RPCs (e.g., coupon application) to bypass via session GUC
  IF current_setting('app.bypass_enrollment_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;
  -- Otherwise the only mutator is the trainee themselves: lock down sensitive fields
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
     OR NEW.coupon_code IS DISTINCT FROM OLD.coupon_code THEN
    RAISE EXCEPTION 'Not allowed to modify protected enrollment fields';
  END IF;
  RETURN NEW;
END;
$function$;

-- Patch coupon RPC to set the bypass GUC for its scope
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
