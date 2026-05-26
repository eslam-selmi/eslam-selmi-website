
-- Profiles: country
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS country_code text;

-- Payments: proof + manual approval
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS status payment_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS submitted_by uuid;

-- Allow trainees to insert their own pending payment with a proof
DROP POLICY IF EXISTS "trainee submit payment proof" ON public.payments;
CREATE POLICY "trainee submit payment proof"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  status = 'pending'
  AND submitted_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.id = payments.enrollment_id AND e.user_id = auth.uid()
  )
);

-- Enrollments: persistent reminder dismissal
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS payment_reminder_dismissed_at timestamptz;

-- Storage bucket for payment proofs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs','payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: each trainee can upload/read own files; admins manage all
DROP POLICY IF EXISTS "proofs trainee read own" ON storage.objects;
CREATE POLICY "proofs trainee read own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "proofs trainee upload own" ON storage.objects;
CREATE POLICY "proofs trainee upload own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "proofs admin all" ON storage.objects;
CREATE POLICY "proofs admin all"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(),'admin'::app_role))
WITH CHECK (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(),'admin'::app_role));

-- Update handle_new_user to capture country
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, country, country_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'country_code'
  );

  IF lower(NEW.email) = 'eslam.m.selmi@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'trainee')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
