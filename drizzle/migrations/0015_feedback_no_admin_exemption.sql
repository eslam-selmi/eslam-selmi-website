-- Admin feedback exemption removed (same approved evaluation-gate scope, user thumbs-up 2026-11-28 16:34:47). Everyone, admins included, needs eval_ready to insert an evaluation, and only the learner can create their own. Ids cannot be moved by anyone.
CREATE OR REPLACE FUNCTION public.trg_feedback_ready_guard() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$ BEGIN
  IF NOT app_private.eval_ready(NEW.user_id, NEW.course_id) THEN
    RAISE EXCEPTION 'Course evaluation is not available yet';
  END IF;
  IF auth.uid() IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'An evaluation can only be created by the learner it belongs to';
  END IF;
  RETURN NEW;
END $f$;
CREATE OR REPLACE FUNCTION public.trg_feedback_update_guard() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$ BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.course_id IS DISTINCT FROM OLD.course_id THEN
    RAISE EXCEPTION 'Not allowed to move an evaluation to another course or user';
  END IF;
  RETURN NEW;
END $f$;
