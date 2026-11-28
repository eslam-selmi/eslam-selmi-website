-- DRAFT, NOT APPLIED. Written without access to the live function bodies (not in the repo).
-- Rule (user, 2026-11-28 14:21:59): the certificate requires every RECORDED video of the course to be fully watched.
-- Live sessions, files and links never block. Legacy admin marks (course_modules.completed_by_admin) are not used.
-- Additive: creates one helper. Wiring it into my_certificate_gate / issue_my_certificate must be done AFTER reading their current
-- definitions (see docs/proposals/lovable-prompt-recorded-video-gate.md), so debt / graduation / names checks stay exactly as they are.

create or replace function public.course_videos_left(_user uuid, _course uuid)
returns integer
language sql stable security definer set search_path = public
as $$
  select count(*)::int
  from public.module_items i
  join public.course_modules m on m.id = i.module_id
  where m.course_id = _course
    and (
      i.url ~* '^https?://(((www|m)\.)?youtube(-nocookie)?\.com/(watch\?([^#]*&)?v=|shorts/|live/|embed/)[A-Za-z0-9_-]{11}|(www\.)?youtu\.be/[A-Za-z0-9_-]{11})'
      or (i.kind in ('file','video') and i.url ~* '\.(mp4|webm|mov|m4v)(\?|$)')
      or i.url ~* '^https?://((www|player)\.)?vimeo\.com/' or i.url ~* '^https?://drive\.google\.com/'  -- embedded, not measurable yet: stays incomplete, never exempted
    )
    and not exists (
      select 1 from public.learner_item_progress p
      where p.user_id = _user and p.item_id = i.id and p.completed_at is not null
    );
$$;
revoke all on function public.course_videos_left(uuid, uuid) from public, anon, authenticated;
-- Called only from inside the (security definer) gate / issue functions, never by clients directly.

-- Intended wiring (pseudo, apply inside the existing functions after the existing checks and before 'ok'):
--   if public.course_videos_left(auth.uid(), <enrollment's course_id>) > 0 then return jsonb_build_object('status','content', ...);
-- issue_my_certificate must run the same check itself (do not rely on the client calling the gate first).
-- save_my_item_progress must (verify, change only if missing): ignore _completed for recorded videos; mark a video complete only when
-- distinct played seconds >= floor(module_items.duration_seconds) (full duration); reject seconds >= duration or < 0; accept
-- _completed for non-video items only if opened_at is already set; require the caller to be approved on the item's course.
