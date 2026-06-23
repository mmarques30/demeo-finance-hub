
ALTER TABLE public.user_client_mapping
  ADD COLUMN IF NOT EXISTS portal_role TEXT NOT NULL DEFAULT 'owner'
  CHECK (portal_role IN ('owner', 'financeiro'));

CREATE OR REPLACE FUNCTION public.current_portal_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT portal_role FROM public.user_client_mapping WHERE user_id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.current_portal_role() TO authenticated;

ALTER TABLE public.user_client_mapping
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;
CREATE INDEX IF NOT EXISTS ucm_client_id_idx ON public.user_client_mapping(client_id);

ALTER TABLE public.report_exports
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Dedupe: keep most recent (by exported_at) per (client_id, start_date, type)
DELETE FROM public.report_exports a
USING public.report_exports b
WHERE a.client_id = b.client_id
  AND a.start_date = b.start_date
  AND a.type = b.type
  AND (a.exported_at < b.exported_at
       OR (a.exported_at = b.exported_at AND a.id < b.id));

ALTER TABLE public.report_exports
  DROP CONSTRAINT IF EXISTS report_exports_client_period_type_key;
ALTER TABLE public.report_exports
  ADD CONSTRAINT report_exports_client_period_type_key
  UNIQUE (client_id, start_date, type);

ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_report_exports" ON public.report_exports;
CREATE POLICY "admin_all_report_exports"
  ON public.report_exports FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "client_read_own_report_exports" ON public.report_exports;
CREATE POLICY "client_read_own_report_exports"
  ON public.report_exports FOR SELECT TO authenticated
  USING (client_id = public.current_client_id());

DROP POLICY IF EXISTS "client_read_own_reports" ON storage.objects;
CREATE POLICY "client_read_own_reports"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = (public.current_client_id())::text
  );

DROP POLICY IF EXISTS "service_insert_reports" ON storage.objects;
CREATE POLICY "service_insert_reports"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'reports');
