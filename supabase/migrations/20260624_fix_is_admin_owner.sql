-- =============================================================================
-- Fix: is_admin() reconhece role='owner' (superconjunto de 'admin')
-- -----------------------------------------------------------------------------
-- Problema: 202606b_user_roles.sql define is_admin() com role = 'admin'.
-- Após o PR #196 (admin multi-usuário), a Claudia passou a ter role = 'owner'.
-- Com a definição anterior, is_admin() retornava FALSE para ela, bloqueando
-- todas as RLS policies admin_full_* (transactions, clients, categories, etc.)
--
-- Fix: ampliar o check para role IN ('admin', 'owner').
-- Alinhado com useIsAdmin() e isAdmin() nos edge functions (PR #197).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMENT ON FUNCTION public.is_admin() IS
  'Retorna true se o usuário autenticado tem role=''admin'' ou role=''owner'' em public.user_roles. '
  '''owner'' é superconjunto de ''admin'' — tem acesso a tudo que admin tem. '
  'SECURITY DEFINER para contornar RLS da própria tabela user_roles.';
