-- REVIEW HARNESS STUBS (written independently by the reviewer, not the writer's stubs).
-- Provides the Supabase built-ins (auth, storage) and the tables/enums/columns that the
-- packaged legacy migrations reference but do not create (they live in migrations that
-- were not included in the review package). No real data; all synthetic.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

create schema if not exists auth;
create table if not exists auth.users(
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);
create or replace function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as
$$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;

create schema if not exists storage;
create table if not exists storage.buckets(id text primary key, name text, public boolean not null default false);
create table if not exists storage.objects(
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz not null default now()
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language sql immutable as
$$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;

create publication supabase_realtime;

-- Tables referenced by packaged migrations but created by migrations outside the package.
create table if not exists public.assignments(
  id uuid primary key default gen_random_uuid(),
  course_id uuid,
  title text,
  description text,
  due_date timestamptz,
  is_graduation_project boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.assignments enable row level security;
create table if not exists public.assignment_submissions(
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid,
  user_id uuid,
  link text,
  grade numeric,
  feedback text,
  submitted_at timestamptz not null default now()
);
alter table public.assignment_submissions enable row level security;
create table if not exists public.coupons(
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  active boolean not null default true,
  discount_type text not null default 'percent',
  discount_value numeric not null default 0,
  expires_at timestamptz,
  max_uses integer,
  used_count integer not null default 0,
  course_id uuid
);
create table if not exists public.coupon_redemptions(
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid, user_id uuid, enrollment_id uuid, discount_amount numeric,
  created_at timestamptz not null default now()
);
create table if not exists public.course_interests(
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '', email text not null default '', phone text,
  notes text, user_agent text, course_title text, country_code text,
  language text not null default 'ar', created_at timestamptz not null default now()
);
alter table public.course_interests enable row level security;
create table if not exists public.consultation_slots(
  id uuid primary key default gen_random_uuid(), booked_by uuid,
  starts_at timestamptz, created_at timestamptz not null default now()
);
alter table public.consultation_slots enable row level security;
create table if not exists public.custom_countries(id uuid primary key default gen_random_uuid(), name text);
alter table public.custom_countries enable row level security;
create table if not exists public.site_popups(id uuid primary key default gen_random_uuid(), title text);
alter table public.site_popups enable row level security;
create table if not exists public.platform_settings(
  id integer primary key default 1,
  admin_whatsapp_e164 text,
  activation_request_template_ar text,
  activation_request_template_en text
);
alter table public.platform_settings enable row level security;
create table if not exists public.support_tickets(
  id uuid primary key default gen_random_uuid(), user_id uuid,
  status text not null default 'open', subject text,
  unread_for_admin boolean not null default true, created_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
