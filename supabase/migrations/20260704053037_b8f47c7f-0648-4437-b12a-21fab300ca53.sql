
-- Extend profile guard to protect force_password_reset
CREATE OR REPLACE FUNCTION public.trg_profile_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.account_blocked IS DISTINCT FROM OLD.account_blocked THEN
    RAISE EXCEPTION 'Not allowed to modify account_blocked';
  END IF;
  IF NEW.activation_status IS DISTINCT FROM OLD.activation_status
     OR NEW.activated_at IS DISTINCT FROM OLD.activated_at THEN
    RAISE EXCEPTION 'Not allowed to modify activation status';
  END IF;
  IF NEW.force_password_reset IS DISTINCT FROM OLD.force_password_reset THEN
    RAISE EXCEPTION 'Not allowed to modify force_password_reset';
  END IF;
  RETURN NEW;
END;
$$;

-- Booking guard: block non-admin edits to slot definition fields
CREATE OR REPLACE FUNCTION public.trg_booking_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.starts_at IS DISTINCT FROM OLD.starts_at
     OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    RAISE EXCEPTION 'Not allowed to modify protected slot fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_guard ON public.consultation_slots;
CREATE TRIGGER trg_booking_guard
BEFORE UPDATE ON public.consultation_slots
FOR EACH ROW EXECUTE FUNCTION public.trg_booking_guard();
