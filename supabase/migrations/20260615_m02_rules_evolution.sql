-- M02 · Evolução de classification_rules + feedback loop seguro
-- Adiciona: hits, last_used, source, is_active
-- Trigger tg_learn_from_approval: ativa regra somente após hits >= 2 (evita propagar erro)
-- Limite de 500 regras ativas por cliente

BEGIN;

-- Depende de: 20260615_m02_functions.sql (normalize_description, build_pattern)

ALTER TABLE public.classification_rules
  ADD COLUMN IF NOT EXISTS hits      INTEGER     NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_used TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS source    TEXT        NOT NULL DEFAULT 'manual'
                                     CHECK (source IN ('manual', 'approval', 'ai', 'import')),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN     NOT NULL DEFAULT false;

-- Regras existentes criadas manualmente → ativas imediatamente
UPDATE public.classification_rules
  SET is_active = true
WHERE source = 'manual';

-- Índice para busca de regras ativas por cliente (Camada 1 do classify-batch)
CREATE INDEX IF NOT EXISTS idx_rules_client_active
  ON public.classification_rules(client_id, is_active)
  WHERE is_active = true;

-- Expiração de regras ociosas: desativa aprovações antigas com poucos hits
-- Chamada pelo cron semanal (Fase 2)
CREATE OR REPLACE FUNCTION public.expire_stale_rules()
RETURNS void LANGUAGE sql AS $$
  UPDATE public.classification_rules
  SET is_active = false
  WHERE is_active = true
    AND source = 'approval'
    AND hits < 3
    AND last_used < now() - INTERVAL '180 days';
$$;

-- Trigger de aprendizado seguro
-- Regras criadas por aprovação ficam inativas (is_active=false) até hits >= 2
-- Proteção: padrão muito curto (<3 chars) é ignorado
-- Proteção: limite de 500 regras ativas por cliente
-- Critério de desempate: padrão mais longo ganha (ORDER BY LENGTH(pattern) DESC no classify-batch)

CREATE OR REPLACE FUNCTION public.tg_learn_from_approval()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_pattern TEXT;
  v_count   INTEGER;
BEGIN
  -- Só aprende quando status muda para approved
  IF NEW.status <> 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  -- Precisa de categoria válida
  IF NEW.category IS NULL OR TRIM(NEW.category) = '' THEN
    RETURN NEW;
  END IF;

  -- Gera padrão normalizado
  v_pattern := public.build_pattern(NEW.description);
  IF v_pattern IS NULL OR LENGTH(v_pattern) < 3 THEN
    RETURN NEW;
  END IF;

  -- Verifica limite de regras ativas por cliente
  SELECT COUNT(*) INTO v_count
    FROM public.classification_rules
   WHERE client_id = NEW.client_id AND is_active = true;

  IF v_count >= 500 THEN
    RETURN NEW;
  END IF;

  -- Insere ou atualiza regra
  -- is_active só vira true quando hits atingir 2 (segunda aprovação confirma)
  INSERT INTO public.classification_rules
    (client_id, pattern, category, is_recurring, hits, source, is_active, last_used)
  VALUES
    (NEW.client_id, v_pattern, NEW.category, COALESCE(NEW.is_recurring, false),
     1, 'approval', false, now())
  ON CONFLICT (client_id, pattern) DO UPDATE
    SET hits      = classification_rules.hits + 1,
        category  = EXCLUDED.category,
        last_used = now(),
        is_active = CASE
                      WHEN classification_rules.hits + 1 >= 2 THEN true
                      ELSE classification_rules.is_active
                    END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER learn_from_approval
AFTER UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_learn_from_approval();

COMMIT;
