CREATE TABLE IF NOT EXISTS public.report_exports (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  type        text NOT NULL CHECK (type IN ('pdf', 'xlsx')),
  period_label text NOT NULL,
  start_date  date NOT NULL,
  end_date    date NOT NULL,
  exported_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS report_exports_client_id_idx ON public.report_exports(client_id);
CREATE INDEX IF NOT EXISTS report_exports_exported_at_idx ON public.report_exports(exported_at DESC);

COMMENT ON TABLE public.report_exports IS
  'Registro de relatórios exportados pela admin (PDF e Excel). Permite histórico dos últimos documentos enviados aos clientes.';
