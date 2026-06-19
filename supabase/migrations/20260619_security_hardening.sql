-- 20260619 · Correção dos 4 achados do scanner de segurança do Lovable
-- 1. RLS ausente em report_exports
-- 2. Views sem security_invoker (recurrence_patterns, accuracy_report)
-- 3. current_client_id() lê JWT user_metadata (spoofável pelo usuário)
-- 4. current_client_id() SECURITY DEFINER sem SET search_path

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- 1. RLS em report_exports
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_report_exports" ON public.report_exports
  FOR ALL TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────────────────
-- 2. security_invoker nas views de métricas
--    Sem isso as views executam com permissões do owner (bypassa RLS do caller)
-- ──────────────────────────────────────────────────────────────────────────
ALTER VIEW public.recurrence_patterns   SET (security_invoker = on);
ALTER VIEW public.accuracy_report       SET (security_invoker = on);

-- ──────────────────────────────────────────────────────────────────────────
-- 3 + 4. Tabela server-side para mapeamento user → client
--        current_client_id() passa a ler desta tabela em vez do JWT metadata,
--        eliminando o vetor de spoofing e adicionando search_path explícito.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_client_mapping (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id  UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.user_client_mapping ENABLE ROW LEVEL SECURITY;

-- Admins gerenciam todos os mapeamentos
CREATE POLICY "admin_all_user_client_mapping" ON public.user_client_mapping
  FOR ALL TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- Usuário pode ler o próprio mapeamento (necessário para RLS do portal)
CREATE POLICY "user_read_own_mapping" ON public.user_client_mapping
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_client_mapping TO authenticated;
GRANT ALL ON public.user_client_mapping TO service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- Migração de dados: popula a partir do metadata existente em auth.users
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO public.user_client_mapping (user_id, client_id)
SELECT
  id,
  (raw_user_meta_data ->> 'client_id')::uuid
FROM auth.users
WHERE raw_user_meta_data ->> 'client_id' IS NOT NULL
  AND (raw_user_meta_data ->> 'client_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND (raw_user_meta_data ->> 'client_id')::uuid IN (SELECT id FROM public.clients)
ON CONFLICT (user_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────
-- Trigger: sincroniza automaticamente quando admin cria/atualiza portal user
-- Mantém user_client_mapping em sincronia sem exigir passo manual
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tg_sync_user_client_mapping()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_raw       TEXT;
  v_client_id UUID;
BEGIN
  v_raw := NEW.raw_user_meta_data ->> 'client_id';
  -- Valida formato UUID antes do cast para evitar erro em metadados inesperados
  IF v_raw IS NULL OR v_raw !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN NEW;
  END IF;
  v_client_id := v_raw::uuid;
  IF EXISTS (SELECT 1 FROM public.clients WHERE id = v_client_id) THEN
    INSERT INTO public.user_client_mapping (user_id, client_id)
    VALUES (NEW.id, v_client_id)
    ON CONFLICT (user_id) DO UPDATE SET client_id = EXCLUDED.client_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_sync_user_client_mapping ON auth.users;
CREATE TRIGGER tg_sync_user_client_mapping
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_user_client_mapping();

-- ──────────────────────────────────────────────────────────────────────────
-- current_client_id(): lê da tabela server-side + search_path explícito
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT client_id FROM public.user_client_mapping WHERE user_id = auth.uid()
$$;

COMMIT;
