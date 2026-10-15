REVOKE EXECUTE ON FUNCTION public.trg_feedback_feature_guard() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_featured_feedback() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_featured_feedback() TO anon, authenticated;