
-- 1) payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  details_ar text,
  details_en text,
  order_index integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage payment_methods"
  ON public.payment_methods
  FOR ALL TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "authenticated view active payment_methods"
  ON public.payment_methods
  FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) payments: link to method + snapshot label
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method_name text;

CREATE INDEX IF NOT EXISTS idx_payments_method ON public.payments(payment_method_id);

-- 3) enrollments: grace period
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS grace_until timestamptz;

-- Allow trainee guard trigger to still permit grace_until updates by admin only:
-- Existing trigger already exempts admin via has_role check, so no change needed.

-- 4) Seed a couple of common methods (admin can edit/delete)
INSERT INTO public.payment_methods (name_ar, name_en, details_ar, details_en, order_index)
VALUES
  ('إنستا باي', 'InstaPay', 'اسم المستفيد: أكاديمية إسلام سلمي
رقم الحساب: 0123456789
ايبان: EG12 3456 7890', 'Beneficiary: Eslam Selmi Academy
Account: 0123456789
IBAN: EG12 3456 7890', 1),
  ('فودافون كاش', 'Vodafone Cash', 'الرقم: 01000000000
الاسم: إسلام سلمي', 'Number: 01000000000
Name: Eslam Selmi', 2),
  ('تحويل بنكي', 'Bank Transfer', 'بنك القاهرة
رقم الحساب: 1234567890
ايبان: EG00 0000 0000', 'Cairo Bank
Account: 1234567890
IBAN: EG00 0000 0000', 3)
ON CONFLICT DO NOTHING;
