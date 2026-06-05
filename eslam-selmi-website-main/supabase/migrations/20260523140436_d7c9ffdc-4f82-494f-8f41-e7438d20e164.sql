
-- Coupons table
CREATE TYPE public.coupon_discount_type AS ENUM ('percent', 'fixed');

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type public.coupon_discount_type NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  course_id uuid NULL,
  max_uses integer NULL CHECK (max_uses IS NULL OR max_uses > 0),
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NULL,
  active boolean NOT NULL DEFAULT true,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupons_code ON public.coupons(code);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage coupons"
ON public.coupons FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can only see active, non-expired coupons (for code validation)
CREATE POLICY "authenticated view active coupons"
ON public.coupons FOR SELECT
TO authenticated
USING (
  active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_uses IS NULL OR used_count < max_uses)
);

CREATE TRIGGER coupons_set_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Redemptions table — one row per (coupon, user) to prevent reuse
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL,
  user_id uuid NOT NULL,
  enrollment_id uuid NOT NULL UNIQUE,
  discount_amount numeric NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)
);

CREATE INDEX idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage redemptions"
ON public.coupon_redemptions FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user view own redemptions"
ON public.coupon_redemptions FOR SELECT
USING (auth.uid() = user_id);

-- Add coupon fields on enrollments
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS coupon_code text NULL,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;

-- Helper RPC: validate a coupon for a given course, returns discount info or error
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

REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, uuid) TO authenticated;

-- Apply RPC: atomically applies coupon to an enrollment (updates enrollment, inserts redemption, increments used_count)
CREATE OR REPLACE FUNCTION public.apply_coupon_to_enrollment(_enrollment_id uuid, _code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Use admin path to bypass enrollment-guard trigger on protected fields
  UPDATE public.enrollments
     SET coupon_code = _c.code,
         discount_amount = _discount
   WHERE id = _enrollment_id;

  INSERT INTO public.coupon_redemptions(coupon_id, user_id, enrollment_id, discount_amount)
  VALUES (_c.id, _uid, _enrollment_id, _discount);

  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = _c.id;

  RETURN jsonb_build_object(
    'ok', true,
    'discount_amount', _discount,
    'final_price', GREATEST(_price - _discount, 0)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_coupon_to_enrollment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_coupon_to_enrollment(uuid, text) TO authenticated;
