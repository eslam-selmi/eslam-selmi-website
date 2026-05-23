-- 1. blocked column on enrollments
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;

-- 2. total_hours on courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS total_hours numeric NOT NULL DEFAULT 0;

-- 3. Add a foreign key relationship from enrollments.user_id -> profiles.id
-- so PostgREST can embed profile data. profiles.id is the user's id (same as auth.users.id),
-- so it's a one-to-one. We can't add a real FK to profiles because PK is fine but
-- we add it as a non-validated FK to register the relationship in PostgREST.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.enrollments
      ADD CONSTRAINT enrollments_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Allow trainees to withdraw their own pending enrollments
DROP POLICY IF EXISTS "trainee delete own pending enrollment" ON public.enrollments;
CREATE POLICY "trainee delete own pending enrollment"
  ON public.enrollments
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- 5. Update module_items SELECT policy so that:
--    - Admin sees everything
--    - Approved & not blocked trainees see everything
--    - Pending trainees see ONLY title (we'll project columns in app code)
--    Since RLS is row-level (not column-level), allow pending/rejected/blocked enrollees
--    to SELECT the row, but the app code returns only title for teaser view.
--    For BLOCKED users, deny entirely.
DROP POLICY IF EXISTS "enrolled view items" ON public.module_items;
CREATE POLICY "enrolled view items"
  ON public.module_items
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.course_modules m
      JOIN public.enrollments e ON e.course_id = m.course_id
      WHERE m.id = module_items.module_id
        AND e.user_id = auth.uid()
        AND e.status = 'approved'
        AND e.blocked = false
    )
  );

-- 6. Update course_modules SELECT policy: teaser mode for pending, full for approved
DROP POLICY IF EXISTS "enrolled approved view modules" ON public.course_modules;
CREATE POLICY "enrollee view modules"
  ON public.course_modules
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = course_modules.course_id
        AND e.user_id = auth.uid()
        AND e.blocked = false
        -- both pending and approved can see module rows (teaser),
        -- but file/link items are gated above
    )
  );

-- 7. course_sessions: only approved & not blocked
DROP POLICY IF EXISTS "enrolled view sessions" ON public.course_sessions;
CREATE POLICY "enrolled view sessions"
  ON public.course_sessions
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = course_sessions.course_id
        AND e.user_id = auth.uid()
        AND e.status = 'approved'
        AND e.blocked = false
    )
  );

-- 8. Notify trainee when blocked / unblocked
CREATE OR REPLACE FUNCTION public.trg_enrollment_blocked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _title text;
BEGIN
  IF NEW.blocked IS DISTINCT FROM OLD.blocked THEN
    SELECT title INTO _title FROM public.courses WHERE id = NEW.course_id;
    IF NEW.blocked THEN
      INSERT INTO public.notifications(user_id, title, body, link)
      VALUES (NEW.user_id, 'تم تعليق وصولك مؤقتاً ⏸️',
        'تم تعليق وصولك لكورس ' || COALESCE(_title,'') || '. تواصل مع الإدارة لمراجعة الموقف.', '/portal');
    ELSE
      INSERT INTO public.notifications(user_id, title, body, link)
      VALUES (NEW.user_id, 'تم استعادة وصولك ✅',
        'تم استعادة وصولك الكامل لكورس ' || COALESCE(_title,'') || '.', '/portal');
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enrollment_blocked_trigger ON public.enrollments;
CREATE TRIGGER enrollment_blocked_trigger
  AFTER UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.trg_enrollment_blocked();

-- 9. Existing trg_enrollment_updated trigger needs to be attached if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'enrollment_updated_trigger') THEN
    CREATE TRIGGER enrollment_updated_trigger
      AFTER UPDATE ON public.enrollments
      FOR EACH ROW EXECUTE FUNCTION public.trg_enrollment_updated();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'enrollment_inserted_trigger') THEN
    CREATE TRIGGER enrollment_inserted_trigger
      AFTER INSERT ON public.enrollments
      FOR EACH ROW EXECUTE FUNCTION public.trg_enrollment_inserted();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'payment_inserted_trigger') THEN
    CREATE TRIGGER payment_inserted_trigger
      AFTER INSERT ON public.payments
      FOR EACH ROW EXECUTE FUNCTION public.trg_payment_inserted();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'module_completed_trigger') THEN
    CREATE TRIGGER module_completed_trigger
      AFTER UPDATE ON public.course_modules
      FOR EACH ROW EXECUTE FUNCTION public.trg_module_completed();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'session_inserted_trigger') THEN
    CREATE TRIGGER session_inserted_trigger
      AFTER INSERT ON public.course_sessions
      FOR EACH ROW EXECUTE FUNCTION public.trg_session_inserted();
  END IF;
END $$;