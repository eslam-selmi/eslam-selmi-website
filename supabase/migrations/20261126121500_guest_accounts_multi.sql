-- Guest logins: many independent guests, each tied to its own set of courses.
-- Server-only: RLS on, no policies, no grants to anon/authenticated. Only the service role reads or writes these tables.
-- Idempotent: safe whether or not an earlier single-guest table exists.
CREATE TABLE IF NOT EXISTS public.guest_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  version int NOT NULL DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  failed_count int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guest_access ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
DROP INDEX IF EXISTS public.guest_access_single;
CREATE UNIQUE INDEX IF NOT EXISTS guest_access_email_unique ON public.guest_access (email);
ALTER TABLE public.guest_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.guest_access FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.guest_course_access (
  guest_id uuid NOT NULL REFERENCES public.guest_access(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guest_id, course_id)
);
ALTER TABLE public.guest_course_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.guest_course_access FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.guest_record_failure(int, int);
CREATE OR REPLACE FUNCTION public.guest_record_failure(_id uuid, _max int, _lock_seconds int)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.guest_access SET
    failed_count = CASE WHEN failed_count + 1 >= _max THEN 0 ELSE failed_count + 1 END,
    locked_until = CASE WHEN failed_count + 1 >= _max THEN now() + make_interval(secs => _lock_seconds) ELSE locked_until END
  WHERE id = _id;
$$;
REVOKE ALL ON FUNCTION public.guest_record_failure(uuid, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guest_record_failure(uuid, int, int) TO service_role;
