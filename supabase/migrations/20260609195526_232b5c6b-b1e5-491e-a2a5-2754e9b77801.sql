
-- =============================================================================
-- Módulo 6 — Aurora · CRM
-- =============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') $$;

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

CREATE TABLE public.document_counters (
  kind text NOT NULL, year smallint NOT NULL,
  next_value bigint NOT NULL DEFAULT 1,
  PRIMARY KEY (kind, year)
);

CREATE OR REPLACE FUNCTION public.next_proposal_number()
RETURNS text LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_year smallint := EXTRACT(YEAR FROM now())::smallint; v_n bigint;
BEGIN
  INSERT INTO public.document_counters (kind, year, next_value) VALUES ('proposal', v_year, 1)
  ON CONFLICT (kind, year) DO UPDATE SET next_value = public.document_counters.next_value + 1
  RETURNING next_value INTO v_n;
  RETURN format('AURORA-%s-%s', v_year, lpad(v_n::text, 4, '0'));
END; $$;

CREATE OR REPLACE FUNCTION public.next_contract_number()
RETURNS text LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_year smallint := EXTRACT(YEAR FROM now())::smallint; v_n bigint;
BEGIN
  INSERT INTO public.document_counters (kind, year, next_value) VALUES ('contract', v_year, 1)
  ON CONFLICT (kind, year) DO UPDATE SET next_value = public.document_counters.next_value + 1
  RETURNING next_value INTO v_n;
  RETURN format('AURORA-CTR-%s-%s', v_year, lpad(v_n::text, 4, '0'));
END; $$;

CREATE TABLE public.lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE, label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  position smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.lead_sources (slug, label, position) VALUES
  ('landing_page','Landing Page',1),('indicacao','Indicação',2),('instagram','Instagram',3),
  ('tiktok','TikTok',4),('whatsapp','WhatsApp',5),('outro','Outro',99);

CREATE TABLE public.deal_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE, label text NOT NULL, color text NOT NULL,
  is_won boolean NOT NULL DEFAULT false, is_lost boolean NOT NULL DEFAULT false,
  position smallint NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deal_stages_not_both_won_lost CHECK (NOT (is_won AND is_lost))
);
INSERT INTO public.deal_stages (slug, label, color, is_won, is_lost, position) VALUES
  ('lead','Lead','#8FA688',false,false,1),
  ('primeiro','Primeiro Contato','#B8956A',false,false,2),
  ('diagnostico','Diagnóstico','#D4B896',false,false,3),
  ('proposta','Proposta Enviada','#1B394D',false,false,4),
  ('fechado','Fechado','#4A6741',true,false,5),
  ('perdido','Perdido','#7A7260',false,true,6);

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE, name text NOT NULL, description text,
  unit text NOT NULL CHECK (unit IN ('mensal','projeto','horas')),
  base_price numeric(12,2) NOT NULL CHECK (base_price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.services (slug, name, unit, base_price) VALUES
  ('fechamento_mensal_completo','Fechamento Mensal Completo','mensal',1800.00),
  ('dfc_semanal','DFC Semanal','mensal',900.00),
  ('implantacao_inicial','Implantação Inicial','projeto',2500.00),
  ('consultoria_pontual','Consultoria Pontual','horas',350.00);

CREATE TABLE public.service_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  effective_from timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source IN ('manual_update','proposal','closed_deal')),
  reference_id uuid, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sph_service ON public.service_price_history (service_id, effective_from DESC);
INSERT INTO public.service_price_history (service_id, price, source, notes)
SELECT id, base_price, 'manual_update', 'Preço inicial (seed)' FROM public.services;

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, email text, phone text, company text, segment text,
  monthly_revenue_range text, pain_point text,
  source_id uuid REFERENCES public.lead_sources(id) ON DELETE SET NULL,
  utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  consent_lgpd boolean NOT NULL DEFAULT false,
  ip_address inet, user_agent text, raw_payload jsonb,
  promoted_to_deal_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_source ON public.leads (source_id);
