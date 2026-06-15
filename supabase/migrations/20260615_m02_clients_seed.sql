-- M02 · Seed dos clientes reais da Claudia Lima
-- Adiciona coluna segment em clients (usada pelo classify-batch para contextualizar o prompt do Haiku)
-- e insere os 5 clientes ativos

BEGIN;

-- Adiciona coluna segment se não existir
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS segment TEXT;

-- Insere clientes reais apenas se ainda não existirem (verificação por name)
INSERT INTO public.clients (name, owner_name, segment, status)
SELECT name, owner_name, segment, status
FROM (VALUES
  ('Araujo Branco',       'Araujo Branco Sociedade de Advogados',       'Advocacia e Consultoria Jurídica',          'active'),
  ('Deguste',             'J E de Moura Gomes',                         'Padaria, Confeitaria e Lanchonete',         'active'),
  ('Dotto & Naitzke',     'Dotto & Naitzke Serviços Médicos Ltda.',     'Clínica Médica e Cirúrgica',                'active'),
  ('Penatti Auto Peças',  'Penatti Auto Peças de Veículos Ltda',        'Comércio de Peças e Acessórios Automotivos','active'),
  ('Perito das Passagens','Perito das Passagens Viagens e Turismo Ltda','Agência de Viagens e Turismo',              'active')
) AS v(name, owner_name, segment, status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.clients c WHERE c.name = v.name
);

-- Atualiza segment dos clientes que já existiam (caso tenha sido criado sem segment)
UPDATE public.clients SET segment = 'Advocacia e Consultoria Jurídica'          WHERE name = 'Araujo Branco'        AND (segment IS NULL OR segment = '');
UPDATE public.clients SET segment = 'Padaria, Confeitaria e Lanchonete'         WHERE name = 'Deguste'              AND (segment IS NULL OR segment = '');
UPDATE public.clients SET segment = 'Clínica Médica e Cirúrgica'                WHERE name = 'Dotto & Naitzke'      AND (segment IS NULL OR segment = '');
UPDATE public.clients SET segment = 'Comércio de Peças e Acessórios Automotivos'WHERE name = 'Penatti Auto Peças'   AND (segment IS NULL OR segment = '');
UPDATE public.clients SET segment = 'Agência de Viagens e Turismo'              WHERE name = 'Perito das Passagens' AND (segment IS NULL OR segment = '');

COMMIT;
