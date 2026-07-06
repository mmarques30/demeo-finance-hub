BEGIN;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS code TEXT;
CREATE INDEX IF NOT EXISTS idx_categories_client_code ON public.categories(client_id, code);

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chart_of_accounts_uploads TO authenticated;
GRANT ALL ON public.chart_of_accounts_uploads TO service_role;

ALTER TABLE public.chart_of_accounts_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_coa_uploads" ON public.chart_of_accounts_uploads;
CREATE POLICY "admin_all_coa_uploads" ON public.chart_of_accounts_uploads
  FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_coa_uploads_client
  ON public.chart_of_accounts_uploads(client_id, created_at DESC);

DROP POLICY IF EXISTS "planos_admin_read" ON storage.objects;
CREATE POLICY "planos_admin_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'planos' AND public.is_admin());

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