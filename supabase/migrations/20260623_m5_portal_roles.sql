-- Aurora M5 — Sub-roles do portal do cliente
-- Adiciona portal_role em user_client_mapping (owner | financeiro)
-- Adiciona função current_portal_role() SECURITY DEFINER

-- 1. Coluna portal_role
ALTER TABLE public.user_client_mapping
  ADD COLUMN IF NOT EXISTS portal_role TEXT NOT NULL DEFAULT 'owner'
  CHECK (portal_role IN ('owner', 'financeiro'));

-- 2. Função que retorna o portal_role do usuário logado
--    Lida de user_client_mapping (server-side, não spoofável via JWT)
CREATE OR REPLACE FUNCTION public.current_portal_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT portal_role
  FROM public.user_client_mapping
  WHERE user_id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.current_portal_role() TO authenticated;

-- 3. Política: financeiro pode ler transações mas não altera nada
--    (as policies de INSERT/UPDATE/DELETE do admin já existem;
--     a leitura do cliente é feita via current_client_id() que não muda)
--    Nenhuma policy nova necessária — o gate de sub-role é feito na aplicação.
