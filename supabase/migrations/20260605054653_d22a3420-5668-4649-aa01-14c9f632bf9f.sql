REVOKE ALL ON FUNCTION public.convert_course_interest_on_enrollment() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.convert_course_interest_on_enrollment() FROM anon;
REVOKE ALL ON FUNCTION public.convert_course_interest_on_enrollment() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.convert_course_interest_on_enrollment() TO service_role;