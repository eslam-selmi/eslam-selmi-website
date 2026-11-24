CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, country, country_code, activation_status, activated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email, NEW.raw_user_meta_data->>'country', NEW.raw_user_meta_data->>'country_code', 'pending', NULL);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'trainee') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

REVOKE SELECT ON public.courses FROM anon;
GRANT SELECT (id, title, description, price, currency, active, created_at, starts_at, ends_at, installments_count,
  cover_emoji, total_hours, is_archived, slug, logo_url, brand_name, brand_primary_color, brand_tagline_ar,
  brand_tagline_en, track_key, phase, is_upcoming, course_goals, target_audience, certificate_settings, delivery_mode)
  ON public.courses TO anon;