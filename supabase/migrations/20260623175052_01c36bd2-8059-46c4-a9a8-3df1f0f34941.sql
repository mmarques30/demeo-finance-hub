ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS client_address TEXT,
  ADD COLUMN IF NOT EXISTS total_one_off  NUMERIC(12, 2) DEFAULT 0;