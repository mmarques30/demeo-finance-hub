-- 20260619 · Auditoria, soft-delete e índices faltantes
-- Módulo 04: rastreabilidade de aprovações + arquivamento seguro de clientes
-- Aplicar via Lovable → Supabase → SQL Editor

BEGIN;

-- ──────────────────────────────────────────────
-- 1. Auditoria de aprovações em transactions
-- ──────────────────────────────────────────────
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS approved_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_transactions_approved_by
  ON public.transactions(approved_by) WHERE approved_by IS NOT NULL;

-- ──────────────────────────────────────────────
-- 2. Índice em category (ausente, necessário para DRE/relatórios)
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_category
  ON public.transactions(category) WHERE category IS NOT NULL;

-- ──────────────────────────────────────────────
-- 3. Soft-delete em clients
-- ──────────────────────────────────────────────
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_clients_deleted_at
  ON public.clients(deleted_at) WHERE deleted_at IS NOT NULL;

-- ──────────────────────────────────────────────
-- 4. RPC atômica de aprovação em lote
--    Garante BEGIN/COMMIT único para N transações
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_transactions_batch(
  p_updates JSONB
  -- [{id, category, is_recurring, installment_number?, installment_total?, installment_group_id?}]
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec JSONB;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem aprovar transações';
  END IF;

  FOR rec IN SELECT value FROM jsonb_array_elements(p_updates)
  LOOP
    UPDATE transactions
    SET
      category             = rec->>'category',
      status               = 'approved',
      is_recurring         = (rec->>'is_recurring')::boolean,
      installment_number   = CASE WHEN rec ? 'installment_number'
                               THEN (rec->>'installment_number')::int   ELSE NULL END,
      installment_total    = CASE WHEN rec ? 'installment_total'
                               THEN (rec->>'installment_total')::int    ELSE NULL END,
      installment_group_id = CASE WHEN rec ? 'installment_group_id'
                               THEN (rec->>'installment_group_id')::uuid ELSE NULL END,
      approved_by          = auth.uid(),
      approved_at          = now()
    WHERE id = (rec->>'id')::uuid;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_transactions_batch(JSONB) TO authenticated;

COMMIT;

-- Verificação pós-aplicação:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'transactions' AND column_name IN ('approved_by', 'approved_at');
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'clients' AND column_name = 'deleted_at';
-- SELECT proname FROM pg_proc WHERE proname = 'approve_transactions_batch';
