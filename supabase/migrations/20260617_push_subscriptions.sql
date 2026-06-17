-- Aurora · Tabela push_subscriptions
-- Armazena subscriptions de Web Push (PushManager).
-- Ativação futura: após configurar VAPID keys como Supabase Secrets.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Sem políticas públicas: apenas service_role (edge functions) acessa.
