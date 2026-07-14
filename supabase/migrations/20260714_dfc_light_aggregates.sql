-- =============================================================================
-- DFC / Extratos · aggregações leves (evita baixar milhares de linhas no client)
-- =============================================================================

BEGIN;

-- Soma de lançamentos aprovados antes de uma data (saldo inicial da DFC)
CREATE OR REPLACE FUNCTION public.sum_approved_before(
  p_client_id uuid,
  p_before    date
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(t.amount), 0)::numeric
  FROM public.transactions t
  WHERE t.client_id = p_client_id
    AND t.status    = 'approved'
    AND t.date      < p_before;
$$;

GRANT EXECUTE ON FUNCTION public.sum_approved_before(uuid, date) TO authenticated;

-- Contagem de classified/pending por upload (histórico de extratos)
CREATE OR REPLACE FUNCTION public.tx_awaiting_by_upload(p_client_id uuid)
RETURNS TABLE (
  upload_id  uuid,
  classified bigint,
  pending    bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    t.upload_id,
    COUNT(*) FILTER (WHERE t.status = 'classified')::bigint AS classified,
    COUNT(*) FILTER (WHERE t.status = 'pending')::bigint    AS pending
  FROM public.transactions t
  WHERE t.client_id = p_client_id
    AND t.upload_id IS NOT NULL
    AND t.status IN ('classified', 'pending')
  GROUP BY t.upload_id;
$$;

GRANT EXECUTE ON FUNCTION public.tx_awaiting_by_upload(uuid) TO authenticated;

COMMIT;
