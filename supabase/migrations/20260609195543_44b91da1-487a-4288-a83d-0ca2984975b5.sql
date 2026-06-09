
ALTER VIEW public.v_pipeline_kpis SET (security_invoker = on);
ALTER VIEW public.v_service_pricing_monthly SET (security_invoker = on);

-- Garante search_path explícito na função legada que ainda aparecia no linter
CREATE OR REPLACE FUNCTION public.tg_profiles_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;
