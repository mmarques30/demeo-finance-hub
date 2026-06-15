-- M02 · Funções base reutilizáveis para o motor de classificação
-- normalize_description: remove números, datas e ruído de extratos bancários
-- build_pattern: gera padrão de 3 tokens para uso em classification_rules

BEGIN;

CREATE OR REPLACE FUNCTION public.normalize_description(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          UPPER(raw),
          '[0-9]{2}/[0-9]{2}(/[0-9]{2,4})?', '', 'g'
        ),
        '\m[0-9]+\M', '', 'g'
      ),
      '\s{2,}', ' ', 'g'
    )
  )
$$;

-- Exemplos:
-- normalize_description('PIX 123456 ALUGUEL 01/06') → 'PIX ALUGUEL'
-- normalize_description('TED 78901 FORNECEDOR SILVA') → 'TED FORNECEDOR SILVA'

CREATE OR REPLACE FUNCTION public.build_pattern(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT TRIM(
    CONCAT_WS(' ',
      NULLIF(SPLIT_PART(public.normalize_description(raw), ' ', 1), ''),
      NULLIF(SPLIT_PART(public.normalize_description(raw), ' ', 2), ''),
      NULLIF(SPLIT_PART(public.normalize_description(raw), ' ', 3), '')
    )
  )
$$;

-- Exemplos:
-- build_pattern('PIX 123456 ALUGUEL PONTO 01/06') → 'PIX ALUGUEL PONTO'
-- build_pattern('PIX 789012 ALUGUEL PONTO 15/06') → 'PIX ALUGUEL PONTO' (mesmo padrão)

COMMIT;
