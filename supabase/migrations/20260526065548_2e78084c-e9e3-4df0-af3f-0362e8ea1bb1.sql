REVOKE EXECUTE ON FUNCTION public.is_trainer_of_course(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_trainer_of_course(uuid) TO authenticated;