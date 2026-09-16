CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  industry_ar text,
  industry_en text,
  description_ar text,
  description_en text,
  logo_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active partners" ON public.partners
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage partners" ON public.partners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER partners_set_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year text,
  is_current boolean NOT NULL DEFAULT false,
  org_ar text NOT NULL,
  org_en text,
  industry_ar text,
  industry_en text,
  country_code text NOT NULL DEFAULT 'EG',
  country_ar text,
  country_en text,
  role_ar text,
  role_en text,
  description_ar text,
  description_en text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.contracts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active contracts" ON public.contracts
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage contracts" ON public.contracts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER contracts_set_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.contracts (year, is_current, org_ar, org_en, industry_ar, industry_en, country_code, country_ar, country_en, role_ar, role_en, display_order) VALUES
('2017', false, 'جي فور إس', 'G4S', 'الحلول الأمنية المتكاملة', 'Advanced Security Solutions', 'EG', 'مصر', 'Egypt', 'أخصائي أول / أخصائي تعلم وتطوير', 'Senior L&D / L&D Specialist', 1),
('2022', false, 'أرامكس', 'Aramex', 'حلول النقل والخدمات اللوجستية', 'Transport & Logistics', 'EG', 'مصر', 'Egypt', 'أخصائي تعلم وتطوير', 'L&D Specialist', 2),
('2023', false, 'بدر الدين', 'Badreldin Developments', 'القطاع العقاري والتجزئة', 'Real Estate & Retail', 'EG', 'مصر', 'Egypt', 'مشرف إدارة ومنسّق التعلم والتطوير', 'Department Supervisor & Learning Liaison', 3),
('2025', false, 'إمتنان', 'Imtenan', 'قطاع السلع الاستهلاكية (FMCG)', 'FMCG', 'EG', 'مصر', 'Egypt', 'رئيس قسم التعلم والتطوير وإدارة المواهب', 'Head of L&D & Talent Management', 4),
(NULL, true, 'مدينة المعرفة', 'KnowledgeCity', 'قطاع التعليم والتدريب', 'Schools & Training', 'SA', 'السعودية', 'Saudi Arabia', 'رئيس قسم التعلم والتطوير', 'Head of L&D', 5);