-- Recorded-course automatic certificate: server rules.
-- Applies ONLY after the owner's approval (user 14:40:07 thumbs-up to the 14:38:26 question). Nothing here revokes or backfills certificates.
-- Single transaction. Flags are NOT changed here (see 02_flag_on.sql, run after verification).

-- 1. Videos still not fully watched for an enrollment (youtube, video_file, embedded vimeo/drive). Embedded stay incomplete (not measurable).
CREATE OR REPLACE FUNCTION app_private.course_videos_state(_enrollment uuid, OUT total int, OUT left_ int)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $f$
  SELECT count(*)::int,
         count(*) FILTER (WHERE p.completed_at IS NULL)::int
    FROM enrollments e
    JOIN course_modules m ON m.course_id = e.course_id
    JOIN module_items mi ON mi.module_id = m.id
    LEFT JOIN learner_item_progress p ON p.item_id = mi.id AND p.user_id = e.user_id
   WHERE e.id = _enrollment
     AND public.item_media_class(mi.kind, mi.url) IN ('youtube','video_file','embed_other')
$f$;
REVOKE ALL ON FUNCTION app_private.course_videos_state(uuid) FROM PUBLIC, anon, authenticated;

-- 2. Gate by enrollment id (no auth.uid()); same checks as before + 'content' for recorded courses.
CREATE OR REPLACE FUNCTION app_private.certificate_gate_for(_enrollment uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $f$
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
EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('status','unknown');   -- fail closed
END $f$;
REVOKE ALL ON FUNCTION app_private.certificate_gate_for(uuid) FROM PUBLIC, anon, authenticated;

-- 3. Learner-facing gate keeps its signature and owner check.
CREATE OR REPLACE FUNCTION public.my_certificate_gate(_enrollment uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $f$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('status','unknown'); END IF;
  IF NOT EXISTS (SELECT 1 FROM enrollments WHERE id = _enrollment AND user_id = uid) THEN RETURN jsonb_build_object('status','unknown'); END IF;
  RETURN app_private.certificate_gate_for(_enrollment);
END $f$;

-- 4. Progress: a video completes only at 100% of distinct watched seconds (was 90%). Everything else unchanged.
CREATE OR REPLACE FUNCTION public.save_my_item_progress(
  _item uuid, 
  _opened boolean, 
  _seconds integer[], 
  _completed boolean
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); kind_ text; trusted integer; p learner_item_progress%ROWTYPE; dur integer;
        merged integer[]; allowed integer; elapsed numeric; done boolean := false; reason text := null;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF NOT app_private.feature_enabled('learner_progress') THEN RETURN jsonb_build_object('completed', false, 'reason', 'disabled'); END IF;
  SELECT public.item_media_class(mi.kind, mi.url), mi.duration_seconds INTO kind_, trusted FROM module_items mi JOIN course_modules m ON m.id = mi.module_id
   JOIN enrollments e ON e.course_id = m.course_id AND e.user_id = uid AND e.status = 'approved' AND NOT e.blocked
   WHERE mi.id = _item LIMIT 1;
  IF kind_ IS NULL THEN RAISE EXCEPTION 'item not available'; END IF;

  INSERT INTO learner_item_progress (user_id, item_id, first_seen_at) VALUES (uid, _item, now()) ON CONFLICT (user_id, item_id) DO NOTHING;
  SELECT * INTO p FROM learner_item_progress WHERE user_id = uid AND item_id = _item FOR UPDATE;

  IF kind_ = 'embed_other' THEN
    UPDATE learner_item_progress SET opened_at = coalesce(opened_at, CASE WHEN _opened THEN now() END) WHERE user_id = uid AND item_id = _item;
    RETURN jsonb_build_object('completed', false, 'reason', 'unsupported_video');
  END IF;
  IF kind_ NOT IN ('video_file','youtube') THEN
    done := coalesce(_opened, false) AND coalesce(_completed, false);
    UPDATE learner_item_progress SET opened_at = coalesce(opened_at, CASE WHEN _opened THEN now() END),
      completed_at = coalesce(completed_at, CASE WHEN done THEN now() END) WHERE user_id = uid AND item_id = _item;
    RETURN jsonb_build_object('completed', done);
  END IF;

  dur := trusted;
  IF dur IS NULL THEN reason := 'duration_unknown'; END IF;

  SELECT array(SELECT DISTINCT s FROM unnest(p.watched_seconds || coalesce(_seconds,'{}')) s
               WHERE s >= 0 AND (dur IS NULL OR s < dur) ORDER BY s) INTO merged;
  elapsed := extract(epoch FROM (now() - coalesce(p.first_seen_at, now())));
  allowed := floor(elapsed * 2) + 15;
  IF coalesce(array_length(merged,1),0) > allowed THEN
    -- more seconds than real time allows: keep only what was already stored, record nothing new
    merged := p.watched_seconds; reason := coalesce(reason,'too_fast');
  END IF;

  done := reason IS NULL AND dur IS NOT NULL AND coalesce(array_length(merged,1),0) >= dur;
  UPDATE learner_item_progress SET
    opened_at = coalesce(opened_at, CASE WHEN _opened THEN now() END),
    watched_seconds = merged,
    completed_at = coalesce(completed_at, CASE WHEN done THEN now() END)
   WHERE user_id = uid AND item_id = _item;
  RETURN jsonb_build_object('completed', done, 'counted', coalesce(array_length(merged,1),0), 'duration', dur, 'reason', reason);
END $function$;

-- 5. Automatic issuance for RECORDED courses only. Idempotent, row-locked, same one-time-token path as the learner function.
-- Requires at least one video (a recorded course with no videos stays manual) and every video completed, so no one is issued from history alone.
CREATE OR REPLACE FUNCTION app_private.try_auto_issue(_enrollment uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$
DECLARE e enrollments%ROWTYPE; mode_ text; vt record; tok uuid; n int;
BEGIN
  SELECT * INTO e FROM enrollments WHERE id = _enrollment FOR UPDATE;
  IF NOT FOUND OR e.certificate_issued OR e.status <> 'approved' OR e.blocked THEN RETURN false; END IF;
  SELECT c.delivery_mode INTO mode_ FROM courses c WHERE c.id = e.course_id;
  IF mode_ IS DISTINCT FROM 'recorded' THEN RETURN false; END IF;
  SELECT * INTO vt FROM app_private.course_videos_state(e.id);
  IF coalesce(vt.total,0) = 0 OR vt.left_ > 0 THEN RETURN false; END IF;
  IF app_private.certificate_gate_for(e.id)->>'status' <> 'ok' THEN RETURN false; END IF;
  tok := gen_random_uuid();
  INSERT INTO app_private.cert_issue_token(enrollment_id, token) VALUES (e.id, tok) ON CONFLICT (enrollment_id) DO UPDATE SET token = EXCLUDED.token;
  PERFORM set_config('app.cert_issue_token', tok::text, true);
  UPDATE enrollments SET certificate_issued = true
   WHERE id = e.id AND NOT certificate_issued;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM set_config('app.cert_issue_token', '', true);
  DELETE FROM app_private.cert_issue_token WHERE enrollment_id = e.id;
  RETURN n = 1;
END $f$;
REVOKE ALL ON FUNCTION app_private.try_auto_issue(uuid) FROM PUBLIC, anon, authenticated;

-- 6. Triggers: re-evaluate the ONE affected enrollment on each eligibility change. Never mass-evaluates a course.
CREATE OR REPLACE FUNCTION app_private.trg_auto_issue_progress() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE r uuid;
BEGIN
  IF NEW.completed_at IS NULL THEN RETURN NEW; END IF;
  FOR r IN SELECT e.id FROM enrollments e JOIN course_modules m ON m.course_id = e.course_id JOIN module_items mi ON mi.module_id = m.id
            WHERE mi.id = NEW.item_id AND e.user_id = NEW.user_id AND NOT e.certificate_issued LOOP
    PERFORM app_private.try_auto_issue(r);
  END LOOP;
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS auto_issue_on_progress ON public.learner_item_progress;
CREATE TRIGGER auto_issue_on_progress AFTER INSERT OR UPDATE OF completed_at ON public.learner_item_progress FOR EACH ROW EXECUTE FUNCTION app_private.trg_auto_issue_progress();

CREATE OR REPLACE FUNCTION app_private.trg_auto_issue_installment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
BEGIN
  IF TG_OP = 'DELETE' THEN PERFORM app_private.try_auto_issue(OLD.enrollment_id); RETURN OLD; END IF;
  PERFORM app_private.try_auto_issue(NEW.enrollment_id);
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS auto_issue_on_installment ON public.installments;
CREATE TRIGGER auto_issue_on_installment AFTER INSERT OR UPDATE OR DELETE ON public.installments FOR EACH ROW EXECUTE FUNCTION app_private.trg_auto_issue_installment();
DROP TRIGGER IF EXISTS auto_issue_on_payment ON public.payments;
CREATE TRIGGER auto_issue_on_payment AFTER INSERT OR UPDATE OF status, amount ON public.payments FOR EACH ROW EXECUTE FUNCTION app_private.trg_auto_issue_installment();

CREATE OR REPLACE FUNCTION app_private.trg_auto_issue_enrollment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
BEGIN
  PERFORM app_private.try_auto_issue(NEW.id);
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS auto_issue_on_enrollment ON public.enrollments;
CREATE TRIGGER auto_issue_on_enrollment AFTER UPDATE OF status, blocked, name_ar, name_en, discount_amount ON public.enrollments FOR EACH ROW EXECUTE FUNCTION app_private.trg_auto_issue_enrollment();

CREATE OR REPLACE FUNCTION app_private.trg_auto_issue_graduation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE r uuid; uid_ uuid; aid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN uid_ := OLD.user_id; aid := OLD.assignment_id; ELSE uid_ := NEW.user_id; aid := NEW.assignment_id; END IF;
  FOR r IN SELECT e.id FROM enrollments e JOIN assignments a ON a.course_id = e.course_id WHERE a.id = aid AND e.user_id = uid_ AND NOT e.certificate_issued LOOP
    PERFORM app_private.try_auto_issue(r);
  END LOOP;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS auto_issue_on_graduation ON public.graduation_approvals;
CREATE TRIGGER auto_issue_on_graduation AFTER INSERT OR UPDATE OR DELETE ON public.graduation_approvals FOR EACH ROW EXECUTE FUNCTION app_private.trg_auto_issue_graduation();
DROP TRIGGER IF EXISTS auto_issue_on_submission ON public.assignment_submissions;
CREATE TRIGGER auto_issue_on_submission AFTER INSERT ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION app_private.trg_auto_issue_graduation();