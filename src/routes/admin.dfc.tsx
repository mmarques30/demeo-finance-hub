import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl } from "@/lib/utils";
import { todayISO, firstOfMonthISO } from "@/lib/dateUtils";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { supabase } from "@/lib/supabase";
import { useDFCForecast } from "@/hooks/useDFCForecast";
import { RecorrenciasPanel } from "@/components/RecorrenciasPanel";
import { ContasPanel } from "@/components/ContasPanel";
import { ExtratosPanel } from "@/components/ExtratosPanel";
import { computeDRE, DRE_EBITDA_PIVOT, type CatInfo } from "@/lib/dre";
import { computeHealthLevel, healthMargemPct } from "@/lib/healthScore";
import { HealthAlertCard } from "@/components/HealthAlertCard";
import { DetalhamentoPanel } from "@/components/DetalhamentoPanel";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/dfc")({
  validateSearch: (search: Record<string, unknown>) => ({
    clientId: typeof search.clientId === "string" ? search.clientId : undefined,
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: DFCPage,
  head: () => ({ meta: [{ title: "DFC · Aurora" }] }),
});

interface ClientOption { id: string; name: string; segment: string | null; monthly_closing_day: number | null; }
interface Tx { id: string; date: string; description: string; amount: number; category: string | null; is_recurring: boolean; }


function prevRange(s: string, e: string) {
  const sMs = new Date(s + "T12:00:00").getTime();
  const eMs = new Date(e + "T12:00:00").getTime();
  const dur = eMs - sMs;
  const pEndMs = sMs - 86400000;
  const pStartMs = pEndMs - dur;
  const fmt = (ms: number) => new Date(ms).toISOString().split("T")[0];
  return { pStart: fmt(pStartMs), pEnd: fmt(pEndMs) };
}

