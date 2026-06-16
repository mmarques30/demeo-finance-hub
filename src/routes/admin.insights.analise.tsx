import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl, monthOptions, monthRangeDates } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useFinancialAnalysis } from "@/hooks/useFinancialAnalysis";

export const Route = createFileRoute("/admin/insights/analise")({
  component: AnaliseFinanceiraPage,
  head: () => ({ meta: [{ title: "Análise Financeira · Aurora" }] }),
});

interface ClientOption { id: string; name: string }

const PERIODS = monthOptions(12);

function AnaliseFinanceiraPage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState("");
  const [period, setPeriod] = useState(PERIODS[0]);

  useEffect(() => {
    supabase()
      .from("clients")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setClients(data as ClientOption[]);
          setClientId(data[0].id);
        }
      });
  }, []);

  const { start, end } = monthRangeDates(period);
  const { data: analysis, isLoading, refetch } = useFinancialAnalysis(clientId, start, end);

  const clientName = clients.find((c) => c.id === clientId)?.name ?? "Cliente";

  return (
    <AdminLayout>
      <PageHeader
        title="Análise Financeira"
        right={
          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="bg-white px-3 py-2.5 text-sm"
              style={{ border: "1px solid var(--line)" }}
            >
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white px-3 py-2.5 text-sm"
              style={{ border: "1px solid var(--line)" }}
            >
              {PERIODS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <button
              onClick={() => refetch()}
              className="aurora-cta px-4 py-2.5 text-sm"
              disabled={isLoading}
            >
              {isLoading ? "Analisando..." : "Gerar análise"}
            </button>
          </div>
        }
      />

      <div className="px-8 lg:px-12 pb-12 flex flex-col gap-8">
        {isLoading && (
          <div className="aurora-card flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full border-2 animate-spin shrink-0"
              style={{ borderColor: "var(--green)", borderTopColor: "transparent" }}
            />
            <span>Consultando Claude com os dados de {clientName}...</span>
          </div>
        )}

        {!isLoading && !analysis && (
          <div className="aurora-card text-center py-10" style={{ color: "var(--muted-foreground)" }}>
            <div className="aurora-serif text-[22px] mb-2">Nenhuma análise ainda</div>
            <div className="text-sm">Selecione um cliente e período e clique em Gerar análise.</div>
          </div>
        )}

        {analysis && (
          <>
            {/* Score + Insights + Alertas */}
            <div className="grid md:grid-cols-3 gap-5">
              <HealthScoreCard score={analysis.health_score} />
              <div className="aurora-card md:col-span-2 flex flex-col gap-4">
                <div>
                  <div className="aurora-cap mb-1">Diagnóstico IA</div>
                  <div className="aurora-serif text-[20px]">{clientName} <em className="italic" style={{ color: "var(--green)" }}>· {period}</em></div>
                </div>
                <ul className="flex flex-col gap-2">
                  {analysis.insights.map((insight, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span style={{ color: "var(--green)", flexShrink: 0, marginTop: 2 }}>◆</span>
                      {insight}
                    </li>
                  ))}
                </ul>
                {analysis.alerts.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2">
                    {analysis.alerts.map((alert, i) => (
                      <div
                        key={i}
                        className="flex gap-3 text-sm px-4 py-3 rounded-xl"
                        style={{ background: "rgba(184,149,106,0.10)", color: "var(--tan)" }}
                      >
                        <span style={{ flexShrink: 0 }}>⚠</span>
                        {alert}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top despesas */}
            {analysis.top_expenses.length > 0 && (
              <div className="aurora-card p-0 overflow-hidden">
                <div className="px-6 py-5">
                  <div className="aurora-cap mb-1">Concentração de gastos</div>
                  <div className="aurora-serif text-[20px]">Top categorias <em className="italic" style={{ color: "var(--green)" }}>do período</em></div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "var(--linen)" }}>
                      {["Categoria", "Total", "% do total", ""].map((h) => (
                        <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.top_expenses.map((row, i) => (
                      <tr key={row.category} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderTop: "1px solid var(--line)" }}>
                        <td className="px-6 py-3 text-sm">{row.category}</td>
                        <td className="px-6 py-3 aurora-serif" style={{ fontSize: 15, color: "var(--navy)" }}>{brl(row.amount)}</td>
                        <td className="px-6 py-3 text-sm">{row.pct_total.toFixed(1)}%</td>
                        <td className="px-6 py-3">
                          <div className="h-1.5 max-w-[160px]" style={{ background: "var(--linen)" }}>
                            <div className="h-full" style={{ width: `${Math.min(row.pct_total, 100)}%`, background: "var(--sage)" }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Projeção */}
            {analysis.projection.length > 0 && (
              <div className="aurora-card p-0 overflow-hidden">
                <div className="px-6 py-5">
                  <div className="aurora-cap mb-1">Próximos 90 dias</div>
                  <div className="aurora-serif text-[20px]">Projeção <em className="italic" style={{ color: "var(--green)" }}>baseada na tendência real</em></div>
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
                    {analysis.projection.map((p, i) => {
                      const r = p.rec - p.des;
                      return (
                        <tr key={p.month} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderTop: "1px solid var(--line)" }}>
                          <td className="px-6 py-3 text-sm font-medium">{p.month}</td>
                          <td className="px-6 py-3 aurora-serif" style={{ fontSize: 15, color: "var(--green)" }}>{brl(p.rec)}</td>
                          <td className="px-6 py-3 aurora-serif" style={{ fontSize: 15, color: "var(--tan)" }}>{brl(p.des)}</td>
                          <td className="px-6 py-3 aurora-serif" style={{ fontSize: 17, color: r >= 0 ? "var(--green)" : "var(--tan)" }}>{brl(r)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function HealthScoreCard({ score }: { score: number }) {
  const color = score >= 80 ? "var(--green)" : score >= 60 ? "var(--tan)" : "#C0392B";
  const label = score >= 80 ? "Saudável" : score >= 60 ? "Atenção" : "Crítico";

  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="aurora-card flex flex-col items-center justify-center gap-3 py-8">
      <div className="aurora-cap">Saúde financeira</div>
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--linen)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="aurora-serif" style={{ fontSize: 30, color, lineHeight: 1 }}>{score}</span>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/100</span>
        </div>
      </div>
      <div className="text-sm font-medium" style={{ color }}>{label}</div>
    </div>
  );
}
