-- ============================================================
-- Plano de Contas por cliente
-- - Adiciona código contábil hierárquico às categorias (ex: '3.1.1')
-- - Guarda o histórico dos arquivos de plano de contas enviados
-- - Bucket privado 'planos' para os arquivos originais (histórico/download)
--
-- O plano de contas ALIMENTA a tabela categories (motor de classificação):
-- as contas-folha viram categorias do cliente e regem a classificação da IA,
-- replicando automaticamente todos os meses. DFC/DRE seguem inalterados —
-- o parse mapeia os grupos de nível 1 para os group_name que dre.ts já entende.
-- ============================================================

BEGIN;

-- 1. Código contábil hierárquico na categoria (nullable — categorias antigas ficam sem código)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS code TEXT;

CREATE INDEX IF NOT EXISTS idx_categories_client_code
  ON public.categories(client_id, code);

-- 2. Histórico de planos de contas enviados (1 registro por upload; is_active marca o vigente)
CREATE TABLE IF NOT EXISTS public.chart_of_accounts_uploads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  filename       TEXT NOT NULL,
  storage_path   TEXT NOT NULL,
  accounts_count INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  uploaded_by    UUID,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chart_of_accounts_uploads ENABLE ROW LEVEL SECURITY;

-- Somente admin gerencia planos de contas (mesma política de categories)
DROP POLICY IF EXISTS "admin_all_coa_uploads" ON public.chart_of_accounts_uploads;
CREATE POLICY "admin_all_coa_uploads" ON public.chart_of_accounts_uploads
  FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_coa_uploads_client
  ON public.chart_of_accounts_uploads(client_id, created_at DESC);

-- 3. Bucket privado para os arquivos de plano de contas
INSERT INTO storage.buckets (id, name, public)
VALUES ('planos', 'planos', false)
ON CONFLICT (id) DO NOTHING;

-- Leitura restrita a admin (necessária p/ gerar URL assinada de download do histórico)
DROP POLICY IF EXISTS "planos_admin_read" ON storage.objects;
CREATE POLICY "planos_admin_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'planos' AND public.is_admin());

-- Escrita/atualização/remoção restrita a admin (a EF usa service_role e ignora RLS,
-- mas mantemos as políticas p/ consistência e caso de upload direto)
DROP POLICY IF EXISTS "planos_admin_insert" ON storage.objects;
CREATE POLICY "planos_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'planos' AND public.is_admin());

DROP POLICY IF EXISTS "planos_admin_update" ON storage.objects;
CREATE POLICY "planos_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'planos' AND public.is_admin());

DROP POLICY IF EXISTS "planos_admin_delete" ON storage.objects;
CREATE POLICY "planos_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'planos' AND public.is_admin());

COMMIT;
