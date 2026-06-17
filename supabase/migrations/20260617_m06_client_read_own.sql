-- M06 · Segurança RLS — client_read_own em clients
-- A policy client_read_own ficou com role {public} após M05 (não foi incluída).
-- Migra para {authenticated} para eliminar tentativas anon.
-- APLICAR VIA SQL EDITOR DO LOVABLE CLOUD

BEGIN;

DROP POLICY IF EXISTS "client_read_own" ON public.clients;
CREATE POLICY "client_read_own" ON public.clients
  FOR SELECT TO authenticated USING (id = public.current_client_id());

COMMIT;

-- Verificação:
-- SELECT policyname, roles FROM pg_policies WHERE tablename = 'clients' AND policyname = 'client_read_own';
-- deve retornar roles = '{authenticated}'
