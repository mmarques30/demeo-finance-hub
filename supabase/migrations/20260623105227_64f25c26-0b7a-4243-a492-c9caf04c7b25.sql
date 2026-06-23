
-- Receitas Brutas por cliente/período (regime de competência)
CREATE TABLE IF NOT EXISTS public.monthly_revenue_entries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period         text NOT NULL,
  entry_date     date NOT NULL,
  invoice_ref    text NOT NULL DEFAULT '',
  sales_channel  text NOT NULL DEFAULT '',
  gross_amount   numeric(15,2) NOT NULL DEFAULT 0,
  taxes_withheld numeric(15,2) NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_revenue_entries TO authenticated;
GRANT ALL ON public.monthly_revenue_entries TO service_role;

ALTER TABLE public.monthly_revenue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage monthly_revenue_entries"
  ON public.monthly_revenue_entries FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_mre_client_period
  ON public.monthly_revenue_entries (client_id, period);

CREATE TRIGGER trg_mre_set_updated_at
  BEFORE UPDATE ON public.monthly_revenue_entries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Checklist e status de conclusão do fechamento mensal
CREATE TABLE IF NOT EXISTS public.monthly_closings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period       text NOT NULL,
  step1_done   boolean NOT NULL DEFAULT false,
  step2_done   boolean NOT NULL DEFAULT false,
  step3_done   boolean NOT NULL DEFAULT false,
  step4_done   boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, period)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_closings TO authenticated;
GRANT ALL ON public.monthly_closings TO service_role;

ALTER TABLE public.monthly_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage monthly_closings"
  ON public.monthly_closings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_mc_set_updated_at
  BEFORE UPDATE ON public.monthly_closings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
