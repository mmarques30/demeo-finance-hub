-- Módulo 03 · Parcelamentos
-- Adiciona colunas de parcelamento à tabela transactions

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS installment_total    INT  CHECK (installment_total  > 0),
  ADD COLUMN IF NOT EXISTS installment_number   INT  CHECK (installment_number > 0),
  ADD COLUMN IF NOT EXISTS installment_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_tx_installment_group
  ON public.transactions(installment_group_id)
  WHERE installment_group_id IS NOT NULL;
