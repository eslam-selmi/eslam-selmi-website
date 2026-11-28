# Lovable prompt, step 1 (read only), then step 2 (change). Not sent. Needs the owner's approval to paste.

## Step 1: read only, change nothing
Show me the current full SQL definitions of: public.save_my_item_progress, public.my_certificate_gate, public.issue_my_certificate, and the table definition + RLS policies of public.learner_item_progress. Do not change anything.

## Step 2: change (only after step 1 output is checked against the draft)
Add the helper function in docs/proposals/sql/recorded_video_certificate_gate.draft.sql. Then change only these rules, keeping every other check (debt, graduation, names, suspension) exactly as it is:
1. my_certificate_gate and issue_my_certificate return status 'content' when the course still has any recorded video not fully watched (course_videos_left > 0). issue_my_certificate must enforce this itself.
2. Live sessions, files and links must never block. Embedded Vimeo/Drive videos count as recorded videos and stay incomplete (no exemption).
3. save_my_item_progress: for recorded videos ignore the client's completion flag and complete only when distinct watched seconds cover the full duration; for other items allow completion only after opened_at is set.
4. Do not use course_modules.completed_by_admin anywhere in these functions.
