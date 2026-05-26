
-- 1. Add graduation project flag
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS is_graduation_project boolean NOT NULL DEFAULT false;

-- 2. Public certificate verification function (SECURITY DEFINER, read-only)
CREATE OR REPLACE FUNCTION public.verify_certificate(_enrollment_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN e.id IS NULL OR e.certificate_issued = false THEN
      jsonb_build_object('ok', false, 'error', 'not_found')
    ELSE
      jsonb_build_object(
        'ok', true,
        'trainee_name_ar', e.name_ar,
        'trainee_name_en', e.name_en,
        'course_title', c.title,
        'course_description', c.description,
        'total_hours', c.total_hours,
        'issued_at', e.updated_at,
        'certificate_id', e.id
      )
  END
  FROM public.enrollments e
  LEFT JOIN public.courses c ON c.id = e.course_id
  WHERE e.id = _enrollment_id;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(uuid) TO anon, authenticated;
