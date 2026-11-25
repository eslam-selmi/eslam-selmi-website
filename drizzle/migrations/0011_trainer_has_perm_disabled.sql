-- The trainer feature is cancelled and no course has an assigned trainer.
-- Replace the old dynamic-column body with a constant false. Same signature, same grants.
-- Two existing policies (assignment_submissions, course_modules) still call it and keep working.
create or replace function public.trainer_has_perm(_course_id uuid, _perm text)
returns boolean language sql stable security definer set search_path = public
as 'select false';
