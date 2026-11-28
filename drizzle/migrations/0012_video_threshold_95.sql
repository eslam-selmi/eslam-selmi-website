-- DRAFT, NOT APPLIED. Video completion threshold: 95% of distinct watched seconds (user message 2026-11-28 16:12, was 100%).
-- Only change vs 0009: the `done` line uses ceil(0.95 * trusted duration_seconds). Everything else (too_fast guard, trusted duration,
-- seconds < duration, idempotent completed_at, auto-issue path) is unchanged. Existing rows are not rewritten: a row at >=95% completes
-- on its next save (the player saves on open-playback, pause, seek and end). No retroactive completion is written by this migration.

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

  done := reason IS NULL AND dur IS NOT NULL AND coalesce(array_length(merged,1),0) >= ceil(dur * 0.95);
  UPDATE learner_item_progress SET
    opened_at = coalesce(opened_at, CASE WHEN _opened THEN now() END),
    watched_seconds = merged,
    completed_at = coalesce(completed_at, CASE WHEN done THEN now() END)
   WHERE user_id = uid AND item_id = _item;
  RETURN jsonb_build_object('completed', done, 'counted', coalesce(array_length(merged,1),0), 'duration', dur, 'reason', reason);
END $function$;
