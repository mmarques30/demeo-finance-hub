-- =============================================================================
-- user_roles: garante colunas de meta + CHECK aceitando 'owner'
-- -----------------------------------------------------------------------------
-- Produção já usa display_name/email e role='owner', mas a migration base
-- (202606b) só permitia ('admin','client'). Idempotente.
-- =============================================================================

BEGIN;

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Amplia o CHECK para incluir 'owner' (superconjunto de admin no painel)
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('admin', 'owner', 'client'));

COMMIT;
