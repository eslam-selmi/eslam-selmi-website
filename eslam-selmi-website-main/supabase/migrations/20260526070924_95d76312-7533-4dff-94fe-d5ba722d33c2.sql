
CREATE TABLE public.latest_additions_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL DEFAULT 'أحدث الإضافات',
  title_en text NOT NULL DEFAULT 'Latest Additions',
  subtitle_ar text DEFAULT 'محتوى جديد ومميز يضاف باستمرار',
  subtitle_en text DEFAULT 'Fresh content added regularly',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.latest_additions_settings (id) VALUES (gen_random_uuid());

ALTER TABLE public.latest_additions_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated view additions settings"
  ON public.latest_additions_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin manage additions settings"
  ON public.latest_additions_settings FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.latest_additions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  subtitle_ar text,
  subtitle_en text,
  custom_label text,
  kind text NOT NULL CHECK (kind IN ('link','file','video','pdf','embed')),
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.latest_additions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated view additions"
  ON public.latest_additions FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin manage additions"
  ON public.latest_additions FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_latest_additions_created ON public.latest_additions(created_at DESC);
