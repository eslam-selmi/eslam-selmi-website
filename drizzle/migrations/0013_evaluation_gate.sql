-- Evaluation gate. Approved by the user (thumbs-up 2026-11-28 16:34:47 to the 16:34:10 question).
-- Does not touch issued certificates: nothing here changes certificate_issued on existing rows.
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS finished_at timestamptz;

-- All content complete (recorded: every module item has a learner completion) or the live course was marked finished by the admin.
CREATE OR REPLACE FUNCTION app_private.eval_ready(_user uuid, _course uuid)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $f$
DECLARE mode_ text; fin timestamptz; total int; left_ int;
BEGIN
  SELECT c.delivery_mode, c.finished_at INTO mode_, fin FROM courses c WHERE c.id = _course;
  IF NOT FOUND THEN RETURN false; END IF;
  IF mode_ = 'recorded' THEN
    SELECT count(*)::int, count(*) FILTER (WHERE p.completed_at IS NULL)::int INTO total, left_
      FROM course_modules m JOIN module_items mi ON mi.module_id = m.id
      LEFT JOIN learner_item_progress p ON p.item_id = mi.id AND p.user_id = _user
     WHERE m.course_id = _course;
    RETURN total > 0 AND left_ = 0;
  END IF;
  RETURN fin IS NOT NULL;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $f$;
REVOKE ALL ON FUNCTION app_private.eval_ready(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.my_eval_ready(_course uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $f$ SELECT auth.uid() IS NOT NULL AND app_private.eval_ready(auth.uid(), _course) $f$;
REVOKE ALL ON FUNCTION public.my_eval_ready(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_eval_ready(uuid) TO authenticated;

-- 1. A trainee cannot submit an evaluation before the content is complete (or the live course is marked finished).
CREATE OR REPLACE FUNCTION public.trg_feedback_ready_guard() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$ BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND NOT app_private.eval_ready(NEW.user_id, NEW.course_id) THEN
    RAISE EXCEPTION 'Course evaluation is not available yet';
  END IF;
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS feedback_ready_guard ON public.course_feedback;
CREATE TRIGGER feedback_ready_guard BEFORE INSERT ON public.course_feedback FOR EACH ROW EXECUTE FUNCTION public.trg_feedback_ready_guard();

-- 2. Certificate gate: add the 'feedback' blocker (everything else is the live definition, unchanged).
CREATE OR REPLACE FUNCTION app_private.certificate_gate_for(_enrollment uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE e enrollments%ROWTYPE; mode_ text; grad_req boolean; grad_ok boolean; fin text; b text[] := '{}'; vt record;
BEGIN
  SELECT * INTO e FROM enrollments WHERE id = _enrollment;
  IF NOT FOUND OR e.status <> 'approved' OR e.blocked THEN RETURN jsonb_build_object('status','unknown'); END IF;
  IF e.certificate_issued THEN RETURN jsonb_build_object('status','issued'); END IF;
  fin := public.certificate_finance_state(e.id);
  IF fin = 'debt' THEN b := array_append(b, 'debt'::text); ELSIF fin <> 'clear' THEN b := array_append(b, 'finance_unknown'::text); END IF;
  SELECT c.delivery_mode INTO mode_ FROM courses c WHERE c.id = e.course_id;
  IF mode_ = 'recorded' THEN
    SELECT * INTO vt FROM app_private.course_videos_state(e.id);
    IF vt.left_ > 0 THEN b := array_append(b, 'content'::text); END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM course_feedback f WHERE f.user_id = e.user_id AND f.course_id = e.course_id) THEN b := array_append(b, 'feedback'::text); END IF;
  SELECT count(*) > 0 INTO grad_req FROM assignments a WHERE a.course_id = e.course_id AND a.is_graduation_project;
  IF grad_req THEN
    SELECT EXISTS (SELECT 1 FROM assignments a JOIN assignment_submissions s ON s.assignment_id = a.id AND s.user_id = e.user_id
      JOIN graduation_approvals ga ON ga.assignment_id = a.id AND ga.user_id = e.user_id
      WHERE a.course_id = e.course_id AND a.is_graduation_project) INTO grad_ok;
    IF NOT grad_ok THEN b := array_append(b, 'graduation'::text); END IF;
  END IF;
  IF e.name_ar IS NULL OR e.name_en IS NULL THEN b := array_append(b, 'names'::text); END IF;
  IF array_length(b,1) IS NULL THEN RETURN jsonb_build_object('status','ok'); END IF;
  RETURN jsonb_build_object('status', b[1], 'blockers', to_jsonb(b));
EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('status','unknown');
END $function$;

-- 3. No false -> true certificate flip, by anyone including admins, without an evaluation. Issued rows are not touched.
CREATE OR REPLACE FUNCTION public.trg_cert_requires_feedback() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$ BEGIN
  IF COALESCE(NEW.certificate_issued,false) AND NOT COALESCE(OLD.certificate_issued,false)
     AND NOT EXISTS (SELECT 1 FROM course_feedback f WHERE f.user_id = NEW.user_id AND f.course_id = NEW.course_id) THEN
    RAISE EXCEPTION 'Course evaluation is required before issuing the certificate';
  END IF;
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS cert_requires_feedback ON public.enrollments;
CREATE TRIGGER cert_requires_feedback BEFORE UPDATE OF certificate_issued ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.trg_cert_requires_feedback();

-- 4. After the evaluation is saved, auto-issue is retried (recorded courses only, same gate as before).
CREATE OR REPLACE FUNCTION app_private.trg_feedback_auto_issue() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$ DECLARE eid uuid; BEGIN
  SELECT id INTO eid FROM enrollments WHERE user_id = NEW.user_id AND course_id = NEW.course_id LIMIT 1;
  IF eid IS NOT NULL THEN PERFORM app_private.try_auto_issue(eid); END IF;
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS auto_issue_on_feedback ON public.course_feedback;
CREATE TRIGGER auto_issue_on_feedback AFTER INSERT ON public.course_feedback FOR EACH ROW EXECUTE FUNCTION app_private.trg_feedback_auto_issue();
