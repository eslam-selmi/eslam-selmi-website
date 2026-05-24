-- 1) Fix course_modules: require approved enrollment
DROP POLICY IF EXISTS "enrollee view modules" ON public.course_modules;
CREATE POLICY "enrollee view modules"
ON public.course_modules
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = course_modules.course_id
      AND e.user_id = auth.uid()
      AND e.status = 'approved'::enrollment_status
      AND e.blocked = false
  )
);

-- 2) Restrict Realtime channel subscriptions for assignments/submissions
-- Convention: clients subscribe on topics like:
--   'assignments-course-<course_id>'                  (approved enrollees + admins)
--   'submissions-user-<user_id>'                      (the owning user + admins)
--   'submissions-course-<course_id>'                  (admins only)

CREATE POLICY "assignments course channel: approved enrollees and admins"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (
    realtime.topic() LIKE 'assignments-course-%'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.course_id::text = substring(realtime.topic() from 'assignments-course-(.*)$')
          AND e.user_id = auth.uid()
          AND e.status = 'approved'::enrollment_status
          AND e.blocked = false
      )
    )
  )
);

CREATE POLICY "submissions user channel: owner and admins"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'submissions-user-%'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR substring(realtime.topic() from 'submissions-user-(.*)$') = auth.uid()::text
  )
);

CREATE POLICY "submissions course channel: admins only"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'submissions-course-%'
  AND has_role(auth.uid(), 'admin'::app_role)
);