CREATE INDEX idx_leads_created ON public.leads (created_at DESC);
CREATE INDEX idx_leads_email ON public.leads (email) WHERE email IS NOT NULL;

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_name text NOT NULL, contact_email text, contact_phone text, company text,
  stage_id uuid NOT NULL REFERENCES public.deal_stages(id),
  expected_value numeric(12,2) CHECK (expected_value IS NULL OR expected_value >= 0),
  service_type text, expected_close_date date,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text, lost_reason text,
  stage_changed_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deals_stage ON public.deals (stage_id);
CREATE INDEX idx_deals_owner ON public.deals (owner_id);
CREATE INDEX idx_deals_lead ON public.deals (lead_id);

ALTER TABLE public.leads ADD CONSTRAINT leads_promoted_to_deal_fk
  FOREIGN KEY (promoted_to_deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;

CREATE TABLE public.deal_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  from_stage_id uuid REFERENCES public.deal_stages(id),
  to_stage_id uuid NOT NULL REFERENCES public.deal_stages(id),
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dsh_deal ON public.deal_stage_history (deal_id, changed_at DESC);

CREATE TABLE public.deal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('note','call','email','meeting','task')),
  body text, done boolean NOT NULL DEFAULT false, due_date timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_da_deal ON public.deal_activities (deal_id, created_at DESC);
CREATE INDEX idx_da_due ON public.deal_activities (due_date) WHERE due_date IS NOT NULL AND done = false;

CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  number text UNIQUE, version smallint NOT NULL DEFAULT 1,
  client_name text NOT NULL, client_email text, client_phone text, client_document text,
  intro_text text, diagnosis_text text, payment_terms text,
  validity_days smallint NOT NULL DEFAULT 15 CHECK (validity_days > 0),
  total_monthly numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_monthly >= 0),
  total_one_off numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_one_off >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','accepted','declined','expired')),
  pdf_url text,
  public_token text UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  sent_at timestamptz, viewed_at timestamptz, decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_proposals_deal ON public.proposals (deal_id);
CREATE INDEX idx_proposals_status ON public.proposals (status);

