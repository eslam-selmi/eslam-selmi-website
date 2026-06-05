/*
  Migration: Trainer RLS Isolation
  Generated: 2026-05-26
*/

-- Enable row level security on relevant tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Helper functions (assumed exist) to determine trainer membership and permissions
-- is_trainer_of_course(course_id uuid) returns boolean
-- trainer_has_perm(course_id uuid, perm text) returns boolean

-- Payments: trainers can view payments of enrollments in their courses
CREATE POLICY "trainer_view_payments_assigned_courses" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = payments.enrollment_id
        AND public.is_trainer_of_course(e.course_id)
    )
  );

-- Installments: same restriction
CREATE POLICY "trainer_view_installments_assigned_courses" ON public.installments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = installments.enrollment_id
        AND public.is_trainer_of_course(e.course_id)
    )
  );

-- Enrollments: trainers can update status if they have permission
CREATE POLICY "trainer_update_enrollments_assigned_courses" ON public.enrollments
  FOR UPDATE USING (
    public.is_trainer_of_course(course_id)
    AND public.trainer_has_perm(course_id, 'can_approve_enrollments')
  ) WITH CHECK (
    public.is_trainer_of_course(course_id)
    AND public.trainer_has_perm(course_id, 'can_approve_enrollments')
  );

-- Course Modules: manage modules
CREATE POLICY "trainer_manage_modules" ON public.course_modules
  FOR ALL USING (
    public.is_trainer_of_course(course_id)
    AND public.trainer_has_perm(course_id, 'can_edit_content')
  );

-- Module Items: manage items
CREATE POLICY "trainer_manage_module_items" ON public.module_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.course_modules m
      WHERE m.id = module_items.module_id
        AND public.is_trainer_of_course(m.course_id)
        AND public.trainer_has_perm(m.course_id, 'can_edit_content')
    )
  );

-- Course Sessions: manage sessions
CREATE POLICY "trainer_manage_sessions" ON public.course_sessions
  FOR ALL USING (
    public.is_trainer_of_course(course_id)
    AND public.trainer_has_perm(course_id, 'can_edit_content')
  );

-- Assignments: manage assignments
CREATE POLICY "trainer_manage_assignments" ON public.assignments
  FOR ALL USING (
    public.is_trainer_of_course(course_id)
    AND public.trainer_has_perm(course_id, 'can_edit_content')
  );

-- Courses: archive permission
CREATE POLICY "trainer_archive_courses" ON public.courses
  FOR UPDATE USING (
    public.is_trainer_of_course(id)
    AND public.trainer_has_perm(id, 'can_archive_course')
  ) WITH CHECK (
    public.is_trainer_of_course(id)
    AND public.trainer_has_perm(id, 'can_archive_course')
  );

-- Ensure admins retain full access (existing policies assumed).
