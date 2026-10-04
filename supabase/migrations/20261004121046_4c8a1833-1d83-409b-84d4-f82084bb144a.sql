ALTER TABLE public.consultation_slots
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS details text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text;
ALTER TABLE public.consultation_slots DROP CONSTRAINT IF EXISTS consultation_slots_status_chk;
ALTER TABLE public.consultation_slots ADD CONSTRAINT consultation_slots_status_chk
  CHECK (status IN ('scheduled','attended','no_show','cancelled','completed'));

DROP INDEX IF EXISTS public.consultation_slots_starts_at_uq;
CREATE UNIQUE INDEX consultation_slots_starts_at_active_uq ON public.consultation_slots(starts_at) WHERE status <> 'cancelled';

CREATE TABLE IF NOT EXISTS public.booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  work_days int[] NOT NULL DEFAULT '{0,1,2,3,4}',
  start_time time NOT NULL DEFAULT '10:00',
  end_time time NOT NULL DEFAULT '18:00',
  slot_minutes int NOT NULL DEFAULT 30,
  buffer_minutes int NOT NULL DEFAULT 10,
  break_start time,
  break_end time,
  timezone text NOT NULL DEFAULT 'Africa/Cairo',
  default_meeting_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.booking_settings TO authenticated;
GRANT ALL ON public.booking_settings TO service_role;
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage booking settings" ON public.booking_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER set_booking_settings_updated_at BEFORE UPDATE ON public.booking_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.booking_settings (singleton) VALUES (true) ON CONFLICT DO NOTHING;

-- Guards: allow trusted RPCs to bypass; non-admin cannot touch status / link
CREATE OR REPLACE FUNCTION public.trg_slot_book_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _url text;
BEGIN
  IF current_setting('app.bypass_slot_guard', true) = 'on' THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  IF NEW.starts_at IS DISTINCT FROM OLD.starts_at
     OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.meeting_url IS DISTINCT FROM OLD.meeting_url
     OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
     OR NEW.cancel_reason IS DISTINCT FROM OLD.cancel_reason THEN
    RAISE EXCEPTION 'Not allowed to modify slot definition';
  END IF;
  IF OLD.booked_by IS NOT NULL OR OLD.status <> 'scheduled' THEN
    RAISE EXCEPTION 'Slot already booked';
  END IF;
  IF NEW.booked_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Can only book for yourself';
  END IF;
  IF OLD.starts_at <= now() THEN RAISE EXCEPTION 'Slot in the past'; END IF;
  NEW.booked_at = now();
  SELECT default_meeting_url INTO _url FROM public.booking_settings LIMIT 1;
  NEW.meeting_url = COALESCE(OLD.meeting_url, _url);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_booking_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('app.bypass_slot_guard', true) = 'on' THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  IF NEW.starts_at IS DISTINCT FROM OLD.starts_at
     OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    RAISE EXCEPTION 'Not allowed to modify protected slot fields';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.enforce_booking_cooldown()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email TEXT; v_recent_count INT; v_purchase RECORD;
BEGIN
  IF NEW.booked_by IS NULL THEN RETURN NEW; END IF;
  IF OLD.booked_by IS NOT NULL THEN RETURN NEW; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.booked_by;
  IF v_email IS NULL THEN RETURN NEW; END IF;
  NEW.booker_email := lower(v_email);
  NEW.booked_at := COALESCE(NEW.booked_at, now());
  IF NEW.package_purchase_id IS NOT NULL THEN
    SELECT * INTO v_purchase FROM public.consultation_package_purchases WHERE id = NEW.package_purchase_id FOR UPDATE;
    IF NOT FOUND OR v_purchase.user_id <> NEW.booked_by THEN RAISE EXCEPTION 'INVALID_PACKAGE'; END IF;
    IF v_purchase.status <> 'approved' OR v_purchase.sessions_remaining <= 0 THEN RAISE EXCEPTION 'PACKAGE_NOT_ACTIVE'; END IF;
    UPDATE public.consultation_package_purchases
      SET sessions_remaining = sessions_remaining - 1,
          status = CASE WHEN sessions_remaining - 1 <= 0 THEN 'exhausted' ELSE status END
      WHERE id = v_purchase.id;
    RETURN NEW;
  END IF;
  IF current_setting('app.reschedule', true) = 'on' THEN RETURN NEW; END IF;
  IF NOT public.has_role(NEW.booked_by, 'admin'::app_role) THEN
    SELECT COUNT(*) INTO v_recent_count FROM public.consultation_slots
    WHERE booker_email = lower(v_email) AND booked_at IS NOT NULL
      AND booked_at > (now() - INTERVAL '24 hours') AND id <> NEW.id AND status <> 'cancelled';
    IF v_recent_count > 0 THEN
      RAISE EXCEPTION 'BOOKING_COOLDOWN_24H' USING HINT = 'Only one consultation booking per email per 24 hours.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Internal: cancel a booking (keeps a cancelled record, reopens the time)
