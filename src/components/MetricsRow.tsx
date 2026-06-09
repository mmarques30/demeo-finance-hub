import { useQuery } from "@tanstack/react-query";
import { FUNCTIONS_URL } from "@/lib/supabase";
import { authHeaders } from "@/lib/auth";

type Kpis = {
  active_deals: number;
  in_negotiation: number;
  won_deals: number;
  lost_deals: number;
  conversion_rate_pct: number;
  avg_ticket: number;
};

const ZERO: Kpis = {
  active_deals: 0,
  in_negotiation: 0,
  won_deals: 0,
  lost_deals: 0,
  conversion_rate_pct: 0,
  avg_ticket: 0,
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

export function usePipelineKpis() {
  return useQuery({
    queryKey: ["kpis", "pipeline"],
    queryFn: async (): Promise<Kpis> => {
      try {
        const headers = await authHeaders();
        const res = await fetch(`${FUNCTIONS_URL}/pipeline-kpis`, { headers });
        if (!res.ok) return ZERO;
        return await res.json();
      } catch {
        return ZERO;
      }
    },
    staleTime: 60_000,
  });
}

export function MetricsRow() {
  const { data: k = ZERO } = usePipelineKpis();
  return (
    <div className="grid md:grid-cols-4 gap-5">
      <Metric label="Leads ativos" value={String(k.active_deals)} tone="green" />
      <Metric label="Em negociação" value={String(k.in_negotiation)} tone="navy" />
      <Metric label="Taxa de conversão" value={`${k.conversion_rate_pct}%`} tone="green" />
      <Metric label="Ticket médio" value={brl(k.avg_ticket)} tone="tan" />
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "green" | "tan" | "navy" }) {
  const color = tone === "green" ? "var(--green)" : tone === "tan" ? "var(--tan)" : "var(--navy)";
  return (
    <div className="aurora-card">
      <div className="aurora-cap mb-3">{label}</div>
      <div className="aurora-serif" style={{ fontSize: 30, color, lineHeight: 1, letterSpacing: "-1px" }}>
        {value}
      </div>
    </div>
  );
}
