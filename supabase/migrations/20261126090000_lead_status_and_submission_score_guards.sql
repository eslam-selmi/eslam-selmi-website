-- Visitors can no longer create a course-interest row that is already marked as handled,
-- and trainees can no longer set their own score, feedback or graded time on a submission.
-- Admin and trainer policies are untouched.

drop policy if exists "anyone can insert interest" on public.course_interests;
create policy "anyone can insert interest" on public.course_interests
  for insert to anon, authenticated
  with check (
    char_length(full_name) between 2 and 200
    and char_length(email) between 5 and 320
    and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    and (phone is null or char_length(phone) <= 30)
    and (notes is null or char_length(notes) <= 2000)
    and (user_agent is null or char_length(user_agent) <= 500)
    and (course_title is null or char_length(course_title) <= 300)
    and (country_code is null or char_length(country_code) <= 80)
    and char_length(language) <= 8
    and status = 'new'
    and admin_notes is null
  );

drop policy if exists "trainee create own submission" on public.assignment_submissions;
create policy "trainee create own submission" on public.assignment_submissions
  for insert to public
  with check (
    auth.uid() = user_id
    and score is null and graded_at is null and feedback is null
    and exists (
      select 1 from public.assignments a join public.enrollments e on e.course_id = a.course_id
      where a.id = assignment_submissions.assignment_id
        and e.user_id = auth.uid() and e.status = 'approved'::enrollment_status and e.blocked = false
    )
  );

drop policy if exists "trainee update own submission ungraded" on public.assignment_submissions;
create policy "trainee update own submission ungraded" on public.assignment_submissions
  for update to public
  using (auth.uid() = user_id and graded_at is null)
  with check (auth.uid() = user_id and score is null and graded_at is null and feedback is null);
