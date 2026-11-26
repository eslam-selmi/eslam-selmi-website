-- Fix: a trainee could create a ticket but the first message was rejected, because the message trigger updates the ticket
-- (status, unread flags, last_message_at) and the ticket guard blocked that update. Updates made by another trigger are allowed;
-- direct edits of protected fields by non-admins stay blocked.
CREATE OR REPLACE FUNCTION public.trg_support_ticket_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
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
