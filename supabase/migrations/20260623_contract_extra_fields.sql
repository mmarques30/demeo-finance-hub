-- Aurora · Campos adicionais na tabela contracts
-- client_address: endereço completo do contratante (obrigatório no contrato real)
-- total_one_off:  valor de implantação (pago no ato, opcional)

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS client_address TEXT,
  ADD COLUMN IF NOT EXISTS total_one_off  NUMERIC(12, 2) DEFAULT 0;
