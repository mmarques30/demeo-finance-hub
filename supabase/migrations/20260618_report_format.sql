-- Adiciona coluna report_format em report_exports
ALTER TABLE public.report_exports
  ADD COLUMN IF NOT EXISTS report_format text DEFAULT 'DFC + DRE (Completo)';
