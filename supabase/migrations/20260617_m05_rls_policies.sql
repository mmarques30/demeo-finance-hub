-- M05 · Segurança RLS
-- L1: Reativa RLS em clients (desabilitado manualmente no Supabase)
-- L2: Migra policies das 6 tabelas de {public} para {authenticated}
--     — anon não deve conseguir disparar nenhuma policy, mesmo que o predicado bloqueie.
-- APLICAR VIA SQL EDITOR DO LOVABLE CLOUD (não via CLI)

BEGIN;

-- ──────────────────────────────────────────────
-- L1: Reativar RLS em clients
-- ──────────────────────────────────────────────
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- L2: categories
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_categories" ON public.categories;
CREATE POLICY "admin_all_categories" ON public.categories
  FOR ALL TO authenticated USING (public.is_admin());

-- ──────────────────────────────────────────────
-- L2: classification_rules
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_rules" ON public.classification_rules;
CREATE POLICY "admin_all_rules" ON public.classification_rules
  FOR ALL TO authenticated USING (public.is_admin());

-- ──────────────────────────────────────────────
-- L2: client_banks
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_banks" ON public.client_banks;
CREATE POLICY "admin_all_banks" ON public.client_banks
  FOR ALL TO authenticated USING (public.is_admin());

-- ──────────────────────────────────────────────
-- L2: payables
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_payables" ON public.payables;
CREATE POLICY "admin_all_payables" ON public.payables
  FOR ALL TO authenticated USING (public.is_admin());

-- ──────────────────────────────────────────────
-- L2: transactions
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_transactions" ON public.transactions;
CREATE POLICY "admin_all_transactions" ON public.transactions
  FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "client_read_transactions" ON public.transactions;
CREATE POLICY "client_read_transactions" ON public.transactions
  FOR SELECT TO authenticated USING (
    client_id = public.current_client_id()
    AND status = 'approved'
  );

-- ──────────────────────────────────────────────
-- L2: uploads
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_uploads" ON public.uploads;
CREATE POLICY "admin_all_uploads" ON public.uploads
  FOR ALL TO authenticated USING (public.is_admin());

COMMIT;

-- Verificação pós-aplicação:
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'clients';   → deve retornar 't'
-- SELECT tablename, policyname, roles FROM pg_policies
--   WHERE tablename IN ('categories','classification_rules','client_banks','payables','transactions','uploads')
--   AND roles = '{public}';   → deve retornar 0 linhas
