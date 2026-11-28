-- Evaluation update guard. Within the approved evaluation-gate scope (user thumbs-up 2026-11-28 16:34:47). A non-admin cannot move an evaluation to another course or user.
CREATE OR REPLACE FUNCTION public.trg_feedback_update_guard() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$ BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.course_id IS DISTINCT FROM OLD.course_id) THEN
    RAISE EXCEPTION 'Not allowed to move an evaluation to another course or user';
  END IF;
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS feedback_update_guard ON public.course_feedback;
CREATE TRIGGER feedback_update_guard BEFORE UPDATE ON public.course_feedback FOR EACH ROW EXECUTE FUNCTION public.trg_feedback_update_guard();
