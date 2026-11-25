-- DRAFT. Not a migration. Not applied anywhere. Review before anyone runs it.
-- Additive only: one new table. No change to existing tables, policies or data.
-- The guest is a real auth user created by the admin screen (server side, admin API).
-- Guest content is served by server functions that check this table, so no existing
-- RLS policy on courses/course_modules/module_items/storage is loosened.
CREATE TABLE IF NOT EXISTS public.guest_access (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- one guest account at a time
CREATE UNIQUE INDEX IF NOT EXISTS guest_access_single ON public.guest_access ((true));
ALTER TABLE public.guest_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read guest access" ON public.guest_access
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
-- No insert/update/delete policy: only the service role (server functions) writes.
