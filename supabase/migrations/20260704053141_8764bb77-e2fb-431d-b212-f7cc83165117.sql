
-- Extend enrollment guard to also protect grace_until
CREATE OR REPLACE FUNCTION public.trg_enrollment_guard_trainee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF current_setting('app.bypass_enrollment_guard', true) = 'on' THEN
    RETURN NEW;
  END IF;
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
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollment_guard_trainee ON public.enrollments;
CREATE TRIGGER trg_enrollment_guard_trainee
BEFORE UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.trg_enrollment_guard_trainee();

-- Support ticket guard: prevent non-admin users from tampering with status/subject/unread_for_admin
CREATE OR REPLACE FUNCTION public.trg_support_ticket_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.subject IS DISTINCT FROM OLD.subject
     OR NEW.unread_for_admin IS DISTINCT FROM OLD.unread_for_admin
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.last_message_at IS DISTINCT FROM OLD.last_message_at THEN
    RAISE EXCEPTION 'Not allowed to modify protected support ticket fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_ticket_guard ON public.support_tickets;
CREATE TRIGGER trg_support_ticket_guard
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.trg_support_ticket_guard();
