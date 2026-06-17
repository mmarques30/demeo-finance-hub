-- M04 · Contas a Pagar e a Receber (payables)
-- Lançamentos futuros com vencimento definido, por cliente.
-- status ('pendente' | 'pago') é armazenado; 'vencido' é computado no frontend
-- quando due_date < hoje e paid_at IS NULL.

BEGIN;

CREATE TABLE IF NOT EXISTS public.payables (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID           NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type        TEXT           NOT NULL CHECK (type IN ('pagar', 'receber')),
  description TEXT           NOT NULL,
  amount      NUMERIC(14,2)  NOT NULL CHECK (amount > 0),
  due_date    DATE           NOT NULL,
  paid_at     DATE,
  category    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ    DEFAULT now()
);

-- RLS: somente admin acessa
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_payables" ON public.payables
  FOR ALL USING (public.is_admin());

-- Índices
CREATE INDEX IF NOT EXISTS idx_payables_client_id
  ON public.payables(client_id);

CREATE INDEX IF NOT EXISTS idx_payables_due_date
  ON public.payables(due_date);

-- Cobre a query principal: client + type + pendentes (paid_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_payables_client_type_due
  ON public.payables(client_id, type, due_date)
  WHERE paid_at IS NULL;

COMMIT;
