-- M02 · Views de métricas
-- recurrence_patterns: Camada 2 do classify-batch (padrões aprovados nos últimos 90 dias)
-- accuracy_report: acurácia de classificação automática por cliente/mês

BEGIN;

-- Depende de: 20260615_m02_functions.sql (build_pattern)

-- Camada 2: padrões recorrentes — base para classificação sem custo de IA
-- Padrão que apareceu >= 2x aprovado nos últimos 90 dias vira sugestão automática
CREATE OR REPLACE VIEW public.recurrence_patterns AS
SELECT
  client_id,
  public.build_pattern(description)       AS pattern,
  MODE() WITHIN GROUP (ORDER BY category) AS modal_category,
  COUNT(*)                                AS occurrences,
  MAX(date)                               AS last_seen
FROM public.transactions
WHERE status = 'approved'
  AND date >= CURRENT_DATE - INTERVAL '90 days'
  AND category IS NOT NULL
  AND upload_id IS NOT NULL  -- exclui lançamentos manuais do cálculo de recorrência
GROUP BY client_id, public.build_pattern(description)
HAVING COUNT(*) >= 2;

-- Acurácia: % de transações classificadas automaticamente por cliente/mês
-- COALESCE garante 0 em vez de NULL quando total = 0
CREATE OR REPLACE VIEW public.accuracy_report AS
SELECT
  t.client_id,
  c.name                                                   AS client_name,
  DATE_TRUNC('month', t.date)::date                       AS month,
  COUNT(*)                                                 AS total,
  COUNT(*) FILTER (WHERE t.confidence >= 0.85)            AS auto_high,
  COUNT(*) FILTER (WHERE t.confidence >= 0.70
                     AND t.confidence <  0.85)            AS auto_medium,
  COUNT(*) FILTER (WHERE t.status = 'pending'
                     AND t.upload_id IS NOT NULL)         AS manual_queue,
  COALESCE(
    ROUND(
      COUNT(*) FILTER (WHERE t.confidence >= 0.70)::numeric
      / NULLIF(COUNT(*), 0) * 100, 1
    ), 0
  )                                                        AS accuracy_pct
FROM public.transactions t
JOIN public.clients c ON c.id = t.client_id
WHERE t.upload_id IS NOT NULL
GROUP BY t.client_id, c.name, DATE_TRUNC('month', t.date);

COMMIT;
