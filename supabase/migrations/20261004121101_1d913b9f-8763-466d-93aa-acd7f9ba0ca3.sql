REVOKE EXECUTE ON FUNCTION public.cancel_my_booking(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reschedule_my_booking(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_booking_slots(date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._cancel_slot(public.consultation_slots, text) FROM PUBLIC, anon, authenticated;