CREATE OR REPLACE FUNCTION public._cancel_slot(_slot public.consultation_slots, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM set_config('app.bypass_slot_guard','on',true);
  UPDATE public.consultation_slots SET status='cancelled', cancelled_at=now(), cancel_reason=_reason WHERE id=_slot.id;
  IF _slot.package_purchase_id IS NOT NULL THEN
    UPDATE public.consultation_package_purchases
      SET sessions_remaining = sessions_remaining + 1,
          status = CASE WHEN status='exhausted' THEN 'approved' ELSE status END
      WHERE id = _slot.package_purchase_id;
  END IF;
  IF _slot.starts_at > now() THEN
    INSERT INTO public.consultation_slots(starts_at, duration_minutes, meeting_url)
    SELECT _slot.starts_at, _slot.duration_minutes, NULL
    WHERE NOT EXISTS (SELECT 1 FROM public.consultation_slots WHERE starts_at=_slot.starts_at AND status<>'cancelled');
  END IF;
  PERFORM set_config('app.bypass_slot_guard','off',true);
END; $$;
REVOKE ALL ON FUNCTION public._cancel_slot(public.consultation_slots, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.cancel_my_booking(_slot_id uuid, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.consultation_slots;
BEGIN
  SELECT * INTO s FROM public.consultation_slots WHERE id=_slot_id FOR UPDATE;
  IF NOT FOUND OR s.booked_by IS DISTINCT FROM auth.uid() THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  IF s.status <> 'scheduled' THEN RETURN jsonb_build_object('ok',false,'error','not_active'); END IF;
  IF s.starts_at < now() + interval '3 hours' THEN RETURN jsonb_build_object('ok',false,'error','too_late'); END IF;
  PERFORM public._cancel_slot(s, COALESCE(left(_reason,300),'cancelled_by_client'));
  PERFORM public.notify_admins('إلغاء حجز استشارة', COALESCE(s.booker_name,'عميل') || ' ألغى موعد ' || to_char(s.starts_at AT TIME ZONE 'Africa/Cairo','YYYY-MM-DD HH24:MI'), '/admin?tab=bookings');
  RETURN jsonb_build_object('ok',true);
END; $$;
GRANT EXECUTE ON FUNCTION public.cancel_my_booking(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.reschedule_my_booking(_slot_id uuid, _new_slot_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.consultation_slots; n public.consultation_slots;
BEGIN
  SELECT * INTO s FROM public.consultation_slots WHERE id=_slot_id FOR UPDATE;
  IF NOT FOUND OR s.booked_by IS DISTINCT FROM auth.uid() THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  IF s.status <> 'scheduled' THEN RETURN jsonb_build_object('ok',false,'error','not_active'); END IF;
  IF s.starts_at < now() + interval '3 hours' THEN RETURN jsonb_build_object('ok',false,'error','too_late'); END IF;
  SELECT * INTO n FROM public.consultation_slots WHERE id=_new_slot_id FOR UPDATE;
  IF NOT FOUND OR n.booked_by IS NOT NULL OR n.status <> 'scheduled' OR n.starts_at <= now() THEN
    RETURN jsonb_build_object('ok',false,'error','slot_taken');
  END IF;
  PERFORM public._cancel_slot(s, 'rescheduled');
  PERFORM set_config('app.reschedule','on',true);
  UPDATE public.consultation_slots SET booked_by=s.booked_by, booker_name=s.booker_name, booker_phone=s.booker_phone,
    topic=s.topic, details=s.details, package_purchase_id=s.package_purchase_id
  WHERE id=n.id;
  PERFORM set_config('app.reschedule','off',true);
  PERFORM public.notify_admins('إعادة جدولة استشارة', COALESCE(s.booker_name,'عميل') || ' نقل موعده إلى ' || to_char(n.starts_at AT TIME ZONE 'Africa/Cairo','YYYY-MM-DD HH24:MI'), '/admin?tab=bookings');
  RETURN jsonb_build_object('ok',true);
END; $$;
GRANT EXECUTE ON FUNCTION public.reschedule_my_booking(uuid, uuid) TO authenticated;

-- Admin: generate open slots from working hours
CREATE OR REPLACE FUNCTION public.generate_booking_slots(_from date, _to date)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cfg public.booking_settings; d date; t time; ts timestamptz; created int := 0;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin'::app_role) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _to < _from OR _to - _from > 92 THEN RAISE EXCEPTION 'Invalid range'; END IF;
  SELECT * INTO cfg FROM public.booking_settings LIMIT 1;
  IF cfg.slot_minutes < 10 THEN RAISE EXCEPTION 'Invalid slot length'; END IF;
  d := _from;
  WHILE d <= _to LOOP
    IF extract(dow FROM d)::int = ANY(cfg.work_days) THEN
      t := cfg.start_time;
      WHILE t + make_interval(mins => cfg.slot_minutes) <= cfg.end_time AND t >= cfg.start_time LOOP
        IF cfg.break_start IS NOT NULL AND cfg.break_end IS NOT NULL
           AND t < cfg.break_end AND t + make_interval(mins => cfg.slot_minutes) > cfg.break_start THEN
          t := cfg.break_end; CONTINUE;
        END IF;
        ts := (d + t) AT TIME ZONE cfg.timezone;
        IF ts > now() AND NOT EXISTS (SELECT 1 FROM public.consultation_slots WHERE starts_at=ts AND status<>'cancelled') THEN
          INSERT INTO public.consultation_slots(starts_at, duration_minutes) VALUES (ts, cfg.slot_minutes);
          created := created + 1;
        END IF;
        t := t + make_interval(mins => cfg.slot_minutes + cfg.buffer_minutes);
      END LOOP;
    END IF;
    d := d + 1;
  END LOOP;
  RETURN created;
END; $$;
GRANT EXECUTE ON FUNCTION public.generate_booking_slots(date, date) TO authenticated;

-- Clients see only open future slots (not cancelled) or their own
DROP POLICY IF EXISTS "View open or own consultation slots" ON public.consultation_slots;
CREATE POLICY "View open or own consultation slots" ON public.consultation_slots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR booked_by = auth.uid() OR (booked_by IS NULL AND status='scheduled'));