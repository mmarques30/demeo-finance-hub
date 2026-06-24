-- Portal RLS: políticas de leitura para usuários do portal do cliente
-- categories: cliente lê apenas suas próprias categorias (necessário para DRE)
-- payables: cliente lê apenas seus lançamentos futuros (necessário para Projeção DFC)

CREATE POLICY "client_read_categories" ON public.categories
  FOR SELECT TO authenticated
  USING (client_id = public.current_client_id());

CREATE POLICY "client_read_payables" ON public.payables
  FOR SELECT TO authenticated
  USING (client_id = public.current_client_id());
