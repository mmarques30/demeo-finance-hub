-- Tabela auxiliar para rate-limit por IP usada pelas edge functions Aurora.
-- A migration principal (202606_modulo6_aurora.sql) já roda antes; esta é leve.

BEGIN;

CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id      bigserial PRIMARY KEY,
  ip      text         NOT NULL,
  bucket  text         NOT NULL,
  hit_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rlh_ip_bucket_hit
  ON public.rate_limit_hits (ip, bucket, hit_at DESC);

-- Purge automático: limpa hits com mais de 24h via cron (rodar manualmente ou via pg_cron)
-- DELETE FROM public.rate_limit_hits WHERE hit_at < now() - interval '24 hours';

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy: só service role acessa.

COMMIT;
