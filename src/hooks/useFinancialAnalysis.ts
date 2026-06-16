import { useQuery } from "@tanstack/react-query";
import { authHeaders } from "@/lib/auth";
import { FUNCTIONS_URL } from "@/lib/supabase";

export interface TopExpense {
  category: string;
  amount: number;
  pct_total: number;
}

export interface ForecastMonth {
  month: string;
  rec: number;
  des: number;
}

export interface FinancialAnalysis {
  health_score: number;
  insights: string[];
  top_expenses: TopExpense[];
  projection: ForecastMonth[];
  alerts: string[];
}

export function useFinancialAnalysis(
  clientId: string,
  periodStart: string,
  periodEnd: string,
) {
  return useQuery<FinancialAnalysis | null>({
    queryKey: ["financial-analysis", clientId, periodStart, periodEnd],
    enabled: !!(clientId && periodStart && periodEnd),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const headers = await authHeaders();
      const res = await fetch(`${FUNCTIONS_URL}/analyze-client`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          period_start: periodStart,
          period_end: periodEnd,
        }),
      });
      if (!res.ok) return null;
      return res.json() as Promise<FinancialAnalysis>;
    },
  });
}
