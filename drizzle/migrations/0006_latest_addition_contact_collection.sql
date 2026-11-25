ALTER TABLE public.latest_additions ADD COLUMN collect_contacts boolean NOT NULL DEFAULT false;
CREATE TABLE public.latest_addition_contacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 addition_id uuid NOT NULL REFERENCES public.latest_additions(id) ON DELETE CASCADE,
 full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 120),
 phone text NOT NULL CHECK (char_length(phone) <= 32 AND phone ~ '^\+?[0-9 ()-]{7,32}$' AND char_length(regexp_replace(phone, '[^0-9]', '', 'g')) BETWEEN 7 AND 15),
 email text NOT NULL CHECK (char_length(email) <= 254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.latest_addition_contacts TO anon, authenticated;
GRANT SELECT, DELETE ON public.latest_addition_contacts TO authenticated;
GRANT ALL ON public.latest_addition_contacts TO service_role;
ALTER TABLE public.latest_addition_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visitors submit enabled addition contacts" ON public.latest_addition_contacts FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.latest_additions a WHERE a.id = addition_id AND a.collect_contacts));
CREATE POLICY "administrators read addition contacts" ON public.latest_addition_contacts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "administrators delete addition contacts" ON public.latest_addition_contacts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX latest_addition_contacts_addition_created ON public.latest_addition_contacts(addition_id, created_at DESC);