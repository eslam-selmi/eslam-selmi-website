
-- ============== COURSES: extra config ==============
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS starts_at date,
  ADD COLUMN IF NOT EXISTS ends_at date,
  ADD COLUMN IF NOT EXISTS installments_count int NOT NULL DEFAULT 1 CHECK (installments_count BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS online_url text,
  ADD COLUMN IF NOT EXISTS cover_emoji text DEFAULT '🎓';

-- ============== COURSE MODULES (chapters) ==============
CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  completed_by_admin boolean NOT NULL DEFAULT false,
  online_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON public.course_modules(course_id, order_index);

CREATE POLICY "admin manage modules" ON public.course_modules
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "enrolled approved view modules" ON public.course_modules
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = course_modules.course_id
        AND e.user_id = auth.uid()
        AND e.status = 'approved'
    )
  );

-- ============== MODULE ITEMS (notes/links/files) ==============
CREATE TABLE IF NOT EXISTS public.module_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('note','link','file')),
  title text NOT NULL,
  content text,
  url text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.module_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_module_items_module ON public.module_items(module_id, order_index);

CREATE POLICY "admin manage items" ON public.module_items
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "enrolled view items" ON public.module_items
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.course_modules m
      JOIN public.enrollments e ON e.course_id = m.course_id
      WHERE m.id = module_items.module_id
        AND e.user_id = auth.uid()
        AND e.status = 'approved'
    )
  );

-- ============== COURSE SESSIONS (live online) ==============
CREATE TABLE IF NOT EXISTS public.course_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  online_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_course_sessions_course ON public.course_sessions(course_id, starts_at);

CREATE POLICY "admin manage sessions" ON public.course_sessions
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "enrolled view sessions" ON public.course_sessions
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = course_sessions.course_id
        AND e.user_id = auth.uid()
        AND e.status = 'approved'
    )
  );

-- ============== NOTIFICATIONS ==============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

CREATE POLICY "view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
-- inserts only via SECURITY DEFINER trigger functions; no INSERT policy

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============== NOTIFY HELPERS ==============
CREATE OR REPLACE FUNCTION public.notify_admins(_title text, _body text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link)
  SELECT user_id, _title, _body, _link FROM public.user_roles WHERE role = 'admin';
END; $$;

CREATE OR REPLACE FUNCTION public.notify_course_enrollees(_course_id uuid, _title text, _body text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link)
  SELECT user_id, _title, _body, _link FROM public.enrollments
  WHERE course_id = _course_id AND status = 'approved';
END; $$;

REVOKE EXECUTE ON FUNCTION public.notify_admins(text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_course_enrollees(uuid,text,text,text) FROM PUBLIC, anon, authenticated;

-- ============== TRIGGERS ==============

-- New enrollment → notify admins
CREATE OR REPLACE FUNCTION public.trg_enrollment_inserted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _course_title text; _trainee text;
BEGIN
  SELECT title INTO _course_title FROM public.courses WHERE id = NEW.course_id;
  SELECT COALESCE(full_name, email) INTO _trainee FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.notify_admins(
    'طلب انضمام جديد',
    COALESCE(_trainee,'متدرب') || ' قدّم طلب التحاق بكورس ' || COALESCE(_course_title,''),
    '/admin'
  );
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_enrollment_inserted ON public.enrollments;
CREATE TRIGGER trg_enrollment_inserted AFTER INSERT ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.trg_enrollment_inserted();

-- Enrollment status / cert change → notify trainee
CREATE OR REPLACE FUNCTION public.trg_enrollment_updated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _course_title text;
BEGIN
  SELECT title INTO _course_title FROM public.courses WHERE id = NEW.course_id;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications(user_id,title,body,link)
      VALUES (NEW.user_id, 'تم قبول طلبك ✅', 'مبروك! تم قبول التحاقك بكورس ' || COALESCE(_course_title,''), '/portal');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications(user_id,title,body,link)
      VALUES (NEW.user_id, 'تم رفض الطلب', 'نأسف، تم رفض طلب التحاقك بكورس ' || COALESCE(_course_title,''), '/portal');
    END IF;
  END IF;
  IF NEW.certificate_issued = true AND OLD.certificate_issued = false THEN
    INSERT INTO public.notifications(user_id,title,body,link)
    VALUES (NEW.user_id, 'شهادتك جاهزة 🎉', 'تم إصدار شهادة كورس ' || COALESCE(_course_title,'') || '. يمكنك تحميلها الآن.', '/portal');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_enrollment_updated ON public.enrollments;
CREATE TRIGGER trg_enrollment_updated AFTER UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.trg_enrollment_updated();

-- New payment → notify trainee
CREATE OR REPLACE FUNCTION public.trg_payment_inserted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _course_title text;
BEGIN
  SELECT e.user_id, c.title INTO _uid, _course_title
  FROM public.enrollments e JOIN public.courses c ON c.id = e.course_id
  WHERE e.id = NEW.enrollment_id;
  IF _uid IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,title,body,link)
    VALUES (_uid, 'تم تسجيل دفعة جديدة 💳',
      'تم استلام ' || NEW.amount::text || ' ' || NEW.currency || ' لكورس ' || COALESCE(_course_title,''),
      '/portal');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_payment_inserted ON public.payments;
CREATE TRIGGER trg_payment_inserted AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_payment_inserted();

-- New session → notify enrollees
CREATE OR REPLACE FUNCTION public.trg_session_inserted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _course_title text;
BEGIN
  SELECT title INTO _course_title FROM public.courses WHERE id = NEW.course_id;
  PERFORM public.notify_course_enrollees(
    NEW.course_id,
    'محاضرة جديدة 📅',
    NEW.title || ' — ' || to_char(NEW.starts_at AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD HH24:MI'),
    '/portal'
  );
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_session_inserted ON public.course_sessions;
CREATE TRIGGER trg_session_inserted AFTER INSERT ON public.course_sessions
  FOR EACH ROW EXECUTE FUNCTION public.trg_session_inserted();

-- Module completion → notify enrollees
CREATE OR REPLACE FUNCTION public.trg_module_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.completed_by_admin = true AND OLD.completed_by_admin = false THEN
    PERFORM public.notify_course_enrollees(
      NEW.course_id,
      'تم إنجاز جزء جديد ✅',
      'تم إكمال: ' || NEW.title,
      '/portal'
    );
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_module_completed ON public.course_modules;
CREATE TRIGGER trg_module_completed AFTER UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.trg_module_completed();

-- ============== STORAGE BUCKET for course files ==============
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "course files public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-files');
CREATE POLICY "admin upload course files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'course-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update course files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'course-files' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete course files" ON storage.objects
  FOR DELETE USING (bucket_id = 'course-files' AND public.has_role(auth.uid(),'admin'));
