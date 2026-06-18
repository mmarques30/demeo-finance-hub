ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS monthly_closing_day smallint
    CHECK (monthly_closing_day BETWEEN 1 AND 31);

COMMENT ON COLUMN public.clients.monthly_closing_day IS
  'Dia do mês em que o cliente fecha a competência (ex: 25 = dia 25 de cada mês).';
