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

interface HistTx {
  date: string;
  amount: number;
  is_recurring: boolean;
}

interface InstallmentRow {
  amount: number;
  installment_number: number;
  installment_total: number;
  date: string;
  installment_group_id: string;
}

// Função pura exportada para que admin.relatorios.tsx use a mesma lógica sem duplicação.
export function computeForecastMonths(
  txs: HistTx[],
  installments: Omit<InstallmentRow, "installment_group_id">[],
  mm: number,
  yyyy: number
): ForecastMonth[] {
  // 1. Tendência histórica por mês
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

  // 2. Âncora de custo fixo: média mensal real das despesas recorrentes no histórico.
  //    Substitui o proxy "count * R$50" pelo valor efetivo das transações is_recurring.
  const monthlyFixedMap = new Map<string, number>();
  for (const tx of txs) {
    if (tx.is_recurring && tx.amount < 0) {
      const key = tx.date.slice(0, 7);
      monthlyFixedMap.set(key, (monthlyFixedMap.get(key) ?? 0) + Math.abs(tx.amount));
    }
  }
  const fixedValues = Array.from(monthlyFixedMap.values());
  const recurrenceAnchor =
    fixedValues.length > 0 ? fixedValues.reduce((a, b) => a + b, 0) / fixedValues.length : 0;

  // 3. Parcelas futuras: cada grupo contribui com 1 parcela por mês (sem duplicação).
  const installmentsByOffset: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  for (const inst of installments) {
    const instDate = new Date(inst.date);
    const remaining = inst.installment_total - inst.installment_number;
    for (let i = 1; i <= Math.min(remaining, 3); i++) {
      const projDate = new Date(yyyy, mm - 1 + i, 1);
      const afterInstallmentMonth = projDate >= new Date(instDate.getFullYear(), instDate.getMonth() + 1, 1);
      if (afterInstallmentMonth) {
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
}

export function useDFCForecast(clientId: string, currentPeriod: string): ForecastMonth[] {
  const [mm, yyyy] = currentPeriod.split("/").map(Number);

  const histStart = new Date(yyyy, mm - 1 - 5, 1);
  const startDate = `${histStart.getFullYear()}-${String(histStart.getMonth() + 1).padStart(2, "0")}-01`;
  const endDate = `${yyyy}-${String(mm).padStart(2, "0")}-31`;

  const { data: txs = [] } = useQuery<HistTx[]>({
    queryKey: ["dfc-forecast-history", clientId, currentPeriod],
    enabled: !!clientId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase()
        .from("transactions")
        .select("date, amount, is_recurring")
        .eq("client_id", clientId)
        .eq("status", "approved")
        .gte("date", startDate)
        .lte("date", endDate);
      return (data ?? []) as HistTx[];
    },
  });

  // Deduplica por installment_group_id mantendo apenas a parcela mais recente de cada grupo.
  // Isso evita contagem múltipla quando várias parcelas do mesmo grupo estão no banco.
  const { data: installments = [] } = useQuery<Omit<InstallmentRow, "installment_group_id">[]>({
    queryKey: ["dfc-installments", clientId],
    enabled: !!clientId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase()
        .from("transactions")
        .select("amount, installment_number, installment_total, date, installment_group_id")
        .eq("client_id", clientId)
        .eq("status", "approved")
        .not("installment_group_id", "is", null);
      const rows = (data ?? []) as InstallmentRow[];

      const groupMap = new Map<string, InstallmentRow>();
      for (const row of rows) {
        const cur = groupMap.get(row.installment_group_id);
        if (!cur || row.installment_number > cur.installment_number) {
          groupMap.set(row.installment_group_id, row);
        }
      }
      return Array.from(groupMap.values()).filter((r) => r.installment_number < r.installment_total);
    },
  });

  return useMemo(
    () => computeForecastMonths(txs, installments, mm, yyyy),
    [txs, installments, mm, yyyy]
  );
}
