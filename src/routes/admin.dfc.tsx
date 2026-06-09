import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { clients, transactionsByClient, brl } from "@/lib/mockData";

export const Route = createFileRoute("/admin/dfc")({
  component: DFCPage,
  head: () => ({ meta: [{ title: "DFC · Aurora" }] }),
});

function DFCPage() {
  const [clientId, setClientId] = useState(clients[0].id);
  const [period, setPeriod] = useState("04/2026");
  const tx = transactionsByClient(clientId);

  const receitas = useMemo(() => tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0), [tx]);
  const despesas = useMemo(() => tx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0), [tx]);
  const resultado = receitas - despesas;
  const cliente = clients.find((c) => c.id === clientId)!;

  // Group by category
  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    tx.forEach((t) => {
      const k = t.category || "—";
      map.set(k, (map.get(k) ?? 0) + Math.abs(t.amount));
    });
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries())
      .map(([cat, val]) => ({ cat, val, pct: (val / total) * 100 }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 8);
  }, [tx]);

  // Weekly grouping (mock by date prefix)
  const semanas = useMemo(() => {
    const w = [
      { lbl: "Sem 1", rec: 0, des: 0 },
      { lbl: "Sem 2", rec: 0, des: 0 },
      { lbl: "Sem 3", rec: 0, des: 0 },
      { lbl: "Sem 4", rec: 0, des: 0 },
    ];
    tx.forEach((t) => {
      const day = parseInt(t.date.split("/")[0], 10);
      const idx = Math.min(3, Math.floor((day - 1) / 7));
      if (t.amount >= 0) w[idx].rec += t.amount;
      else w[idx].des += Math.abs(t.amount);
    });
    return w;
  }, [tx]);
  const maxBar = Math.max(...semanas.map((s) => Math.max(s.rec, s.des)), 1);

  // Projeção (mock)
  const projecao = [
    { mes: "Maio", rec: receitas * 1.04, des: despesas * 1.02 },
    { mes: "Junho", rec: receitas * 1.07, des: despesas * 1.04 },
    { mes: "Julho", rec: receitas * 1.10, des: despesas * 1.05 },
  ];

  return (
    <AdminLayout>
      <PageHeader
        cap={`DFC · ${cliente.name}`}
        title="Demonstrativo"
        emphasis="de fluxo de caixa"
        description="Análise consolidada do período com comparativo, drill-down por categoria e projeção dos próximos 3 meses."
        right={
          <div className="flex gap-2 flex-wrap">
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="bg-white px-3 py-2.5 text-[12px]" style={{ border: "1px solid var(--line)" }}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-white px-3 py-2.5 text-[12px]" style={{ border: "1px solid var(--line)" }}>
              <option>04/2026</option>
              <option>03/2026</option>
              <option>02/2026</option>
            </select>
          </div>
        }
      />

      <div className="px-8 lg:px-12 pb-12 grid gap-8">
        {/* Resumo */}
        <div className="grid md:grid-cols-4 gap-5">
          <Resumo label="Saldo atual" value={brl(cliente.balance)} tone="navy" />
          <Resumo label="Receitas" value={brl(receitas)} tone="green" />
          <Resumo label="Despesas" value={brl(despesas)} tone="tan" />
          <Resumo label="Resultado" value={brl(resultado)} tone={resultado >= 0 ? "green" : "tan"} />
        </div>

        {/* Fluxo semanal */}
        <div className="aurora-card">
          <div className="aurora-cap mb-1">Gráfico</div>
          <div className="aurora-serif text-[22px] mb-7">
            Fluxo semanal <em className="italic" style={{ color: "var(--green)" }}>· {period}</em>
          </div>
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
        </div>

        {/* Por categoria */}
        <div className="aurora-card p-0 overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="aurora-cap mb-1">Detalhamento</div>
            <div className="aurora-serif text-[22px]">Por <em className="italic" style={{ color: "var(--green)" }}>categoria</em></div>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--linen)" }}>
                {["Categoria", "Total", "% do total", "vs mês anterior"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {porCategoria.map((row, i) => {
                const variation = (Math.random() - 0.4) * 30;
                const up = variation >= 0;
                return (
                  <tr key={row.cat} style={{ background: i % 2 === 0 ? "#fff" : "var(--linen2)", borderTop: "1px solid var(--line)" }}>
                    <td className="px-6 py-3 text-[12px]">{row.cat}</td>
                    <td className="px-6 py-3 text-[12px] aurora-serif" style={{ fontSize: 14, color: "var(--navy)" }}>{brl(row.val)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="text-[12px] w-12">{row.pct.toFixed(1)}%</div>
                        <div className="flex-1 h-1.5 max-w-[180px]" style={{ background: "var(--linen)" }}>
                          <div className="h-full" style={{ width: `${row.pct}%`, background: "var(--sage)" }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[12px]" style={{ color: up ? "var(--green)" : "var(--tan)" }}>
                      {up ? "↑" : "↓"} {Math.abs(variation).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Projeção */}
        <div className="aurora-card p-0 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--line)" }}>
            <div>
              <div className="aurora-cap mb-1">Próximos 90 dias</div>
              <div className="aurora-serif text-[22px]">Projeção <em className="italic" style={{ color: "var(--green)" }}>baseada em recorrências</em></div>
            </div>
            <div className="flex gap-2">
              <button className="text-[10px] uppercase px-4 py-2" style={{ border: "1px solid var(--line)", color: "var(--muted-foreground)", letterSpacing: "2px" }}>Exportar PDF</button>
              <button className="text-[10px] uppercase px-4 py-2" style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}>Exportar Excel</button>
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
                return (
                  <tr key={p.mes} style={{ background: i % 2 === 0 ? "#fff" : "var(--linen2)", borderTop: "1px solid var(--line)" }}>
                    <td className="px-6 py-3 text-[13px]" style={{ fontWeight: 500 }}>{p.mes} · 2026</td>
                    <td className="px-6 py-3 text-[12px] aurora-serif" style={{ fontSize: 14, color: "var(--green)" }}>{brl(p.rec)}</td>
                    <td className="px-6 py-3 text-[12px] aurora-serif" style={{ fontSize: 14, color: "var(--tan)" }}>{brl(p.des)}</td>
                    <td className="px-6 py-3 text-[12px] aurora-serif" style={{ fontSize: 16, color: r >= 0 ? "var(--green)" : "var(--tan)" }}>{brl(r)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

function Resumo({ label, value, tone }: { label: string; value: string; tone: "green" | "tan" | "navy" }) {
  const color = tone === "green" ? "var(--green)" : tone === "tan" ? "var(--tan)" : "var(--navy)";
  return (
    <div className="aurora-card">
      <div className="aurora-cap mb-3">{label}</div>
      <div className="aurora-serif" style={{ fontSize: 30, color, lineHeight: 1, letterSpacing: "-1px" }}>{value}</div>
    </div>
  );
}
