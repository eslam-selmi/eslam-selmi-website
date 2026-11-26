-- Trainees may only create their own enrollment as pending. Protected fields are enforced by a trigger and by the policy.
create or replace function public.trg_enrollment_insert_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if public.has_role(auth.uid(), 'admin'::app_role) then return new; end if;
  if current_setting('app.bypass_enrollment_guard', true) = 'on' then return new; end if;
  if new.status is distinct from 'pending'
     or coalesce(new.certificate_issued, false) <> false
     or new.certificate_url is not null or new.certificate_url_ar is not null or new.certificate_url_en is not null
     or coalesce(new.blocked, false) <> false
     or coalesce(new.discount_amount, 0) <> 0
     or new.coupon_code is not null or new.grace_until is not null or new.notes is not null then
    raise exception 'Not allowed to set protected enrollment fields';
  end if;
  return new;
end $$;

drop trigger if exists trg_enrollment_insert_guard on public.enrollments;
create trigger trg_enrollment_insert_guard before insert on public.enrollments
for each row execute function public.trg_enrollment_insert_guard();

drop policy if exists "trainee create own enrollments" on public.enrollments;
create policy "trainee create own enrollments" on public.enrollments for insert to authenticated
with check ((auth.uid() = user_id and status = 'pending'::enrollment_status and coalesce(certificate_issued,false) = false and certificate_url is null and coalesce(blocked,false) = false) or public.has_role(auth.uid(), 'admin'::app_role));