CREATE TABLE public.proposal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  description text NOT NULL,
  unit text NOT NULL CHECK (unit IN ('mensal','projeto','horas')),
  quantity numeric(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  total numeric(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  position smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_proposal_items_proposal ON public.proposal_items (proposal_id, position);

CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  number text UNIQUE,
  client_name text NOT NULL, client_email text, client_document text,
  total_monthly numeric(12,2) NOT NULL CHECK (total_monthly >= 0),
  start_date date NOT NULL,
  termination_notice_days smallint NOT NULL DEFAULT 30 CHECK (termination_notice_days >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','active','terminated')),
  pdf_url text,
  signature_provider text NOT NULL DEFAULT 'manual' CHECK (signature_provider IN ('manual','clicksign')),
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_contracts_deal ON public.contracts (deal_id);
CREATE INDEX idx_contracts_status ON public.contracts (status);

CREATE TRIGGER set_updated_at_deals BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_updated_at_proposals BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_deal_stage_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_is_won boolean; v_is_lost boolean;
BEGIN
  IF NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
    SELECT is_won, is_lost INTO v_is_won, v_is_lost FROM public.deal_stages WHERE id = NEW.stage_id;
    NEW.stage_changed_at := now();
    IF v_is_won OR v_is_lost THEN NEW.closed_at := now(); ELSE NEW.closed_at := NULL; END IF;
    INSERT INTO public.deal_stage_history (deal_id, from_stage_id, to_stage_id, changed_by)
    VALUES (NEW.id, OLD.stage_id, NEW.stage_id, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER deal_stage_change BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.tg_deal_stage_change();

CREATE OR REPLACE FUNCTION public.tg_snapshot_price()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.service_id IS NOT NULL THEN
    INSERT INTO public.service_price_history (service_id, price, source, reference_id)
    VALUES (NEW.service_id, NEW.unit_price, 'proposal', NEW.proposal_id);
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER snapshot_price AFTER INSERT ON public.proposal_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_snapshot_price();

CREATE OR REPLACE FUNCTION public.tg_fill_proposal_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN IF NEW.number IS NULL OR NEW.number = '' THEN NEW.number := public.next_proposal_number(); END IF; RETURN NEW; END; $$;
CREATE TRIGGER fill_proposal_number BEFORE INSERT ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.tg_fill_proposal_number();

CREATE OR REPLACE FUNCTION public.tg_fill_contract_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN IF NEW.number IS NULL OR NEW.number = '' THEN NEW.number := public.next_contract_number(); END IF; RETURN NEW; END; $$;
CREATE TRIGGER fill_contract_number BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.tg_fill_contract_number();

CREATE OR REPLACE VIEW public.v_pipeline_kpis AS
WITH stages AS (
  SELECT d.id, ds.slug, ds.is_won, ds.is_lost, d.expected_value
  FROM public.deals d JOIN public.deal_stages ds ON ds.id = d.stage_id
),
agg AS (
  SELECT
    COUNT(*) FILTER (WHERE NOT is_won AND NOT is_lost) AS active_deals,
    COUNT(*) FILTER (WHERE slug IN ('primeiro','diagnostico','proposta')) AS in_negotiation,
    COUNT(*) FILTER (WHERE is_won) AS won_deals,
    COUNT(*) FILTER (WHERE is_lost) AS lost_deals,
    AVG(expected_value) FILTER (WHERE is_won AND expected_value IS NOT NULL) AS avg_ticket
  FROM stages
)
SELECT active_deals, in_negotiation, won_deals, lost_deals,
  CASE WHEN (won_deals + lost_deals) > 0
    THEN ROUND((won_deals::numeric / (won_deals + lost_deals)) * 100, 2)
    ELSE 0 END AS conversion_rate_pct,
  COALESCE(ROUND(avg_ticket, 2), 0) AS avg_ticket
FROM agg;

CREATE OR REPLACE VIEW public.v_service_pricing_monthly AS
SELECT s.id AS service_id, s.name AS service_name,
  date_trunc('month', sph.effective_from) AS month,
  AVG(sph.price) AS avg_price, MIN(sph.price) AS min_price, MAX(sph.price) AS max_price,
  COUNT(*) AS sample_size
FROM public.service_price_history sph
JOIN public.services s ON s.id = sph.service_id
GROUP BY s.id, s.name, date_trunc('month', sph.effective_from);

ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_full_document_counters ON public.document_counters FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_full_lead_sources ON public.lead_sources FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY public_read_lead_sources ON public.lead_sources FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY admin_full_deal_stages ON public.deal_stages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY auth_read_deal_stages ON public.deal_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_full_services ON public.services FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY public_read_services ON public.services FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY admin_full_service_price_history ON public.service_price_history FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_full_leads ON public.leads FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_full_deals ON public.deals FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_full_deal_stage_history ON public.deal_stage_history FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_full_deal_activities ON public.deal_activities FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_full_proposals ON public.proposals FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_full_proposal_items ON public.proposal_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_full_contracts ON public.contracts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY public_token_read_proposals ON public.proposals
  FOR SELECT TO anon, authenticated
  USING (public_token IS NOT NULL AND public_token = (current_setting('request.headers', true)::jsonb ->> 'x-proposal-token'));

CREATE POLICY public_token_read_proposal_items ON public.proposal_items
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.proposals p WHERE p.id = proposal_items.proposal_id
    AND p.public_token IS NOT NULL
    AND p.public_token = (current_setting('request.headers', true)::jsonb ->> 'x-proposal-token')));

-- =========== GRANTs (faltavam na migration original) ===========
GRANT SELECT ON public.lead_sources TO anon, authenticated;
GRANT SELECT ON public.deal_stages TO authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.proposals TO anon;
GRANT SELECT ON public.proposal_items TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_price_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_stage_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_counters TO authenticated;

GRANT ALL ON public.lead_sources, public.deal_stages, public.services,
  public.service_price_history, public.leads, public.deals,
  public.deal_stage_history, public.deal_activities, public.proposals,
  public.proposal_items, public.contracts, public.document_counters TO service_role;

GRANT SELECT ON public.v_pipeline_kpis, public.v_service_pricing_monthly TO authenticated, service_role;

-- =========== rate_limit_hits ===========
CREATE TABLE public.rate_limit_hits (
  id bigserial PRIMARY KEY,
  ip text NOT NULL,
  bucket text NOT NULL,
  hit_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rlh_ip_bucket_hit ON public.rate_limit_hits (ip, bucket, hit_at DESC);
ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.rate_limit_hits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.rate_limit_hits_id_seq TO service_role;

COMMIT;
