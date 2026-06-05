
-- 1) Profile activation columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS activation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS activated_at timestamptz;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_activation_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_activation_status_check
  CHECK (activation_status IN ('pending','active','rejected'));

-- Backfill: existing accounts stay active
UPDATE public.profiles
   SET activation_status = 'active',
       activated_at = COALESCE(activated_at, created_at)
 WHERE activation_status = 'pending' AND created_at < now();

-- 2) handle_new_user updates: pending for trainees, active for admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _is_admin boolean := (lower(NEW.email) = 'eslam.m.selmi@gmail.com');
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, country, country_code, activation_status, activated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'country_code',
    CASE WHEN _is_admin THEN 'active' ELSE 'pending' END,
    CASE WHEN _is_admin THEN now() ELSE NULL END
  );

  IF _is_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'trainee')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3) Update profile guard: trainees cannot self-modify activation_status
CREATE OR REPLACE FUNCTION public.trg_profile_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.account_blocked IS DISTINCT FROM OLD.account_blocked THEN
    RAISE EXCEPTION 'Not allowed to modify account_blocked';
  END IF;
  IF NEW.activation_status IS DISTINCT FROM OLD.activation_status
     OR NEW.activated_at IS DISTINCT FROM OLD.activated_at THEN
    RAISE EXCEPTION 'Not allowed to modify activation status';
  END IF;
  RETURN NEW;
END;
$function$;

-- 4) Platform settings (singleton) for activation messaging
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  admin_whatsapp_e164 text,
  activation_request_template_ar text NOT NULL DEFAULT 'السلام عليكم، اسمي {{name}} وقمت بالتسجيل في الأكاديمية بالبريد {{email}}. أرجو تفعيل حسابي.',
  activation_request_template_en text NOT NULL DEFAULT 'Hello, my name is {{name}} and I just registered using {{email}}. Please activate my account.',
  welcome_message_template_ar text NOT NULL DEFAULT 'مرحباً {{name}} 👋 تم تفعيل حسابك في أكاديمية إسلام سلمي. يمكنك الآن تسجيل الدخول من هنا: {{login_url}}',
  welcome_message_template_en text NOT NULL DEFAULT 'Hi {{name}} 👋 Your account at Eslam Selmi Academy has been activated. You can log in here: {{login_url}}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (singleton) VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manage platform_settings" ON public.platform_settings;
CREATE POLICY "admin manage platform_settings"
  ON public.platform_settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "authenticated read platform_settings" ON public.platform_settings;
CREATE POLICY "authenticated read platform_settings"
  ON public.platform_settings
  FOR SELECT
  TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_platform_settings_updated ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_updated
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
