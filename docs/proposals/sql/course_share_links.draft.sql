-- DRAFT. Not a migration. Not applied anywhere. Review before anyone runs it.
-- Additive only: one new table. No change to existing tables or data.
CREATE TABLE IF NOT EXISTS public.course_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz,
  revoked_at timestamptz,
  auto_close boolean NOT NULL DEFAULT false,
  bind_first boolean NOT NULL DEFAULT false,
  claim_hash text,
  closed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_share_links ENABLE ROW LEVEL SECURITY;
-- Admins can list and manage links from the admin screen. Visitors never query this table:
-- the server functions use the service role, and the raw token is never stored.
CREATE POLICY "admins manage share links" ON public.course_share_links
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS course_share_links_course_idx ON public.course_share_links(course_id);
-- claim must be atomic: UPDATE ... SET claim_hash = $1 WHERE id = $2 AND claim_hash IS NULL (rows affected = 1 means this browser won)
