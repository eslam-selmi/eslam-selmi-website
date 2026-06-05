
-- Site CMS: editable content blocks + visibility
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  label text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public view site_content" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin manage site_content" ON public.site_content
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Site popups: scheduled visitor popups
CREATE TABLE public.site_popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text,
  body_ar text,
  body_en text,
  image_url text,
  cta_label_ar text,
  cta_label_en text,
  cta_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  delay_seconds integer NOT NULL DEFAULT 3,
  frequency text NOT NULL DEFAULT 'once' CHECK (frequency IN ('once','every_visit','every_n_days')),
  frequency_days integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_popups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_popups TO authenticated;
GRANT ALL ON public.site_popups TO service_role;

ALTER TABLE public.site_popups ENABLE ROW LEVEL SECURITY;

-- Public can read only currently-active popups within their window
CREATE POLICY "public view active popups" ON public.site_popups
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

CREATE POLICY "admin view all popups" ON public.site_popups
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin manage popups" ON public.site_popups
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_site_popups_updated_at
  BEFORE UPDATE ON public.site_popups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed editable content keys for the main homepage sections
INSERT INTO public.site_content (section_key, label, content, is_visible) VALUES
  ('home.hero', 'Hero (الصفحة الرئيسية)', '{
    "eyebrow_ar":"إسلام سلمي · مدرّب وقائد","eyebrow_en":"Eslam Selmi · Coach & Leader",
    "title_ar":"نُلهم القيادات. نصنع الأبطال.","title_en":"We inspire leaders. We shape champions.",
    "subtitle_ar":"رحلة من 25+ سنة خبرة في القيادة والتدريب والتطوير المهني.","subtitle_en":"Over 25 years of leadership, coaching and professional development.",
    "cta_primary_ar":"ابدأ رحلتك","cta_primary_en":"Start your journey","cta_primary_url":"#contact",
    "cta_secondary_ar":"تعرّف عليّ","cta_secondary_en":"About me","cta_secondary_url":"#about"
  }'::jsonb, true),
  ('home.about', 'About (نبذة عني)', '{
    "title_ar":"نبذة عني","title_en":"About me",
    "body_ar":"خبير في القيادة والتدريب، شغوف بصناعة قادة المستقبل.","body_en":"Leadership and coaching expert, passionate about building tomorrow''s leaders."
  }'::jsonb, true),
  ('home.cta', 'Book CTA', '{
    "title_ar":"احجز جلستك الآن","title_en":"Book your session now",
    "subtitle_ar":"خطوة واحدة تفصلك عن رحلة التغيير.","subtitle_en":"One step away from your transformation.",
    "button_ar":"احجز جلسة","button_en":"Book a session","button_url":"#contact"
  }'::jsonb, true),
  ('home.footer', 'Footer', '{
    "tagline_ar":"© جميع الحقوق محفوظة لأكاديمية إسلام سلمي","tagline_en":"© All rights reserved · Eslam Selmi Academy"
  }'::jsonb, true);

-- Visibility-only rows for sections that aren't text-editable yet
INSERT INTO public.site_content (section_key, label, content, is_visible) VALUES
  ('home.pillars', 'قسم: الركائز / Pillars', '{}'::jsonb, true),
  ('home.journey', 'قسم: الرحلة / Journey', '{}'::jsonb, true),
  ('home.brands', 'قسم: العلامات / Brands', '{}'::jsonb, true),
  ('home.services', 'قسم: الخدمات / Services', '{}'::jsonb, true),
  ('home.programs', 'قسم: البرامج / Programs', '{}'::jsonb, true),
  ('home.latest_additions', 'قسم: أحدث الإضافات', '{}'::jsonb, true),
  ('home.current_courses', 'قسم: الكورسات الحالية', '{}'::jsonb, true),
  ('home.podcast', 'قسم: البودكاست', '{}'::jsonb, true),
  ('home.clients', 'قسم: العملاء / Clients', '{}'::jsonb, true),
  ('home.snapshots', 'قسم: لحظات شكلت المسيرة', '{}'::jsonb, true),
  ('home.contact', 'قسم: تواصل / Contact', '{}'::jsonb, true);
