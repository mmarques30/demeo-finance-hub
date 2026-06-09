-- =============================================================================
-- Aurora · Refactor profiles.role → user_roles (padrão Supabase)
-- -----------------------------------------------------------------------------
-- Motivação: regra do projeto (linter/Supabase) recomenda separar 'role' em
-- tabela própria para:
--   1. Suportar múltiplos papéis por usuário no futuro (admin + analista, etc).
--   2. Evitar que policies de profiles vazem informação de role indiretamente.
--   3. Endurecer self_update em profiles (sem precisar do guard de role).
--
-- Migration idempotente — pode rodar 2x sem quebrar.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Tabela user_roles
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id    uuid       NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text       NOT NULL CHECK (role IN ('admin','client')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role    ON public.user_roles (role);

-- -----------------------------------------------------------------------------
-- 2. Backfill — copia profiles.role existente, se houver
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'role'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT user_id, role
    FROM public.profiles
    WHERE role IS NOT NULL
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. is_admin() agora consulta user_roles (mantém assinatura — não quebra
--    nenhuma das policies M6 admin_full_<tabela>)
-- -----------------------------------------------------------------------------

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
      AND role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- 4. Trigger de novo usuário — agora cria linha em user_roles (role='client')
--    em vez de gravar em profiles.role
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Profile básico (sem role)
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Role default 'client'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- O trigger em si já existe (criado em 202606a_profiles_admin.sql).
-- Apenas reapontamos pra função atualizada (CREATE OR REPLACE acima).

-- -----------------------------------------------------------------------------
-- 5. RLS + policies em user_roles
-- -----------------------------------------------------------------------------

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Admin acessa tudo
DROP POLICY IF EXISTS admin_full_user_roles ON public.user_roles;
CREATE POLICY admin_full_user_roles
  ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Usuário pode ler os próprios roles
DROP POLICY IF EXISTS self_read_user_roles ON public.user_roles;
CREATE POLICY self_read_user_roles
  ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- IMPORTANTE: usuário NÃO pode inserir/atualizar seu próprio role.
-- Sem policy de INSERT/UPDATE/DELETE pra 'authenticated' — só admin_full faz isso.

-- -----------------------------------------------------------------------------
-- 6. Endurece policies de profiles — remove o guard de role (não vive mais lá)
--    Mantém profiles.role como coluna legacy pra rollback fácil, mas o leitor
--    canônico é user_roles agora.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS self_update ON public.profiles;
CREATE POLICY self_update
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- profiles.role fica como coluna legacy. Pra remover de vez:
--   ALTER TABLE public.profiles DROP COLUMN role;
-- Não removemos aqui pra dar um ciclo de deploy de margem (em caso de rollback
-- a função is_admin antiga ainda consegue ler de profiles).

COMMIT;
