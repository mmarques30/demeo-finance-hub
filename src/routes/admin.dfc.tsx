import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl, monthOptions, monthRangeDates } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useDFCForecast } from "@/hooks/useDFCForecast";

export const Route = createFileRoute("/admin/dfc")({
  validateSearch: (search: Record<string, unknown>) => ({
    clientId: typeof search.clientId === "string" ? search.clientId : undefined,
  }),
  component: DFCPage,
  head: () => ({ meta: [{ title: "DFC · Aurora" }] }),
});

interface ClientOption { id: string; name: string; }
interface Tx { id: string; date: string; description: string; amount: number; category: string | null; is_recurring: boolean; }

function prevPeriod(mmyyyy: string): string {
  const [mm, yyyy] = mmyyyy.split("/").map(Number);
  const d = new Date(yyyy, mm - 2, 1);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function deltaPct(curr: number, prev: number): string | null {
  if (prev === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  return (pct >= 0 ? "▲ +" : "▼ ") + pct.toFixed(1) + "%";
}

const PERIODS = monthOptions(12);

function DFCPage() {
  const { clientId: preselectedId } = Route.useSearch();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState(preselectedId ?? "");
  const [period, setPeriod] = useState(PERIODS[0]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [prevTx, setPrevTx] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrega lista de clientes; valida preselectedId e usa fallback se inválido
  useEffect(() => {
    supabase().from("clients").select("id, name").order("name").then(({ data }) => {
      if (data && data.length > 0) {
        setClients(data as ClientOption[]);
        const exists = preselectedId && data.some((c: ClientOption) => c.id === preselectedId);
        if (!exists) setClientId(data[0].id);
      }
    });
  }, [preselectedId]);

  // Recarrega transações do período atual e anterior em paralelo
  useEffect(() => {
    if (!clientId) return;
    const { start, end } = monthRangeDates(period);
    const prev = prevPeriod(period);
    const { start: pStart, end: pEnd } = monthRangeDates(prev);
    setLoading(true);
    Promise.all([
      supabase()
        .from("transactions")
        .select("id, date, description, amount, category, is_recurring")
        .eq("client_id", clientId)
        .eq("status", "approved")
        .gte("date", start)
        .lte("date", end)
        .order("date"),
      supabase()
        .from("transactions")
        .select("id, date, description, amount, category, is_recurring")
        .eq("client_id", clientId)
        .eq("status", "approved")
        .gte("date", pStart)
        .lte("date", pEnd),
    ]).then(([{ data: curr }, { data: prev }]) => {
      setTx((curr ?? []) as Tx[]);
      setPrevTx((prev ?? []) as Tx[]);
      setLoading(false);
    });
  }, [clientId, period]);

  const receitas = useMemo(() => tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0), [tx]);
  const despesas = useMemo(() => tx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0), [tx]);
  const resultado = receitas - despesas;

  const prevReceitas = useMemo(() => prevTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0), [prevTx]);
  const prevDespesas = useMemo(() => prevTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0), [prevTx]);

  const fixos = useMemo(() => tx.filter((t) => t.is_recurring && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0), [tx]);
  const variaveis = useMemo(() => tx.filter((t) => !t.is_recurring && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0), [tx]);

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    tx.forEach((t) => {
      const k = t.category || "Sem categoria";
      map.set(k, (map.get(k) ?? 0) + Math.abs(t.amount));
    });
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(map.entries())
      .map(([cat, val]) => ({ cat, val, pct: (val / total) * 100 }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 8);
  }, [tx]);

  const semanas = useMemo(() => {
    const w = [
      { lbl: "Sem 1", rec: 0, des: 0 },
      { lbl: "Sem 2", rec: 0, des: 0 },
      { lbl: "Sem 3", rec: 0, des: 0 },
      { lbl: "Sem 4", rec: 0, des: 0 },
    ];
    tx.forEach((t) => {
      const day = parseInt(t.date.split("-")[2], 10);
      const idx = Math.min(3, Math.floor((day - 1) / 7));
      if (t.amount >= 0) w[idx].rec += t.amount;
      else w[idx].des += Math.abs(t.amount);
    });
    return w;
  }, [tx]);
  const maxBar = Math.max(...semanas.map((s) => Math.max(s.rec, s.des)), 1);

  const projecao = useDFCForecast(clientId, period);
  const clienteName = clients.find((c) => c.id === clientId)?.name ?? "Cliente";

  return (
    <AdminLayout>
      <PageHeader
        cap={`DFC · ${clienteName}`}
        title="Demonstrativo"
        emphasis="de fluxo de caixa"
        description="Análise consolidada do período com comparativo, drill-down por categoria e projeção dos próximos 3 meses."
        right={
          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="bg-white px-3 py-2.5 text-[12px]"
              style={{ border: "1px solid var(--line)" }}
            >
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white px-3 py-2.5 text-[12px]"
              style={{ border: "1px solid var(--line)" }}
            >
              {PERIODS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        }
      />

      <div className="px-8 lg:px-12 pb-12 grid gap-8">
        {loading && (
          <div className="aurora-card flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--green)", borderTopColor: "transparent" }} />
            <span className="text-[12px]">Carregando transações...</span>
          </div>
        )}

        {/* Resumo */}
        <div className="grid md:grid-cols-4 gap-5">
          <Resumo label="Receitas" value={brl(receitas)} tone="green" delta={deltaPct(receitas, prevReceitas)} />
          <Resumo label="Despesas" value={brl(despesas)} tone="tan" delta={deltaPct(despesas, prevDespesas)} />
          <Resumo label="Resultado" value={brl(resultado)} tone={resultado >= 0 ? "green" : "tan"} />
          <Resumo label="Lançamentos" value={String(tx.length)} tone="navy" />
        </div>

        {/* Fixos vs Variáveis */}
        {despesas > 0 && (
          <div className="grid md:grid-cols-2 gap-5">
            <Resumo label="Despesas Fixas" value={brl(fixos)} tone="navy"
              sub={`${((fixos / despesas) * 100).toFixed(1)}% das despesas`} />
            <Resumo label="Despesas Variáveis" value={brl(variaveis)} tone="tan"
              sub={`${((variaveis / despesas) * 100).toFixed(1)}% das despesas`} />
          </div>
        )}

        {/* Fluxo semanal */}
        <div className="aurora-card">
          <div className="aurora-cap mb-1">Gráfico</div>
          <div className="aurora-serif text-[22px] mb-7">
            Fluxo semanal <em className="italic" style={{ color: "var(--green)" }}>· {period}</em>
          </div>
          {tx.length === 0 ? (
            <div className="text-[12px] text-center py-8" style={{ color: "var(--muted-foreground)" }}>
              Nenhuma transação aprovada neste período.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-8 items-end h-[200px]">
                {semanas.map((s) => (
                  <div key={s.lbl} className="h-full flex flex-col justify-end gap-2">
                    <div className="flex gap-1.5 items-end h-full">
                      <div className="flex-1 transition-all" style={{ height: `${(s.rec / maxBar) * 100}%`, background: "var(--green)", borderRadius: "3px 3px 0 0" }} title={brl(s.rec)} />
                      <div className="flex-1 transition-all" style={{ height: `${(s.des / maxBar) * 100}%`, background: "var(--tan)", borderRadius: "3px 3px 0 0" }} title={brl(s.des)} />
                    </div>
                    <div className="text-[10px] uppercase text-center" style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)" }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-5 mt-5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                <span className="flex items-center gap-2"><span className="w-3 h-3 inline-block" style={{ background: "var(--green)" }} /> Receitas</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 inline-block" style={{ background: "var(--tan)" }} /> Despesas</span>
              </div>
            </>
          )}
        </div>

        {/* Por categoria */}
        {porCategoria.length > 0 && (
          <div className="aurora-card p-0 overflow-hidden">
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="aurora-cap mb-1">Detalhamento</div>
              <div className="aurora-serif text-[22px]">Por <em className="italic" style={{ color: "var(--green)" }}>categoria</em></div>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--linen)" }}>
                  {["Categoria", "Total", "% do total"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {porCategoria.map((row, i) => (
                  <tr key={row.cat} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderTop: "1px solid var(--line)" }}>
                    <td className="px-6 py-3 text-[12px]">{row.cat}</td>
                    <td className="px-6 py-3 aurora-serif" style={{ fontSize: 14, color: "var(--navy)" }}>{brl(row.val)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="text-[12px] w-12">{row.pct.toFixed(1)}%</div>
                        <div className="flex-1 h-1.5 max-w-[180px]" style={{ background: "var(--linen)" }}>
                          <div className="h-full" style={{ width: `${row.pct}%`, background: "var(--sage)" }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Projeção */}
        {tx.length > 0 && (
          <div className="aurora-card p-0 overflow-hidden">
            <div className="px-6 py-4 flex items-end justify-between gap-4 flex-wrap" style={{ borderBottom: "1px solid var(--line)" }}>
              <div>
                <div className="aurora-cap mb-1">Próximos 90 dias</div>
                <div className="aurora-serif text-[22px]">
                  Projeção <em className="italic" style={{ color: "var(--green)" }}>de fluxo de caixa</em>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 inline-block rounded-sm" style={{ background: "var(--green)", opacity: 0.4 }} />
                  Tendência histórica
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 inline-block rounded-sm" style={{ background: "var(--green)" }} />
                  Confirmado (contas)
                </span>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--linen)" }}>
                  {["Mês", "Receitas previstas", "Despesas previstas", "Resultado previsto"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projecao.map((p, i) => {
                  const r = p.rec - p.des;
                  const hasConfirmed = p.confirmedRec > 0 || p.confirmedDes > 0;
                  return (
                    <tr key={p.mes} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderTop: "1px solid var(--line)" }}>
                      <td className="px-6 py-3 text-[13px]" style={{ fontWeight: 500 }}>
                        {p.mes}
                        {hasConfirmed && (
                          <div className="text-[10px] mt-0.5" style={{ color: "var(--green)", letterSpacing: "0.5px" }}>
                            com contas confirmadas
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 aurora-serif" style={{ fontSize: 14, color: "var(--green)" }}>
                        {brl(p.rec)}
                        {p.confirmedRec > 0 && (
                          <div className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "inherit", fontWeight: 400 }}>
                            {brl(p.confirmedRec)} confirmado
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 aurora-serif" style={{ fontSize: 14, color: "var(--tan)" }}>
                        {brl(p.des)}
                        {p.confirmedDes > 0 && (
                          <div className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "inherit", fontWeight: 400 }}>
                            {brl(p.confirmedDes)} confirmado
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 aurora-serif" style={{ fontSize: 16, color: r >= 0 ? "var(--green)" : "var(--tan)" }}>
                        {brl(r)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Resumo({
  label,
  value,
  tone,
  delta,
  sub,
}: {
  label: string;
  value: string;
  tone: "green" | "tan" | "navy";
  delta?: string | null;
  sub?: string;
}) {
  const color = tone === "green" ? "var(--green)" : tone === "tan" ? "var(--tan)" : "var(--navy)";
  const deltaColor = delta?.startsWith("▲") ? "var(--green)" : "var(--tan)";
  return (
    <div className="aurora-card">
      <div className="aurora-cap mb-3">{label}</div>
      <div className="aurora-serif" style={{ fontSize: 30, color, lineHeight: 1, letterSpacing: "-1px" }}>{value}</div>
      {delta && (
        <div className="text-[11px] mt-2" style={{ color: deltaColor }}>
          {delta} vs mês anterior
        </div>
      )}
      {sub && (
        <div className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
