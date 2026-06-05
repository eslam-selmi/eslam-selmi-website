-- Add certificate-related columns to enrollments
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS certificate_url_ar text,
  ADD COLUMN IF NOT EXISTS certificate_url_en text,
  ADD COLUMN IF NOT EXISTS certificate_requested_at timestamptz;

-- Allow trainee to update own enrollment row (column-level protection via trigger below)
DROP POLICY IF EXISTS "trainee update own enrollment limited" ON public.enrollments;
CREATE POLICY "trainee update own enrollment limited"
  ON public.enrollments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: prevent trainee from changing protected fields
CREATE OR REPLACE FUNCTION public.trg_enrollment_guard_trainee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip guard if caller is admin
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Otherwise the only mutator is the trainee themselves: lock down sensitive fields
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.certificate_issued IS DISTINCT FROM OLD.certificate_issued
     OR NEW.certificate_url IS DISTINCT FROM OLD.certificate_url
     OR NEW.certificate_url_ar IS DISTINCT FROM OLD.certificate_url_ar
     OR NEW.certificate_url_en IS DISTINCT FROM OLD.certificate_url_en
     OR NEW.blocked IS DISTINCT FROM OLD.blocked
     OR NEW.course_id IS DISTINCT FROM OLD.course_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.notes IS DISTINCT FROM OLD.notes THEN
    RAISE EXCEPTION 'Not allowed to modify protected enrollment fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollment_guard_trainee ON public.enrollments;
CREATE TRIGGER enrollment_guard_trainee
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_enrollment_guard_trainee();

-- Notify admins when trainee requests a certificate
CREATE OR REPLACE FUNCTION public.trg_certificate_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _course_title text; _trainee text;
BEGIN
  IF NEW.certificate_requested_at IS NOT NULL
     AND (OLD.certificate_requested_at IS NULL OR OLD.certificate_requested_at IS DISTINCT FROM NEW.certificate_requested_at) THEN
    SELECT title INTO _course_title FROM public.courses WHERE id = NEW.course_id;
    SELECT COALESCE(full_name, email) INTO _trainee FROM public.profiles WHERE id = NEW.user_id;
    PERFORM public.notify_admins(
      'طلب إصدار شهادة 🎓',
      COALESCE(_trainee,'متدرب') || ' طلب إصدار شهادة كورس ' || COALESCE(_course_title,''),
      '/admin'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollment_certificate_requested ON public.enrollments;
CREATE TRIGGER enrollment_certificate_requested
  AFTER UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_certificate_requested();

-- Re-attach existing triggers in case order matters (no-op if already present)
-- (trg_enrollment_updated and trg_enrollment_blocked already exist)
