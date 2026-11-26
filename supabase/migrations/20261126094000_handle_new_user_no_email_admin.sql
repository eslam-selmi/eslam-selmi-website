-- New accounts are always trainees and start pending. No role is granted from an email address.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, country, country_code, activation_status, activated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''), NEW.email,
          NEW.raw_user_meta_data->>'country', NEW.raw_user_meta_data->>'country_code', 'pending', NULL);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'trainee') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;
