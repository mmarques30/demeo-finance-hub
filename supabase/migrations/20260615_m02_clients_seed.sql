-- M02 · Seed dos clientes reais da Claudia Lima
-- Adiciona coluna segment em clients (usada pelo classify-batch para contextualizar o prompt do Haiku)
-- e insere os 5 clientes ativos

BEGIN;

-- Adiciona coluna segment se não existir
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS segment TEXT;

-- Insere clientes reais (ON CONFLICT evita duplicata se já existir pelo nome)
INSERT INTO public.clients (name, owner_name, segment, status)
VALUES
  (
    'Araujo Branco',
    'Araujo Branco Sociedade de Advogados',
    'Advocacia e Consultoria Jurídica',
    'active'
  ),
  (
    'Deguste',
    'J E de Moura Gomes',
    'Padaria, Confeitaria e Lanchonete',
    'active'
  ),
  (
    'Dotto & Naitzke',
    'Dotto & Naitzke Serviços Médicos Ltda.',
    'Clínica Médica e Cirúrgica',
    'active'
  ),
  (
    'Penatti Auto Peças',
    'Penatti Auto Peças de Veículos Ltda',
    'Comércio de Peças e Acessórios Automotivos',
    'active'
  ),
  (
    'Perito das Passagens',
    'Perito das Passagens Viagens e Turismo Ltda',
    'Agência de Viagens e Turismo',
    'active'
  )
ON CONFLICT (name) DO UPDATE
  SET segment    = EXCLUDED.segment,
      owner_name = EXCLUDED.owner_name;

COMMIT;
