-- =============================================================================
-- Aurora · Módulo 6 — Migration complementar
-- Cria public.profiles + trigger de auto-criação + RLS policies.
-- A migration principal (202606_modulo6_aurora.sql) ASSUME profiles existe
-- e já cria public.is_admin(). Aqui completamos o que falta.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Tabela profiles
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'client' CHECK (role IN ('admin','client')),
  full_name  text,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- -----------------------------------------------------------------------------
-- 2. Garante is_admin() (já criada pela 202606_modulo6_aurora.sql,
--    mas duplicamos como CREATE OR REPLACE para idempotência caso essa
--    migration rode antes ou sozinha)
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
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- 3. Trigger: ao inserir em auth.users, cria linha em profiles (role='client')
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    'client'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.tg_handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. RLS + policies
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admin tem acesso completo
DROP POLICY IF EXISTS admin_full ON public.profiles;
CREATE POLICY admin_full
  ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Usuário pode ler o próprio perfil
DROP POLICY IF EXISTS self_read ON public.profiles;
CREATE POLICY self_read
  ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Usuário pode atualizar o próprio perfil (nome, email — não role)
DROP POLICY IF EXISTS self_update ON public.profiles;
CREATE POLICY self_update
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()));

COMMIT;
