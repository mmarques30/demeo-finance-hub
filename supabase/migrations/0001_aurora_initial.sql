-- ============================================================
-- Aurora · Migration 0001 · Schema Inicial
-- Módulo 01: Importação Inteligente de Extratos
-- ============================================================
-- Como aplicar: Lovable → Supabase → SQL Editor → colar e rodar
-- ============================================================


-- ──────────────────────────────────────────────
-- 1. EXTENSÕES
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ──────────────────────────────────────────────
-- 2. TABELAS BASE
-- ──────────────────────────────────────────────

-- Clientes PJ
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  owner_name  TEXT NOT NULL,
  cnpj        TEXT,
  status      TEXT NOT NULL DEFAULT 'Em andamento',
  -- 'Fechado' | 'Pendente' | 'Em andamento'
  portal_features JSONB DEFAULT '{"dfc":true,"projecao":false,"download":false}',
  last_upload_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Bancos por cliente (múltiplas contas)
CREATE TABLE IF NOT EXISTS client_banks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  bank_name   TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, bank_name)
);

-- Uploads de extratos
CREATE TABLE IF NOT EXISTS uploads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  bank_name      TEXT NOT NULL,
  filename       TEXT NOT NULL,
  storage_path   TEXT NOT NULL,
  period         TEXT NOT NULL,   -- ex: '04/2026'
  status         TEXT NOT NULL DEFAULT 'processing',
  -- 'processing' | 'parsed' | 'classifying' | 'done' | 'error'
  tx_total       INT  DEFAULT 0,
  tx_classified  INT  DEFAULT 0,
  tx_pending     INT  DEFAULT 0,
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Transações (lançamentos)
CREATE TABLE IF NOT EXISTS transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  upload_id        UUID REFERENCES uploads(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  description      TEXT NOT NULL,
  raw_description  TEXT,
  amount           NUMERIC(14,2) NOT NULL,
  -- positivo = receita | negativo = despesa
  category         TEXT,
  bank             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'classified' | 'approved'
  is_recurring     BOOLEAN DEFAULT false,
  confidence       INT,   -- 0–100, score da IA
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Regras de classificação (aprendizado por cliente)
CREATE TABLE IF NOT EXISTS classification_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  pattern      TEXT NOT NULL,   -- substring ILIKE match na descrição
  category     TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  hit_count    INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, pattern)
);


-- ──────────────────────────────────────────────
-- 3. ÍNDICES
-- ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_transactions_client_id  ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_upload_id  ON transactions(upload_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status     ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_uploads_client_id       ON uploads(client_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status          ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_rules_client_id         ON classification_rules(client_id);


-- ──────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────

ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_banks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_rules ENABLE ROW LEVEL SECURITY;

-- Helper: verifica se o usuário logado é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: retorna o client_id do usuário logado (portal)
CREATE OR REPLACE FUNCTION current_client_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'client_id')::uuid;
$$ LANGUAGE sql SECURITY DEFINER;


-- clients
CREATE POLICY "admin_all_clients" ON clients
  FOR ALL USING (is_admin());

CREATE POLICY "client_read_own" ON clients
  FOR SELECT USING (id = current_client_id());

-- client_banks
CREATE POLICY "admin_all_banks" ON client_banks
  FOR ALL USING (is_admin());

-- uploads
CREATE POLICY "admin_all_uploads" ON uploads
  FOR ALL USING (is_admin());

-- transactions
CREATE POLICY "admin_all_transactions" ON transactions
  FOR ALL USING (is_admin());

-- Portal cliente: só lê as próprias transações aprovadas
CREATE POLICY "client_read_transactions" ON transactions
  FOR SELECT USING (
    client_id = current_client_id()
    AND status = 'approved'
  );

-- classification_rules
CREATE POLICY "admin_all_rules" ON classification_rules
  FOR ALL USING (is_admin());


-- ──────────────────────────────────────────────
-- 5. REALTIME (para status de upload ao vivo na UI)
-- ──────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE uploads;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;


-- ──────────────────────────────────────────────
-- 6. STORAGE BUCKET
-- ──────────────────────────────────────────────
-- Rodar separadamente no SQL Editor do Supabase:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('extratos', 'extratos', false);
--
-- CREATE POLICY "admin_upload_extratos" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'extratos' AND is_admin()
--   );
--
-- CREATE POLICY "admin_read_extratos" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'extratos' AND is_admin()
--   );
