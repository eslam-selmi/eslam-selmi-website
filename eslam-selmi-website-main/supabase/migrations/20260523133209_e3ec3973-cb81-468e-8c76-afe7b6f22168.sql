-- Revoke execute from anon/public on SECURITY DEFINER functions; keep authenticated for has_role (required by RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.trg_enrollment_guard_trainee() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_certificate_requested() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_assignment_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_submission_graded() FROM PUBLIC, anon, authenticated;