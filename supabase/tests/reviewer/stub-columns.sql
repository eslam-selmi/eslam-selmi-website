-- REVIEW HARNESS STUB: columns/enum values/functions that exist on the live DB via
-- migrations not included in the package but are referenced by packaged files.
-- app_role on live is (admin, trainee, trainer) per the writer's live schema read.
alter type public.app_role add value if not exists 'trainer';

alter table public.enrollments
  add column if not exists blocked boolean not null default false,
  add column if not exists discount_amount numeric,
  add column if not exists coupon_code text,
  add column if not exists grace_until timestamptz;

alter table public.profiles add column if not exists activation_status text not null default 'active';
alter table public.courses add column if not exists total_hours numeric;

insert into storage.buckets(id, name, public) values ('tool-assets','tool-assets', false) on conflict (id) do nothing;

-- Tool-access helpers referenced by 20261126082000 (defined by migrations outside the package).
create or replace function public.get_my_tools() returns text[] language sql stable security definer set search_path = public as $$ select array[]::text[] $$;
create or replace function public.extra_lock_ok(_page text) returns boolean language sql stable as $$ select true $$;
create or replace function public.has_tool_access(_tool text) returns boolean language sql stable as $$ select false $$;

-- Trigger functions revoked in 20260523133209 but defined outside the package.
create or replace function public.trg_assignment_created() returns trigger language plpgsql as $$ begin return new; end $$;
create or replace function public.trg_submission_graded() returns trigger language plpgsql as $$ begin return new; end $$;
