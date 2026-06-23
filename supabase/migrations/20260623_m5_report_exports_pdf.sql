-- Aurora M5 — report_exports: add pdf_url + RLS for portal clients

-- 1. Coluna pdf_url (URL assinada gerada pelo client-report-generate)
ALTER TABLE public.report_exports
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 2. Unique constraint para upsert por (client_id, start_date, type)
ALTER TABLE public.report_exports
  DROP CONSTRAINT IF EXISTS report_exports_client_period_type_key;
ALTER TABLE public.report_exports
  ADD CONSTRAINT report_exports_client_period_type_key
  UNIQUE (client_id, start_date, type);

-- 3. RLS: habilitar (caso não esteja ainda)
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- 3. Admin pode fazer tudo
DROP POLICY IF EXISTS "admin_all_report_exports" ON public.report_exports;
CREATE POLICY "admin_all_report_exports"
  ON public.report_exports
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 4. Cliente lê apenas os relatórios do próprio client_id
DROP POLICY IF EXISTS "client_read_own_report_exports" ON public.report_exports;
CREATE POLICY "client_read_own_report_exports"
  ON public.report_exports
  FOR SELECT
  TO authenticated
  USING (client_id = public.current_client_id());

-- 5. Bucket "reports" para PDFs do portal (se não existir, criar via Lovable/dashboard)
--    Criar via SQL de storage não é suportado; usar INSERT seguro:
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- 6. RLS storage: cliente lê apenas objetos com caminho que começa pelo seu client_id
DROP POLICY IF EXISTS "client_read_own_reports" ON storage.objects;
CREATE POLICY "client_read_own_reports"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = (public.current_client_id())::text
  );

-- 7. Service role pode inserir (EF usa SUPABASE_SERVICE_ROLE_KEY)
DROP POLICY IF EXISTS "service_insert_reports" ON storage.objects;
CREATE POLICY "service_insert_reports"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'reports');
