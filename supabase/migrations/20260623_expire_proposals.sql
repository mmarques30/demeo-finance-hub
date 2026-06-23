-- Aurora · Função: expire_proposals
-- Expira propostas com validity_days vencidos e status 'sent' ou 'viewed'.
-- Chamada pela edge function expire-proposals (n8n cron diário).

CREATE OR REPLACE FUNCTION public.expire_proposals()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INT;
BEGIN
  UPDATE proposals
  SET status = 'expired'
  WHERE status IN ('sent', 'viewed')
    AND created_at + (validity_days * INTERVAL '1 day') < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  RETURN jsonb_build_object('expired', expired_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_proposals() TO service_role;
