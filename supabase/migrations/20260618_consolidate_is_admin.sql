-- Consolidação: is_admin() usa user_roles (definição ativa desde 202606b_user_roles.sql).
-- As definições anteriores (JWT claim em 0001, profiles.role em 202606_modulo6 e
-- 20260609195526) foram substituídas por CREATE OR REPLACE. Este arquivo apenas
-- documenta isso no banco via COMMENT ON FUNCTION.
COMMENT ON FUNCTION public.is_admin() IS
  'Retorna true se o usuário autenticado tem role=''admin'' em public.user_roles. '
  'Definição autoritativa: 202606b_user_roles.sql. '
  'Não usar JWT claim ou profiles.role — ambas as abordagens anteriores foram descontinuadas.';
