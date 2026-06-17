-- Módulo 02 · Aprovação de Recorrências
-- Adiciona 'rejected' ao CHECK source e cria RPCs para a tela de recorrências

-- 1. Permite marcar padrão como rejeitado (não reaparece na lista)
ALTER TABLE public.classification_rules
  DROP CONSTRAINT IF EXISTS classification_rules_source_check;
ALTER TABLE public.classification_rules
  ADD CONSTRAINT classification_rules_source_check
    CHECK (source IN ('manual', 'approval', 'ai', 'import', 'rejected'));

-- 2. RPC: padrões recorrentes detectados que ainda não têm regra (ativa ou rejeitada)
CREATE OR REPLACE FUNCTION public.pending_recurrences(p_client_id UUID)
RETURNS TABLE (
  pattern        TEXT,
  modal_category TEXT,
  occurrences    BIGINT,
  last_seen      DATE
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    rp.pattern,
    rp.modal_category,
    rp.occurrences,
    rp.last_seen
  FROM public.recurrence_patterns rp
  LEFT JOIN public.classification_rules cr
    ON  cr.client_id = rp.client_id
    AND cr.pattern   = rp.pattern
  WHERE rp.client_id = p_client_id
    AND cr.id IS NULL
  ORDER BY rp.occurrences DESC;
$$;

-- 3. RPC: contagem global de padrões pendentes (usado para o badge no menu)
CREATE OR REPLACE FUNCTION public.pending_recurrences_total()
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)
  FROM public.recurrence_patterns rp
  LEFT JOIN public.classification_rules cr
    ON  cr.client_id = rp.client_id
    AND cr.pattern   = rp.pattern
  WHERE cr.id IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.pending_recurrences(UUID)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.pending_recurrences_total() TO authenticated;
