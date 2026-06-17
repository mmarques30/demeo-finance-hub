-- Índice composto (client_id, status, date) em transactions
-- Otimiza a query mais executada do sistema:
-- SELECT ... FROM transactions WHERE client_id = X AND status = 'approved' AND date >= Y AND date <= Z
-- Os índices simples de 0001 (client_id, status, date separados) não cobrem essa combinação eficientemente.
CREATE INDEX IF NOT EXISTS idx_transactions_client_status_date
  ON public.transactions(client_id, status, date);
