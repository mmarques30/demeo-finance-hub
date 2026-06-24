DROP POLICY IF EXISTS "client_read_categories" ON public.categories;
DROP POLICY IF EXISTS "client_read_payables" ON public.payables;

CREATE POLICY "client_read_categories" ON public.categories
  FOR SELECT TO authenticated
  USING (client_id = public.current_client_id());

CREATE POLICY "client_read_payables" ON public.payables
  FOR SELECT TO authenticated
  USING (client_id = public.current_client_id());