-- Aurora M5 — user_client_mapping: add email + display_name for easy listing

ALTER TABLE public.user_client_mapping
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Índice para lookup por client_id (gestão de usuários no admin)
CREATE INDEX IF NOT EXISTS ucm_client_id_idx ON public.user_client_mapping(client_id);
