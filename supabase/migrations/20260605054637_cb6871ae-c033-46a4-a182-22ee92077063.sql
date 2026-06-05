ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS course_goals TEXT,
  ADD COLUMN IF NOT EXISTS target_audience TEXT;

CREATE OR REPLACE FUNCTION public.convert_course_interest_on_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_email text;
  profile_phone text;
BEGIN
  IF NEW.course_id IS NULL OR NEW.user_id IS NULL OR NEW.status NOT IN ('pending', 'approved') THEN
    RETURN NEW;
  END IF;

  SELECT lower(nullif(email, '')), nullif(phone, '')
  INTO profile_email, profile_phone
  FROM public.profiles
  WHERE id = NEW.user_id;

  UPDATE public.course_interests
  SET status = 'converted', updated_at = now()
  WHERE course_id = NEW.course_id
    AND status <> 'converted'
    AND (
      (profile_email IS NOT NULL AND lower(email) = profile_email)
      OR (profile_phone IS NOT NULL AND phone = profile_phone)
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_convert_course_interest_on_enrollment ON public.enrollments;
CREATE TRIGGER trg_convert_course_interest_on_enrollment
AFTER INSERT OR UPDATE OF user_id, course_id, status ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.convert_course_interest_on_enrollment();