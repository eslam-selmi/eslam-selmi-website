
-- Packages catalog
CREATE TABLE public.consultation_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text,
  description_en text,
  sessions_count int NOT NULL CHECK (sessions_count > 0),
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.consultation_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_packages TO authenticated;
GRANT ALL ON public.consultation_packages TO service_role;
ALTER TABLE public.consultation_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages" ON public.consultation_packages
  FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage packages" ON public.consultation_packages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_consultation_packages_updated
  BEFORE UPDATE ON public.consultation_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Purchases
CREATE TABLE public.consultation_package_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.consultation_packages(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','exhausted')),
  sessions_remaining int NOT NULL DEFAULT 0,
  payment_proof_url text,
  admin_notes text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_package_purchases TO authenticated;
GRANT ALL ON public.consultation_package_purchases TO service_role;
ALTER TABLE public.consultation_package_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases" ON public.consultation_package_purchases
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own purchase requests" ON public.consultation_package_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending' AND sessions_remaining = 0);
CREATE POLICY "Admins manage purchases" ON public.consultation_package_purchases
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_consultation_package_purchases_updated
  BEFORE UPDATE ON public.consultation_package_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link slot to the purchase used for booking
ALTER TABLE public.consultation_slots
  ADD COLUMN IF NOT EXISTS package_purchase_id uuid REFERENCES public.consultation_package_purchases(id) ON DELETE SET NULL;

-- Modify cooldown trigger: skip cooldown when using a package; deduct session
CREATE OR REPLACE FUNCTION public.enforce_booking_cooldown()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email TEXT;
  v_recent_count INT;
  v_purchase RECORD;
BEGIN
  IF NEW.booked_by IS NULL THEN RETURN NEW; END IF;
  IF OLD.booked_by IS NOT NULL THEN RETURN NEW; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = NEW.booked_by;
  IF v_email IS NULL THEN RETURN NEW; END IF;

  NEW.booker_email := lower(v_email);
  NEW.booked_at := COALESCE(NEW.booked_at, now());

  -- If a package_purchase_id was provided, validate + deduct + skip cooldown
  IF NEW.package_purchase_id IS NOT NULL THEN
    SELECT * INTO v_purchase FROM public.consultation_package_purchases
      WHERE id = NEW.package_purchase_id FOR UPDATE;
    IF NOT FOUND OR v_purchase.user_id <> NEW.booked_by THEN
      RAISE EXCEPTION 'INVALID_PACKAGE';
    END IF;
    IF v_purchase.status <> 'approved' OR v_purchase.sessions_remaining <= 0 THEN
      RAISE EXCEPTION 'PACKAGE_NOT_ACTIVE';
    END IF;
    UPDATE public.consultation_package_purchases
      SET sessions_remaining = sessions_remaining - 1,
          status = CASE WHEN sessions_remaining - 1 <= 0 THEN 'exhausted' ELSE status END
      WHERE id = v_purchase.id;
    RETURN NEW;
  END IF;

  -- Else: enforce 24h cooldown (admin bypass)
  IF NOT public.has_role(NEW.booked_by, 'admin'::app_role) THEN
    SELECT COUNT(*) INTO v_recent_count
    FROM public.consultation_slots
    WHERE booker_email = lower(v_email)
      AND booked_at IS NOT NULL
      AND booked_at > (now() - INTERVAL '24 hours')
      AND id <> NEW.id;
    IF v_recent_count > 0 THEN
      RAISE EXCEPTION 'BOOKING_COOLDOWN_24H'
        USING HINT = 'Only one consultation booking per email per 24 hours.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
