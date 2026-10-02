CREATE TABLE public.trainee_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainee_notes TO authenticated;
GRANT ALL ON public.trainee_notes TO service_role;
ALTER TABLE public.trainee_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.trainee_notes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trainee_notes_updated_at BEFORE UPDATE ON public.trainee_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();