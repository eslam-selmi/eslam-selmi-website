-- 1) Add account-level block flag on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_blocked boolean NOT NULL DEFAULT false;

-- 2) Guard: prevent non-admins from changing their own account_blocked flag
CREATE OR REPLACE FUNCTION public.trg_profile_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.account_blocked IS DISTINCT FROM OLD.account_blocked THEN
    RAISE EXCEPTION 'Not allowed to modify account_blocked';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trg_profile_guard() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profile_guard ON public.profiles;
CREATE TRIGGER profile_guard
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_profile_guard();

-- 3) Update notification wording: واجب → تكليف
CREATE OR REPLACE FUNCTION public.trg_assignment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _course_title text;
BEGIN
  SELECT title INTO _course_title FROM public.courses WHERE id = NEW.course_id;
  PERFORM public.notify_course_enrollees(
    NEW.course_id,
    'تكليف جديد 📝',
    'تم نشر تكليف: ' || NEW.title || ' — ' || COALESCE(_course_title,''),
    '/portal'
  );
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.trg_assignment_created() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_submission_graded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _title text;
BEGIN
  IF NEW.score IS DISTINCT FROM OLD.score AND NEW.score IS NOT NULL THEN
    SELECT title INTO _title FROM public.assignments WHERE id = NEW.assignment_id;
    INSERT INTO public.notifications(user_id,title,body,link)
    VALUES (NEW.user_id, 'تم تقييم تكليفك ✅',
      'حصلت على ' || NEW.score::text || ' في: ' || COALESCE(_title,''),
      '/portal');
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.trg_submission_graded() FROM PUBLIC, anon, authenticated;