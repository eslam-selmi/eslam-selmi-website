-- Migration: Trainer RLS Isolation
-- This migration implements row-level security (RLS) policies for trainers.

-- Enable RLS on tables if not already enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 1. Financial tables: block trainers completely, allow admins
-- Deny SELECT for trainer role (no explicit policy means deny)
-- Ensure admin can select all
CREATE POLICY "admin_select_payments" ON public.payments FOR SELECT USING (auth.role() = 'admin');
CREATE POLICY "admin_select_installments" ON public.installments FOR SELECT USING (auth.role() = 'admin');

-- 2. Enrollments: trainers can see only enrollments of courses they are assigned to
CREATE POLICY "trainer_select_enrollments" ON public.enrollments FOR SELECT USING (public.is_trainer_of_course(course_id));
CREATE POLICY "admin_select_enrollments" ON public.enrollments FOR SELECT USING (auth.role() = 'admin');

-- 3. Profiles: mask email and phone for trainers, full access for admin
-- Create a view for trainers with masked data
CREATE OR REPLACE VIEW public.trainer_profiles AS
SELECT
  id,
  full_name,
  -- mask email: show first 3 chars then stars
  CASE WHEN auth.role() = 'trainer' THEN LEFT(email, 3) || '*****' ELSE email END AS email,
  -- mask phone: show first 2 digits then stars
  CASE WHEN auth.role() = 'trainer' THEN LEFT(phone, 2) || '******' ELSE phone END AS phone,
  created_at,
  updated_at
FROM public.profiles;

-- Grant SELECT on view to trainer role
GRANT SELECT ON public.trainer_profiles TO anon, authenticated;

-- 4. Course content tables: restrict to trainers of the course with proper permissions
CREATE POLICY "trainer_manage_modules" ON public.course_modules FOR ALL USING (public.is_trainer_of_course(course_id) AND public.trainer_has_perm(course_id, 'can_edit_content'));
CREATE POLICY "trainer_manage_items" ON public.module_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.course_modules m WHERE m.id = module_items.module_id AND public.is_trainer_of_course(m.course_id) AND public.trainer_has_perm(m.course_id, 'can_edit_content'))
);
CREATE POLICY "trainer_manage_sessions" ON public.course_sessions FOR ALL USING (public.is_trainer_of_course(course_id) AND public.trainer_has_perm(course_id, 'can_edit_content'));
CREATE POLICY "trainer_manage_assignments" ON public.assignments FOR ALL USING (public.is_trainer_of_course(course_id) AND public.trainer_has_perm(course_id, 'can_edit_content'));

-- 5. Courses table: allow admin to update, trainer can archive if has permission
CREATE POLICY "admin_update_courses" ON public.courses FOR UPDATE USING (auth.role() = 'admin');
CREATE POLICY "trainer_archive_courses" ON public.courses FOR UPDATE USING (public.is_trainer_of_course(id) AND public.trainer_has_perm(id, 'can_archive_course')) WITH CHECK (public.is_trainer_of_course(id) AND public.trainer_has_perm(id, 'can_archive_course'));

-- Ensure policies are in place for admin reads as well
CREATE POLICY "admin_select_all" ON public.* FOR SELECT USING (auth.role() = 'admin');

-- End of migration
