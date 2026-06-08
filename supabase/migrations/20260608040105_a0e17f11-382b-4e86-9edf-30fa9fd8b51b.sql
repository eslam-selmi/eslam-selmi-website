-- 1) Convert SECURITY DEFINER view to SECURITY INVOKER
ALTER VIEW public.trainer_enrollments SET (security_invoker = true);

-- 2) Remove broad coupon enumeration policy; admins keep access via "admin manage coupons" (ALL) and trainees validate codes via validate_coupon() RPC
DROP POLICY IF EXISTS "authenticated view active coupons" ON public.coupons;

-- 3) Remove trainer access to full profile rows; sensitive PII no longer exposed via profiles table
DROP POLICY IF EXISTS "trainer view enrolled trainee profiles" ON public.profiles;