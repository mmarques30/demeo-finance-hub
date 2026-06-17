-- M07 · Limpeza — remove coluna hit_count órfã de classification_rules
-- migration 0001 criou hit_count, migration m02 adicionou hits (usada pelo código).
-- hit_count nunca foi lida ou escrita após m02. DROP seguro.
-- APLICAR VIA SQL EDITOR DO LOVABLE CLOUD

ALTER TABLE public.classification_rules
  DROP COLUMN IF EXISTS hit_count;
