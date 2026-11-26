-- Trainer feature cancelled by the owner. Keep data and tables; remove effective privileges.
-- Reversible: restore the earlier bodies of is_trainer_of_course / trainer_has_perm.
CREATE OR REPLACE FUNCTION public.is_trainer_of_course(_course_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ select false $$;
CREATE OR REPLACE FUNCTION public.trainer_has_perm(_course_id uuid, _perm text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ select false $$;
