-- M08 · Trigger: atualiza clients.last_upload_at ao inserir upload
-- Garante que a coluna last_upload_at (usada em Relatórios, Dashboard e Clientes)
-- seja sempre preenchida automaticamente quando um novo extrato é importado.
-- APLICAR VIA SQL EDITOR DO LOVABLE CLOUD

CREATE OR REPLACE FUNCTION public.set_client_last_upload()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.clients
    SET last_upload_at = NOW()
  WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_last_upload ON public.uploads;
CREATE TRIGGER trg_client_last_upload
  AFTER INSERT ON public.uploads
  FOR EACH ROW EXECUTE FUNCTION public.set_client_last_upload();

-- Backfill: clientes com uploads anteriores ao trigger
UPDATE public.clients c
SET last_upload_at = (
  SELECT MAX(created_at) FROM public.uploads u WHERE u.client_id = c.id
)
WHERE EXISTS (SELECT 1 FROM public.uploads u WHERE u.client_id = c.id);
