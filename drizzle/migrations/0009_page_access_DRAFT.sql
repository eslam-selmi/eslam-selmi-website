-- DRAFT. Not executed anywhere. Review before any use.
-- Page-level access: open | people | password. Display flags stay in site_content.
-- Activation applies ONLY to tools (has_tool_access). Site tabs are never activation-gated here.
create extension if not exists pgcrypto;

create table if not exists public.page_access (
  page_key text primary key,
  mode text not null default 'open' check (mode in ('open','people','password')),
  password_hash text,
  password_version int not null default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
create table if not exists public.page_access_grants (
  page_key text not null references public.page_access(page_key) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (page_key, user_id)
);
create table if not exists public.page_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  page_key text not null,
  password_version int not null,
  expires_at timestamptz not null,
  primary key (user_id, page_key)
);
create table if not exists public.page_unlock_attempts (
  id bigserial primary key,
  user_id uuid not null,
  page_key text not null,
  at timestamptz not null default now()
);
alter table public.page_access enable row level security;
alter table public.page_access_grants enable row level security;
alter table public.page_unlocks enable row level security;
alter table public.page_unlock_attempts enable row level security;
-- No direct client policies on page_access (hash never readable), unlocks, attempts.
create policy grants_own_read on public.page_access_grants for select using (user_id = auth.uid());

-- Admin check: ADAPT to the project's existing role helper before use (assumed has_role(uid,'admin')).
create or replace function public.page_mode(p_key text) returns text
language sql stable security definer set search_path=public as
$$ select coalesce((select mode from page_access where page_key=p_key),'open') $$;

create or replace function public.can_view_page(p_key text) returns boolean
language plpgsql stable security definer set search_path=public as $$
declare m text; v int;
begin
  select mode, password_version into m, v from page_access where page_key=p_key;
  -- FAIL CLOSED: a key with no page_access row is NOT viewable. Public routes must not call this;
  -- protected routes (tools, exam, locked pages) must have an explicit row. Open pages need mode='open'.
  if m is null then return false; end if;
  if m='open' then return true; end if;
  if auth.uid() is null then return false; end if;
  if public.has_role(auth.uid(),'admin') then return true; end if;
  if m='people' then
    return exists(select 1 from page_access_grants g where g.page_key=p_key and g.user_id=auth.uid());
  end if;
  return exists(select 1 from page_unlocks u where u.user_id=auth.uid() and u.page_key=p_key
                and u.password_version=v and u.expires_at>now());
end $$;

create or replace function public.set_page_access(p_key text, p_mode text, p_password text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  if p_mode='password' and (p_password is null or length(p_password)<8)
     and not exists(select 1 from page_access where page_key=p_key and password_hash is not null) then
    raise exception 'password too short'; end if;
  insert into page_access(page_key,mode,updated_by) values (p_key,p_mode,auth.uid())
    on conflict (page_key) do update set mode=excluded.mode, updated_by=auth.uid(), updated_at=now();
  if p_password is not null then
    update page_access set password_hash=crypt(p_password, gen_salt('bf')),
      password_version=password_version+1 where page_key=p_key;
    delete from page_unlocks where page_key=p_key;
  end if;
end $$;

create or replace function public.unlock_page(p_key text, p_password text) returns boolean
language plpgsql security definer set search_path=public as $$
declare h text; v int;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if (select count(*) from page_unlock_attempts where user_id=auth.uid() and page_key=p_key
      and at>now()-interval '15 minutes')>=5 then raise exception 'too many attempts'; end if;
  insert into page_unlock_attempts(user_id,page_key) values (auth.uid(),p_key);
  select password_hash,password_version into h,v from page_access where page_key=p_key and mode='password';
  if h is null or crypt(p_password,h)<>h then return false; end if;
  insert into page_unlocks values (auth.uid(),p_key,v,now()+interval '12 hours')
    on conflict (user_id,page_key) do update set password_version=v, expires_at=excluded.expires_at;
  return true;
end $$;
revoke all on function public.set_page_access(text,text,text), public.unlock_page(text,text) from public;
grant execute on function public.set_page_access(text,text,text), public.unlock_page(text,text) to authenticated;
grant execute on function public.can_view_page(text), public.page_mode(text) to anon, authenticated;
-- NOTE: a lock only protects content fetched from the server. Static page text in the JS bundle stays public.

-- Admin management of people grants (admins only; users read only their own rows via grants_own_read).
GRANT SELECT ON public.page_access_grants TO authenticated;
CREATE POLICY grants_admin_all ON public.page_access_grants FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()),'admin')) WITH CHECK (public.has_role((SELECT auth.uid()),'admin'));

-- Admin list: mode and whether a password is set. The hash is never returned.
CREATE OR REPLACE FUNCTION public.list_page_access()
RETURNS TABLE(page_key text, mode text, has_password boolean, grants int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT a.page_key, a.mode, a.password_hash IS NOT NULL,
    (SELECT count(*)::int FROM page_access_grants g WHERE g.page_key = a.page_key) FROM page_access a;
END $$;
REVOKE ALL ON FUNCTION public.list_page_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_page_access() TO authenticated;

-- OPTIONAL extra lock for content that is ALREADY gated on the server (for example a tool).
-- No row or mode open => true (the primary server check, such as has_tool_access, still applies on its own).
-- Do NOT use this to protect static public pages: it only answers a question, it does not hide bundle text.
CREATE OR REPLACE FUNCTION public.extra_lock_ok(p_key text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN coalesce((SELECT mode FROM page_access WHERE page_key = p_key),'open') = 'open' THEN true
              ELSE public.can_view_page(p_key) END $$;
GRANT EXECUTE ON FUNCTION public.extra_lock_ok(text) TO authenticated;

-- Display flags for every existing top-menu tab (visible by default; display only, never access).
INSERT INTO public.site_content (section_key, label, content, is_visible) VALUES
 ('nav.services','قائمة: الخدمات / Services','{}'::jsonb,true),
 ('nav.courses','قائمة: الدورات / Courses','{}'::jsonb,true),
 ('nav.trainings','قائمة: التدريبات / Trainings','{}'::jsonb,true),
 ('nav.success_cases','قائمة: قصص النجاح / Success cases','{}'::jsonb,true),
 ('nav.library','قائمة: المكتبة / Resources','{}'::jsonb,true),
 ('nav.empowerment','قائمة: خريج جديد / New grad','{}'::jsonb,true)
ON CONFLICT (section_key) DO NOTHING;
