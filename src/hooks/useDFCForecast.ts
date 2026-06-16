import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/lib/supabase";

export interface ForecastMonth {
  mes: string;
  rec: number;
  des: number;
}

function clampGrowth(rate: number) {
  return Math.max(-0.15, Math.min(0.20, rate));
}

// Retorna projeção de 3 meses baseada na tendência real dos últimos meses.
// Fallback para +3%/+2% quando o histórico é insuficiente.
export function useDFCForecast(clientId: string, currentPeriod: string): ForecastMonth[] {
  const [mm, yyyy] = currentPeriod.split("/").map(Number);

  // Busca 6 meses de histórico (incluindo período atual)
  const histStart = new Date(yyyy, mm - 1 - 5, 1);
  const startDate = `${histStart.getFullYear()}-${String(histStart.getMonth() + 1).padStart(2, "0")}-01`;
  const endDate = `${yyyy}-${String(mm).padStart(2, "0")}-31`;

  const { data: txs = [] } = useQuery<{ date: string; amount: number }[]>({
    queryKey: ["dfc-forecast-history", clientId, currentPeriod],
    enabled: !!clientId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase()
        .from("transactions")
        .select("date, amount")
        .eq("client_id", clientId)
        .eq("status", "approved")
        .gte("date", startDate)
        .lte("date", endDate);
      return (data ?? []) as { date: string; amount: number }[];
    },
  });

  return useMemo(() => {
    // Agrupa por mês
    const monthMap = new Map<string, { rec: number; des: number }>();
    for (const tx of txs) {
      const key = tx.date.slice(0, 7); // YYYY-MM
      if (!monthMap.has(key)) monthMap.set(key, { rec: 0, des: 0 });
      const m = monthMap.get(key)!;
      if (tx.amount > 0) m.rec += tx.amount;
      else m.des += Math.abs(tx.amount);
    }

    const months = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const last = months.at(-1)?.[1] ?? { rec: 0, des: 0 };

    let growthRec = 0.03;
    let growthDes = 0.02;

    if (months.length >= 3) {
      const first = months[0][1];
      const n = months.length;
      if (first.rec > 0) growthRec = clampGrowth((last.rec - first.rec) / first.rec / n);
      if (first.des > 0) growthDes = clampGrowth((last.des - first.des) / first.des / n);
    }

    return [1, 2, 3].map((offset) => {
      const d = new Date(yyyy, mm - 1 + offset, 1);
      const mes = d.toLocaleDateString("pt-BR", { month: "long" });
      return {
        mes,
        rec: last.rec * (1 + growthRec * offset),
        des: last.des * (1 + growthDes * offset),
      };
    });
  }, [txs, yyyy, mm]);
}
