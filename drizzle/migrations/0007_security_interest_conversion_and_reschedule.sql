CREATE OR REPLACE FUNCTION public.convert_course_interest_on_enrollment()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE profile_email text; profile_phone text;
BEGIN
  IF NEW.course_id IS NULL OR NEW.user_id IS NULL OR NEW.status <> 'approved' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN RETURN NEW; END IF;
  SELECT lower(nullif(email, '')), nullif(phone, '') INTO profile_email, profile_phone FROM public.profiles WHERE id = NEW.user_id;
  UPDATE public.course_interests SET status = 'converted', updated_at = now()
  WHERE course_id = NEW.course_id AND status <> 'converted'
    AND ((profile_email IS NOT NULL AND lower(email) = profile_email) OR (profile_phone IS NOT NULL AND phone = profile_phone));
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.reschedule_my_booking(_slot_id uuid, _new_slot_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
  -- A reschedule moves the same session; undo the refund made by _cancel_slot.
  IF s.package_purchase_id IS NOT NULL THEN
    UPDATE public.consultation_package_purchases
      SET sessions_remaining = sessions_remaining - 1,
          status = CASE WHEN sessions_remaining - 1 <= 0 AND status='approved' THEN 'exhausted' ELSE status END
      WHERE id = s.package_purchase_id;
  END IF;
  PERFORM set_config('app.reschedule','on',true);
  UPDATE public.consultation_slots SET booked_by=s.booked_by, booker_name=s.booker_name, booker_phone=s.booker_phone,
    topic=s.topic, details=s.details, package_purchase_id=s.package_purchase_id
  WHERE id=n.id;
  PERFORM set_config('app.reschedule','off',true);
  PERFORM public.notify_admins('إعادة جدولة استشارة', COALESCE(s.booker_name,'عميل') || ' نقل موعده إلى ' || to_char(n.starts_at AT TIME ZONE 'Africa/Cairo','YYYY-MM-DD HH24:MI'), '/admin?tab=bookings');
  RETURN jsonb_build_object('ok',true);
END; $function$;