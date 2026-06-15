-- M02 · Tabela de categorias customizáveis por cliente
-- Substitui o array CATEGORIAS hardcoded no frontend e no classify-batch
-- Seed automático para todos os clientes existentes + trigger para novos clientes

BEGIN;

CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID    NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  group_name TEXT    NOT NULL,
  type       TEXT    NOT NULL CHECK (type IN ('receita', 'despesa', 'transferencia')),
  color      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, name)
);

-- RLS: somente admin gerencia categorias
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_categories_client_active
  ON public.categories(client_id, is_active)
  WHERE is_active = true;

-- Seed das categorias padrão para todos os clientes existentes
INSERT INTO public.categories (client_id, name, group_name, type, sort_order)
SELECT c.id, cat.name, cat.group_name, cat.type, cat.ord
FROM public.clients c
CROSS JOIN (VALUES
  ('Receita · Vendas',              'Receita',         'receita',        1),
  ('Receita · Serviços',            'Receita',         'receita',        2),
  ('Receita · Convênios',           'Receita',         'receita',        3),
  ('Receita · Honorários',          'Receita',         'receita',        4),
  ('Receita · Delivery',            'Receita',         'receita',        5),
  ('Despesa Fixa · Aluguel',        'Despesa Fixa',    'despesa',        6),
  ('Despesa Fixa · Salários',       'Despesa Fixa',    'despesa',        7),
  ('Despesa Fixa · Utilidades',     'Despesa Fixa',    'despesa',        8),
  ('Despesa Fixa · Contabilidade',  'Despesa Fixa',    'despesa',        9),
  ('Despesa Variável · Insumos',    'Despesa Variável','despesa',        10),
  ('Despesa Variável · Marketing',  'Despesa Variável','despesa',        11),
  ('Despesa Variável · Manutenção', 'Despesa Variável','despesa',        12),
  ('Investimento · Equipamentos',   'Investimento',    'despesa',        13),
  ('Investimento · Educação',       'Investimento',    'despesa',        14),
  ('Transferência',                 'Outros',          'transferencia',  15),
  ('Outros',                        'Outros',          'despesa',        16)
) AS cat(name, group_name, type, ord)
ON CONFLICT (client_id, name) DO NOTHING;

-- Trigger: todo novo cliente recebe as categorias padrão automaticamente
CREATE OR REPLACE FUNCTION public.tg_seed_categories_for_new_client()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.categories (client_id, name, group_name, type, sort_order) VALUES
    (NEW.id, 'Receita · Vendas',              'Receita',         'receita',       1),
    (NEW.id, 'Receita · Serviços',            'Receita',         'receita',       2),
    (NEW.id, 'Receita · Convênios',           'Receita',         'receita',       3),
    (NEW.id, 'Receita · Honorários',          'Receita',         'receita',       4),
    (NEW.id, 'Receita · Delivery',            'Receita',         'receita',       5),
    (NEW.id, 'Despesa Fixa · Aluguel',        'Despesa Fixa',    'despesa',       6),
    (NEW.id, 'Despesa Fixa · Salários',       'Despesa Fixa',    'despesa',       7),
    (NEW.id, 'Despesa Fixa · Utilidades',     'Despesa Fixa',    'despesa',       8),
    (NEW.id, 'Despesa Fixa · Contabilidade',  'Despesa Fixa',    'despesa',       9),
    (NEW.id, 'Despesa Variável · Insumos',    'Despesa Variável','despesa',       10),
    (NEW.id, 'Despesa Variável · Marketing',  'Despesa Variável','despesa',       11),
    (NEW.id, 'Despesa Variável · Manutenção', 'Despesa Variável','despesa',       12),
    (NEW.id, 'Investimento · Equipamentos',   'Investimento',    'despesa',       13),
    (NEW.id, 'Investimento · Educação',       'Investimento',    'despesa',       14),
    (NEW.id, 'Transferência',                 'Outros',          'transferencia', 15),
    (NEW.id, 'Outros',                        'Outros',          'despesa',       16)
  ON CONFLICT (client_id, name) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_categories_on_new_client
AFTER INSERT ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.tg_seed_categories_for_new_client();

COMMIT;
