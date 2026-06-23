-- Receitas Brutas por cliente/período (regime de competência)
create table if not exists public.monthly_revenue_entries (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id) on delete cascade,
  period         text not null,
  entry_date     date not null,
  invoice_ref    text not null default '',
  sales_channel  text not null default '',
  gross_amount   numeric(15,2) not null default 0,
  taxes_withheld numeric(15,2) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Checklist e status de conclusão do fechamento mensal
create table if not exists public.monthly_closings (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  period       text not null,
  step1_done   boolean not null default false,
  step2_done   boolean not null default false,
  step3_done   boolean not null default false,
  step4_done   boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(client_id, period)
);
