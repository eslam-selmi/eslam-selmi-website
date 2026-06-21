
-- Consultation booking slots (30-min, admin creates, trainee books, free)
CREATE TABLE public.consultation_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  booked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  booked_at timestamptz,
  booker_name text,
  booker_phone text,
  topic text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX consultation_slots_starts_at_uq ON public.consultation_slots(starts_at);
CREATE INDEX consultation_slots_booked_by_idx ON public.consultation_slots(booked_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_slots TO authenticated;
GRANT ALL ON public.consultation_slots TO service_role;

ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view all slots (to see available + their own)
CREATE POLICY "Authenticated can view consultation slots"
  ON public.consultation_slots FOR SELECT TO authenticated
  USING (true);

-- Admin full control
CREATE POLICY "Admin manage consultation slots"
  ON public.consultation_slots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Authenticated trainee can claim an unbooked slot for themselves
CREATE POLICY "User can book an open slot"
  ON public.consultation_slots FOR UPDATE TO authenticated
  USING (booked_by IS NULL)
  WITH CHECK (booked_by = auth.uid());

-- Trigger: guard non-admin updates to only allow claim, then notify admin
CREATE OR REPLACE FUNCTION public.trg_slot_book_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _name text;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Non-admin: only allow setting booking fields on a previously open slot
  IF NEW.starts_at IS DISTINCT FROM OLD.starts_at
     OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    RAISE EXCEPTION 'Not allowed to modify slot definition';
  END IF;
  IF OLD.booked_by IS NOT NULL THEN
    RAISE EXCEPTION 'Slot already booked';
  END IF;
  IF NEW.booked_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Can only book for yourself';
  END IF;
  NEW.booked_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_slot_book_guard
  BEFORE UPDATE ON public.consultation_slots
  FOR EACH ROW EXECUTE FUNCTION public.trg_slot_book_guard();

-- Notify admin after a booking is recorded
CREATE OR REPLACE FUNCTION public.trg_slot_booked_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _name text;
BEGIN
  IF NEW.booked_by IS NOT NULL AND OLD.booked_by IS NULL THEN
    SELECT COALESCE(full_name, email) INTO _name FROM public.profiles WHERE id = NEW.booked_by;
    PERFORM public.notify_admins(
      'حجز استشارة جديد 📅',
      COALESCE(_name, 'متدرب') || ' حجز موعد ' ||
        to_char(NEW.starts_at AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD HH24:MI'),
      '/admin?tab=bookings'
    );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_slot_booked_notify
  AFTER UPDATE ON public.consultation_slots
  FOR EACH ROW EXECUTE FUNCTION public.trg_slot_booked_notify();

CREATE TRIGGER set_consultation_slots_updated_at
  BEFORE UPDATE ON public.consultation_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- Custom countries (admin-added or user-added at signup)
CREATE TABLE public.custom_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  normalized text NOT NULL UNIQUE,
  dial text,
  flag text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.custom_countries TO anon, authenticated;
GRANT INSERT ON public.custom_countries TO authenticated;
GRANT ALL ON public.custom_countries TO service_role;

ALTER TABLE public.custom_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read custom countries"
  ON public.custom_countries FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can add a custom country"
  ON public.custom_countries FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin manage custom countries"
  ON public.custom_countries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
