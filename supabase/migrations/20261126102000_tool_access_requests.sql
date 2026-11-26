-- Tool access requests: a trainee asks, an admin approves or rejects. Approval is the only path that creates a grant.
create table if not exists public.tool_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null check (tool in ('tna','perf','exam')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid
);
create unique index if not exists tool_access_requests_one_pending on public.tool_access_requests (user_id, tool) where status = 'pending';
alter table public.tool_access_requests enable row level security;
revoke all on public.tool_access_requests from anon, authenticated, public;
grant select on public.tool_access_requests to authenticated;
drop policy if exists "own requests read" on public.tool_access_requests;
create policy "own requests read" on public.tool_access_requests for select to authenticated using (user_id = auth.uid());
drop policy if exists "admin requests read" on public.tool_access_requests;
create policy "admin requests read" on public.tool_access_requests for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Trainee: request access. Identity comes from the session, never from the client.
create or replace function public.request_tool_access(p_tool text) returns text
language plpgsql security definer set search_path to 'public' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not signed in'; end if;
  if p_tool not in ('tna','perf','exam') then raise exception 'Unknown tool'; end if;
  if not exists (select 1 from public.profiles p where p.id = uid and p.activation_status = 'active') then raise exception 'Account not active'; end if;
  if exists (select 1 from public.tool_access a where a.user_id = uid and a.tool = p_tool) then return 'has_access'; end if;
  insert into public.tool_access_requests (user_id, tool) values (uid, p_tool) on conflict do nothing;
  return 'pending';
end $$;
revoke all on function public.request_tool_access(text) from public, anon;
grant execute on function public.request_tool_access(text) to authenticated;

-- Trainee: status of own latest request for a tool.
create or replace function public.my_tool_request_status(p_tool text) returns text
language sql stable security definer set search_path to 'public' as $$
  select r.status from public.tool_access_requests r where r.user_id = auth.uid() and r.tool = p_tool order by r.created_at desc limit 1
$$;
revoke all on function public.my_tool_request_status(text) from public, anon;
grant execute on function public.my_tool_request_status(text) to authenticated;

-- Admin: approve or reject one pending request.
create or replace function public.review_tool_request(p_id uuid, p_approve boolean) returns text
language plpgsql security definer set search_path to 'public' as $$
declare r public.tool_access_requests;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then raise exception 'Not allowed'; end if;
  select * into r from public.tool_access_requests where id = p_id and status = 'pending' for update;
  if not found then return 'not_pending'; end if;
  if p_approve then
    insert into public.tool_access (user_id, tool, granted_by) values (r.user_id, r.tool, auth.uid()) on conflict (user_id, tool) do nothing;
  end if;
  update public.tool_access_requests set status = case when p_approve then 'approved' else 'rejected' end, decided_at = now(), decided_by = auth.uid() where id = p_id;
  return case when p_approve then 'approved' else 'rejected' end;
end $$;
revoke all on function public.review_tool_request(uuid, boolean) from public, anon;
grant execute on function public.review_tool_request(uuid, boolean) to authenticated;

-- A grant made from the access panel also closes any pending request for it.
create or replace function public.trg_tool_access_close_requests() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  update public.tool_access_requests set status = 'approved', decided_at = now(), decided_by = NEW.granted_by where user_id = NEW.user_id and tool = NEW.tool and status = 'pending';
  return NEW;
end $$;
revoke all on function public.trg_tool_access_close_requests() from public, anon, authenticated;
drop trigger if exists tool_access_close_requests on public.tool_access;
create trigger tool_access_close_requests after insert on public.tool_access for each row execute function public.trg_tool_access_close_requests();
