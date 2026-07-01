
-- Add email tracking + 24h cooldown enforcement for consultation bookings
ALTER TABLE public.consultation_slots
  ADD COLUMN IF NOT EXISTS booker_email TEXT;

CREATE OR REPLACE FUNCTION public.enforce_booking_cooldown()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_recent_count INT;
BEGIN
  -- Only enforce when a slot transitions from unbooked to booked
  IF NEW.booked_by IS NULL THEN RETURN NEW; END IF;
  IF OLD.booked_by IS NOT NULL THEN RETURN NEW; END IF;

  -- Capture the booker's email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.booked_by;
  IF v_email IS NULL THEN RETURN NEW; END IF;

  NEW.booker_email := lower(v_email);
  NEW.booked_at := COALESCE(NEW.booked_at, now());

  -- 24h cooldown per email (skip if the same user is admin)
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
$$;

DROP TRIGGER IF EXISTS trg_enforce_booking_cooldown ON public.consultation_slots;
CREATE TRIGGER trg_enforce_booking_cooldown
BEFORE UPDATE ON public.consultation_slots
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_cooldown();

CREATE INDEX IF NOT EXISTS idx_consultation_slots_booker_email_booked_at
  ON public.consultation_slots (booker_email, booked_at DESC)
  WHERE booked_at IS NOT NULL;
