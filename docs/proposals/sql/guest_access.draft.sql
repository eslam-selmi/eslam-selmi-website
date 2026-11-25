-- DRAFT. Not a migration. Not applied anywhere. Review before anyone runs it.
-- Additive only: one new table. No change to existing tables, policies or data.
-- SERVER-ONLY GUEST: the guest is NOT an auth user. No auth.users row, no signup trigger,
-- no JWT. Only server functions (service role) read or write this table, so none of the
-- database's own-row write policies can ever apply to a guest.
CREATE TABLE IF NOT EXISTS public.guest_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,          -- scrypt, never the password
  version int NOT NULL DEFAULT 1,       -- bumped on reset or turn-off: revokes all sessions
  enabled boolean NOT NULL DEFAULT true,
  failed_count int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS guest_access_single ON public.guest_access ((true));
ALTER TABLE public.guest_access ENABLE ROW LEVEL SECURITY;
-- No policy at all: not even admins can read the hash through the API. Service role only.
