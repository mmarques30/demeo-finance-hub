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

interface RecurrencePattern {
  modal_category: string;
  occurrences: number;
}

interface InstallmentGroup {
  amount: number;
  installment_number: number;
  installment_total: number;
  date: string;
}

export function useDFCForecast(clientId: string, currentPeriod: string): ForecastMonth[] {
  const [mm, yyyy] = currentPeriod.split("/").map(Number);

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

  // Recorrências com >= 3 ocorrências: âncoras de custo fixo
  const { data: recurrences = [] } = useQuery<RecurrencePattern[]>({
    queryKey: ["dfc-recurrences", clientId],
    enabled: !!clientId,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await supabase()
        .from("recurrence_patterns")
        .select("modal_category, occurrences")
        .eq("client_id", clientId)
        .gte("occurrences", 3);
      return (data ?? []) as RecurrencePattern[];
    },
  });

  // Parcelamentos aprovados — filtramos no JS as que ainda têm parcelas restantes
  const { data: installments = [] } = useQuery<InstallmentGroup[]>({
    queryKey: ["dfc-installments", clientId],
    enabled: !!clientId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase()
        .from("transactions")
        .select("amount, installment_number, installment_total, date")
        .eq("client_id", clientId)
        .eq("status", "approved")
        .not("installment_group_id", "is", null);
      const rows = (data ?? []) as InstallmentGroup[];
      return rows.filter((r) => r.installment_number < r.installment_total);
    },
  });

  return useMemo(() => {
    // 1. Projeção base por tendência histórica
    const monthMap = new Map<string, { rec: number; des: number }>();
    for (const tx of txs) {
      const key = tx.date.slice(0, 7);
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

    // 2. Âncora de recorrências: se há padrões sólidos (>= 3 ocorrências),
    //    eles sustentam o piso de despesas e reduzem a dependência do slope.
    const recurrenceAnchor = recurrences.length > 0 ? recurrences.length * 50 : 0;

    // 3. Parcelas futuras por mês de projeção
    const installmentsByOffset: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    for (const inst of installments) {
      const instDate = new Date(inst.date);
      const remaining = inst.installment_total - inst.installment_number;
      for (let i = 1; i <= Math.min(remaining, 3); i++) {
        const projDate = new Date(yyyy, mm - 1 + i, 1);
        const sameMonthOrAfter = projDate >= new Date(instDate.getFullYear(), instDate.getMonth() + 1, 1);
        if (sameMonthOrAfter && i <= 3) {
          installmentsByOffset[i] = (installmentsByOffset[i] ?? 0) + Math.abs(inst.amount);
        }
      }
    }

    return [1, 2, 3].map((offset) => {
      const d = new Date(yyyy, mm - 1 + offset, 1);
      const mes = d.toLocaleDateString("pt-BR", { month: "long" });
      const baseRec = last.rec * (1 + growthRec * offset);
      const baseDes = Math.max(
        last.des * (1 + growthDes * offset),
        last.des * 0.85 + recurrenceAnchor
      );
      return {
        mes,
        rec: baseRec,
        des: baseDes + (installmentsByOffset[offset] ?? 0),
      };
    });
  }, [txs, recurrences, installments, yyyy, mm]);
}