function deltaPct(curr: number, prev: number): string | null {
  if (prev === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  return (pct >= 0 ? "▲ +" : "▼ ") + pct.toFixed(1) + "%";
}

type DFCTab = "dfc" | "dre" | "recorrencias" | "contas" | "extratos" | "detalhamento";

const DFC_TABS: { key: DFCTab; label: string }[] = [
  { key: "dfc", label: "DFC" },
  { key: "dre", label: "DRE" },
  { key: "detalhamento", label: "Detalhamento" },
  { key: "contas", label: "Contas" },
  { key: "extratos", label: "Histórico de Extratos" },
  { key: "recorrencias", label: "Recorrências" },
];

const VALID_TABS: DFCTab[] = ["dfc", "dre", "recorrencias", "contas", "extratos", "detalhamento"];

function DFCPage() {
  const { clientId: preselectedId, tab: preselectedTab } = Route.useSearch();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState(preselectedId ?? "");
  const [startDate, setStartDate] = useState(firstOfMonthISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [activeTab, setActiveTab] = useState<DFCTab>(
    VALID_TABS.includes(preselectedTab as DFCTab) ? (preselectedTab as DFCTab) : "dfc"
  );
  const [tx, setTx] = useState<Tx[]>([]);
  const [prevTx, setPrevTx] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [contasTrigger, setContasTrigger] = useState(0);
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [catMap, setCatMap] = useState<Map<string, CatInfo>>(new Map());

  // Carrega lista de clientes; valida preselectedId e usa fallback se inválido
  useEffect(() => {
    supabase().from("clients").select("id, name, segment, monthly_closing_day").is("deleted_at", null).order("name").then(({ data }) => {
      if (data && data.length > 0) {
        setClients(data as ClientOption[]);
        const exists = preselectedId && data.some((c: ClientOption) => c.id === preselectedId);
        if (!exists) setClientId(data[0].id);
      }
    });
  }, [preselectedId]);

  // Carrega catMap de categorias para DRE
  useEffect(() => {
    if (!clientId) return;
    supabase()
      .from("categories")
      .select("name, group_name, type")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .then(({ data }) => {
        const map = new Map<string, CatInfo>();
        for (const cat of data ?? []) map.set(cat.name, { group_name: cat.group_name, type: cat.type });
        setCatMap(map);
      });
  }, [clientId]);

  // Carrega saldo acumulado antes do período (saldo inicial da DFC)
  useEffect(() => {
    if (!clientId || !startDate) return;
    supabase()
      .from("transactions")
      .select("amount")
      .eq("client_id", clientId)
      .eq("status", "approved")
      .lt("date", startDate)
      .then(({ data }) => {
        setSaldoInicial((data ?? []).reduce((s: number, t: { amount: number }) => s + t.amount, 0));
      });
  }, [clientId, startDate]);

  // Recarrega transações do período atual e anterior em paralelo
  useEffect(() => {
    if (!clientId) return;
    const { pStart, pEnd } = prevRange(startDate, endDate);
    setLoading(true);
    Promise.all([
      supabase()
        .from("transactions")
        .select("id, date, description, amount, category, is_recurring")
        .eq("client_id", clientId)
        .eq("status", "approved")
        .gte("date", startDate)
        .lte("date", endDate)
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
  }, [clientId, startDate, endDate]);

  const receitas = useMemo(() => tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0), [tx]);
  const despesas = useMemo(() => tx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0), [tx]);
  const resultado = receitas - despesas;
  const saldoFinal = saldoInicial + resultado;

  const prevReceitas = useMemo(() => prevTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0), [prevTx]);
  const prevDespesas = useMemo(() => prevTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0), [prevTx]);

  const dfcEntradas = useMemo(() => {
    const map = new Map<string, number>();
    tx.filter((t) => t.amount > 0).forEach((t) => {
      const cat = t.category || "Sem categoria";
      map.set(cat, (map.get(cat) ?? 0) + t.amount);
    });
    return Array.from(map.entries()).map(([cat, val]) => ({ cat, val })).sort((a, b) => b.val - a.val);
  }, [tx]);

  const dfcSaidas = useMemo(() => {
    const map = new Map<string, number>();
    tx.filter((t) => t.amount < 0).forEach((t) => {
      const cat = t.category || "Sem categoria";
      map.set(cat, (map.get(cat) ?? 0) + Math.abs(t.amount));
    });
    return Array.from(map.entries()).map(([cat, val]) => ({ cat, val })).sort((a, b) => b.val - a.val);
  }, [tx]);

  const dre = useMemo(() => computeDRE(tx, catMap), [tx, catMap]);

  const periodForForecast = `${endDate.split("-")[1]}/${endDate.split("-")[0]}`;
  const projecao = useDFCForecast(clientId, periodForForecast);
  const activeClient = clients.find((c) => c.id === clientId);
  const clienteName = activeClient?.name ?? "Cliente";
  const health = useMemo(
    () => computeHealthLevel(receitas, despesas, activeClient?.segment ?? null),
    [receitas, despesas, activeClient]
  );
  const margem = useMemo(() => healthMargemPct(receitas, despesas), [receitas, despesas]);
  const periodoLabel = startDate === endDate
    ? new Date(startDate + "T12:00:00").toLocaleDateString("pt-BR")
    : `${new Date(startDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${new Date(endDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <AdminLayout>
      <PageHeader
        cap={`DFC · ${clienteName}`}
        title="Demonstrativo"
        emphasis="de fluxo de caixa"
        description="Análise consolidada do período com comparativo, drill-down por categoria e projeção dos próximos 3 meses."
        right={
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="bg-white px-3 py-2.5 text-[12px]"
                style={{ border: "1px solid var(--line)" }}
              >
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                maxDate={todayISO()}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
              />
              {activeTab === "contas" && (
                <button
                  onClick={() => setContasTrigger((n) => n + 1)}
                  className="inline-flex items-center gap-2 px-5 py-3 text-[10px] uppercase transition-opacity hover:opacity-80"
                  style={{ background: "var(--green)", color: "#fff", letterSpacing: "2.5px", fontWeight: 500 }}
                >
                  + Novo
                </button>
              )}
            </div>
            {activeClient && (
              <div className="flex items-center gap-2 justify-end">
                <span className="aurora-cap">Fechamento mensal</span>
                {activeClient.monthly_closing_day != null ? (
                  <>
                    <div style={{ width: 28, height: 28, border: "1px solid var(--green)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(74,103,65,0.06)" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--green)", fontFamily: "serif" }}>
                        {activeClient.monthly_closing_day}
                      </span>
                    </div>
                    <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>de cada mês</span>
                  </>
                ) : (
                  <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Não configurado</span>
                )}
              </div>
            )}
          </div>
        }
      />

      {/* Tab bar */}
      <div className="flex gap-1 px-8 lg:px-12 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
        {DFC_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 text-[11px] uppercase transition-all"
            style={{
              letterSpacing: "2px",
              fontWeight: 600,
              borderRadius: "999px",
              background: activeTab === tab.key ? "var(--green)" : "transparent",
              color: activeTab === tab.key ? "#fff" : "var(--muted-foreground)",
              border: "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {clientId && (activeTab === "dfc" || activeTab === "dre") && (
        <div className="px-8 lg:px-12 pt-6">
          <HealthAlertCard health={health} margem={margem} segment={activeClient?.segment ?? null} period={periodoLabel} />
        </div>
      )}

      {activeTab === "recorrencias" && <RecorrenciasPanel clientId={clientId} />}
      {activeTab === "contas" && <ContasPanel clientId={clientId} openTrigger={contasTrigger} />}
      {activeTab === "extratos" && <ExtratosPanel clientId={clientId} startDate={startDate} endDate={endDate} />}
      {activeTab === "detalhamento" && (
        <DetalhamentoPanel clientId={clientId} startDate={startDate} endDate={endDate} />
      )}

      {activeTab === "dre" && (
        <div className="px-8 lg:px-12 pb-12 grid gap-8 pt-6">
          {/* Cards de resumo DRE */}
          <div className="grid md:grid-cols-4 gap-5">
            <Resumo label="Receita Bruta" value={brl(dre.receitaBruta)} tone="green" />
            <Resumo label="EBITDA" value={brl(dre.ebitda)} tone={dre.ebitda >= 0 ? "navy" : "expense"}
              sub={dre.receitaBruta > 0 ? `margem ${((dre.ebitda / dre.receitaBruta) * 100).toFixed(1)}%` : undefined} />
            <Resumo label="Resultado Líquido" value={brl(dre.resultadoLiquido)} tone={dre.resultadoLiquido >= 0 ? "green" : "expense"}
              sub={dre.receitaBruta > 0 ? `margem líquida ${((dre.resultadoLiquido / dre.receitaBruta) * 100).toFixed(1)}%` : undefined} />
            <Resumo label="Margem EBITDA" value={dre.receitaBruta > 0 ? `${((dre.ebitda / dre.receitaBruta) * 100).toFixed(1)}%` : "—"} tone="tan" />
          </div>

          {/* Tabela contábil */}
          {dre.groups.length === 0 ? (
            <div className="aurora-card text-[12px] text-center py-8" style={{ color: "var(--muted-foreground)" }}>
              Nenhuma transação aprovada neste período.
            </div>
          ) : (
            <div className="aurora-card p-0 overflow-hidden">
              <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
                <div className="aurora-cap mb-1">Estrutura contábil</div>
                <div className="aurora-serif text-[22px]">
                  DRE <em className="italic" style={{ color: "var(--green)" }}>· {periodoLabel}</em>
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--linen)" }}>
                    <th className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500 }}>Conta</th>
                    <th className="text-right px-6 py-3 aurora-cap" style={{ fontWeight: 500 }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {dre.groups.map((g) => (
                    <React.Fragment key={g.name}>
                      <tr style={{ background: "var(--linen)", borderTop: "1px solid var(--line)" }}>
                        <td className="px-6 py-2 aurora-cap" style={{ fontWeight: 600, fontSize: 10 }}>
                          {g.isExpense ? "(−) " : ""}{g.name.toUpperCase()}
                        </td>
                        <td />
                      </tr>
                      {g.lines.map((l) => (
                        <tr key={l.cat} style={{ borderTop: "1px solid var(--line)", background: "#fff" }}>
                          <td className="px-6 py-2.5 pl-10 text-[12px]">{l.cat}</td>
                          <td className="px-6 py-2.5 text-right aurora-value text-[13px]" style={{ color: g.isExpense ? "var(--expense)" : "var(--green)" }}>
                            {g.isExpense ? `(${brl(l.total)})` : brl(l.total)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: "1px solid var(--line)", background: "#FAFAF8" }}>
                        <td className="px-6 py-2.5 text-[12px]" style={{ fontWeight: 600 }}>Subtotal {g.name}</td>
                        <td className="px-6 py-2.5 text-right aurora-value text-[13px]" style={{ fontWeight: 700, color: g.isExpense ? "var(--expense)" : "var(--green)" }}>
                          {g.isExpense ? `(${brl(g.subtotal)})` : brl(g.subtotal)}
                        </td>
                      </tr>
                      {g.name === DRE_EBITDA_PIVOT && (
                        <tr style={{ background: "#E8F0E4", borderTop: "2px solid var(--green)" }}>
                          <td className="px-6 py-3 text-[13px]" style={{ fontWeight: 700 }}>= Resultado Operacional (EBITDA)</td>
                          <td className="px-6 py-3 text-right aurora-value text-[15px]" style={{ fontWeight: 700, color: dre.ebitda >= 0 ? "var(--green)" : "var(--expense)" }}>
                            {brl(dre.ebitda)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  <tr style={{ background: "var(--navy)", borderTop: "2px solid var(--navy)" }}>
                    <td className="px-6 py-3 text-[13px]" style={{ fontWeight: 700, color: "#fff" }}>= Resultado Líquido do Período</td>
                    <td className="px-6 py-3 text-right aurora-value text-[15px]" style={{ fontWeight: 700, color: dre.resultadoLiquido >= 0 ? "#A8D5A2" : "#F4A57E" }}>
                      {brl(dre.resultadoLiquido)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "dfc" && (
      <div className="px-8 lg:px-12 pb-12 pt-6 grid gap-8">

        {loading && (
          <div className="aurora-card flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--green)", borderTopColor: "transparent" }} />
            <span className="text-[12px]">Carregando transações...</span>
          </div>
        )}

        {/* 4 KPI cards */}
        <div className="grid md:grid-cols-4 gap-5">
          <Resumo label="Saldo Inicial" value={brl(saldoInicial)} tone={saldoInicial >= 0 ? "navy" : "expense"}
            sub="acumulado antes do período" />
          <Resumo label="Entradas" value={brl(receitas)} tone="green" delta={deltaPct(receitas, prevReceitas)} />
          <Resumo label="Saídas" value={brl(despesas)} tone="expense" delta={deltaPct(despesas, prevDespesas)} />
          <Resumo label="Saldo Final" value={brl(saldoFinal)} tone={saldoFinal >= 0 ? "green" : "expense"}
            sub={`resultado: ${brl(resultado)}`} />
        </div>

        {/* Planilha DFC */}
        {tx.length === 0 && !loading ? (
          <div className="aurora-card text-[12px] text-center py-8" style={{ color: "var(--muted-foreground)" }}>
            Nenhuma transação aprovada neste período.
          </div>
        ) : (
          <div className="aurora-card p-0 overflow-hidden">
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="aurora-cap mb-1">Planilha</div>
              <div className="aurora-serif text-[22px]">
                Demonstrativo <em className="italic" style={{ color: "var(--green)" }}>· {periodoLabel}</em>
              </div>
            </div>
            <table className="w-full">
              <tbody>
                {/* ── Entradas ── */}
                <tr style={{ background: "rgba(74,103,65,0.06)" }}>
                  <td colSpan={2} className="px-6 py-2.5 text-[10px] uppercase" style={{ letterSpacing: "2px", fontWeight: 700, color: "var(--green)" }}>
                    Entradas operacionais
                  </td>
                </tr>
                {dfcEntradas.map((row) => (
                  <tr key={`e-${row.cat}`} style={{ borderTop: "1px solid var(--line)" }}>
                    <td className="px-8 py-2.5 text-[12px]" style={{ color: "var(--foreground)" }}>{row.cat}</td>
                    <td className="px-6 py-2.5 aurora-value text-right" style={{ fontSize: 14, color: "var(--green)" }}>{brl(row.val)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid rgba(74,103,65,0.3)" }}>
                  <td className="px-6 py-3 text-[11px] uppercase" style={{ letterSpacing: "1.5px", fontWeight: 700, color: "var(--green)" }}>Total Entradas</td>
                  <td className="px-6 py-3 aurora-value text-right" style={{ fontSize: 16, color: "var(--green)", fontWeight: 700 }}>{brl(receitas)}</td>
                </tr>

                {/* ── Saídas ── */}
                <tr style={{ background: "rgba(180,90,60,0.06)", borderTop: "1px solid var(--line)" }}>
                  <td colSpan={2} className="px-6 py-2.5 text-[10px] uppercase" style={{ letterSpacing: "2px", fontWeight: 700, color: "var(--expense)" }}>
                    Saídas operacionais
                  </td>
                </tr>
                {dfcSaidas.map((row) => (
                  <tr key={`s-${row.cat}`} style={{ borderTop: "1px solid var(--line)" }}>
                    <td className="px-8 py-2.5 text-[12px]" style={{ color: "var(--foreground)" }}>{row.cat}</td>
                    <td className="px-6 py-2.5 aurora-value text-right" style={{ fontSize: 14, color: "var(--expense)" }}>({brl(row.val)})</td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid rgba(180,90,60,0.3)" }}>
                  <td className="px-6 py-3 text-[11px] uppercase" style={{ letterSpacing: "1.5px", fontWeight: 700, color: "var(--expense)" }}>Total Saídas</td>
                  <td className="px-6 py-3 aurora-value text-right" style={{ fontSize: 16, color: "var(--expense)", fontWeight: 700 }}>({brl(despesas)})</td>
                </tr>

                {/* ── Resultado + Saldo ── */}
                <tr style={{ background: "var(--linen)", borderTop: "2px solid var(--line)" }}>
                  <td className="px-6 py-3 text-[11px] uppercase" style={{ letterSpacing: "1.5px", fontWeight: 700 }}>Resultado do Período</td>
                  <td className="px-6 py-3 aurora-value text-right" style={{ fontSize: 16, fontWeight: 700, color: resultado >= 0 ? "var(--green)" : "var(--expense)" }}>{brl(resultado)}</td>
                </tr>
                <tr style={{ borderTop: "1px solid var(--line)" }}>
                  <td className="px-6 py-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>Saldo Inicial</td>
                  <td className="px-6 py-3 aurora-value text-right" style={{ fontSize: 14, color: "var(--navy)" }}>{brl(saldoInicial)}</td>
                </tr>
                <tr style={{ background: "var(--linen)", borderTop: "2px solid var(--line)" }}>
                  <td className="px-6 py-3 text-[11px] uppercase" style={{ letterSpacing: "1.5px", fontWeight: 700 }}>Saldo Final</td>
                  <td className="px-6 py-3 aurora-value text-right" style={{ fontSize: 18, fontWeight: 700, color: saldoFinal >= 0 ? "var(--green)" : "var(--expense)" }}>{brl(saldoFinal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Projeção — gráfico de linha */}
        {projecao.length > 0 && (
          <div className="aurora-card">
            <div className="aurora-cap mb-1">Próximos 90 dias</div>
            <div className="aurora-serif text-[22px] mb-6">
              Projeção <em className="italic" style={{ color: "var(--green)" }}>de fluxo de caixa</em>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={projecao.map((p) => ({ mes: p.mes, Receitas: Math.round(p.rec), Despesas: Math.round(p.des), Resultado: Math.round(p.rec - p.des) }))} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={48} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ fontSize: 12, border: "1px solid var(--line)", borderRadius: 6 }} />
                <Line type="monotone" dataKey="Receitas" stroke="var(--green)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Despesas" stroke="var(--expense)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Resultado" stroke="var(--navy)" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-5 mt-3 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              <span className="flex items-center gap-2"><span className="w-3 h-2 inline-block rounded" style={{ background: "var(--green)" }} /> Receitas</span>
              <span className="flex items-center gap-2"><span className="w-3 h-2 inline-block rounded" style={{ background: "var(--expense)" }} /> Despesas</span>
              <span className="flex items-center gap-2"><span className="w-3 h-2 inline-block rounded" style={{ background: "var(--navy)" }} /> Resultado</span>
            </div>
          </div>
        )}
      </div>
      )}
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
  tone: "green" | "tan" | "navy" | "expense";
  delta?: string | null;
  sub?: string;
}) {
  const color = tone === "green" ? "var(--green)" : tone === "expense" ? "var(--expense)" : tone === "tan" ? "var(--tan)" : "var(--navy)";
  const deltaColor = delta?.startsWith("▲") ? "var(--green)" : "var(--expense)";
  return (
    <div className="aurora-card">
      <div className="aurora-cap mb-3">{label}</div>
      <div className="aurora-value" style={{ fontSize: 34, color }}>{value}</div>
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
