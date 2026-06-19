-- M02 · DFC · RPC recurrence_monthly_avg
-- Retorna o valor médio mensal (despesa) por padrão identificado em recurrence_patterns.
-- Usado pela projeção DFC como âncora de custo fixo por padrão — mais precisa que
-- o campo is_recurring, que depende de flag manual na aprovação.

CREATE OR REPLACE FUNCTION public.recurrence_monthly_avg(p_client_id uuid)
RETURNS TABLE(
  pattern            text,
  modal_category     text,
  avg_monthly_amount numeric,
  occurrences        bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    rp.pattern,
    rp.modal_category,
    ABS(AVG(m.monthly_total))::numeric  AS avg_monthly_amount,
    rp.occurrences
  FROM public.recurrence_patterns rp
  JOIN (
    SELECT
      client_id,
      public.build_pattern(description)  AS pattern,
      DATE_TRUNC('month', date)          AS month,
      SUM(amount)                        AS monthly_total
    FROM public.transactions
    WHERE status    = 'approved'
      AND amount    < 0
      AND upload_id IS NOT NULL
      AND date      >= CURRENT_DATE - INTERVAL '90 days'
      AND client_id = p_client_id
    GROUP BY
      client_id,
      public.build_pattern(description),
      DATE_TRUNC('month', date)
  ) m ON m.client_id = rp.client_id
      AND m.pattern  = rp.pattern
  WHERE rp.client_id = p_client_id
  GROUP BY rp.pattern, rp.modal_category, rp.occurrences
  ORDER BY avg_monthly_amount DESC;
$$;
