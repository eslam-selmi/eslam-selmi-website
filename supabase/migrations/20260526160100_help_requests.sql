-- Create help_requests table
CREATE TABLE IF NOT EXISTS public.help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Trainees can create and view their own tickets
DROP POLICY IF EXISTS "trainees manage own help_requests" ON public.help_requests;
CREATE POLICY "trainees manage own help_requests"
  ON public.help_requests
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins and Trainers can read all tickets
DROP POLICY IF EXISTS "admin and trainers view help_requests" ON public.help_requests;
CREATE POLICY "admin and trainers view help_requests"
  ON public.help_requests
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'trainer'::app_role)
  );

-- Policy: Admins and Trainers can update tickets (e.g. status and admin_reply)
DROP POLICY IF EXISTS "admin update help_requests" ON public.help_requests;
CREATE POLICY "admin update help_requests"
  ON public.help_requests
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'trainer'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'trainer'::app_role)
  );

-- Trigger for set_updated_at
DROP TRIGGER IF EXISTS trg_help_requests_updated ON public.help_requests;
CREATE TRIGGER trg_help_requests_updated
  BEFORE UPDATE ON public.help_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
