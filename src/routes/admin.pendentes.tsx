import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { pendingTransactions, clientById, brl } from "@/lib/mockData";

export const Route = createFileRoute("/admin/pendentes")({
  component: PendentesPage,
  head: () => ({ meta: [{ title: "Pendentes · Aurora" }] }),
});

const categoriasMock = [
  "Receita · Vendas",
  "Receita · Serviços",
  "Despesa Fixa · Aluguel",
  "Despesa Fixa · Salários",
  "Despesa Fixa · Utilidades",
  "Despesa Variável · Insumos",
  "Despesa Variável · Marketing",
  "Investimento · Equipamentos",
];

function PendentesPage() {
  const all = pendingTransactions();
  const grouped = all.reduce<Record<string, typeof all>>((acc, t) => {
    (acc[t.clientId] ||= []).push(t);
    return acc;
  }, {});

  const [recurring, setRecurring] = useState<Record<string, boolean>>({});
  const [cats, setCats] = useState<Record<string, string>>({});

  return (
    <AdminLayout>
      <PageHeader
        cap="Revisão manual"
        title="Lançamentos"
        emphasis="pendentes"
        description={`${all.length} lançamentos aguardando classificação em ${Object.keys(grouped).length} clientes.`}
      />

      <div className="px-8 lg:px-12 pb-12 flex flex-col gap-7">
        {Object.entries(grouped).map(([cid, items]) => {
          const c = clientById(cid);
          if (!c) return null;
          return (
            <div key={cid} className="aurora-card p-0 overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between" style={{ background: "var(--linen)", borderBottom: "1px solid var(--line)" }}>
                <div>
                  <div className="aurora-cap mb-1">Cliente</div>
                  <div className="aurora-serif text-[20px]">
                    {c.name} <em className="italic" style={{ color: "var(--green)" }}>· {items.length} pendentes</em>
                  </div>
                </div>
                <button className="text-[10px] uppercase px-4 py-2" style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}>
                  Salvar classificação
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    {["Data", "Descrição", "Valor", "Categoria", "Recorrente"].map((h) => (
                      <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500, borderBottom: "1px solid var(--line)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((t, idx) => (
                    <tr key={t.id} style={{ background: idx % 2 === 0 ? "#fff" : "#FAFAF8" }}>
                      <td className="px-6 py-3 text-[12px]">{t.date}</td>
                      <td className="px-6 py-3 text-[12px]" title={t.rawDescription}>{t.description}</td>
                      <td className="px-6 py-3 aurora-serif text-[14px]" style={{ color: t.amount >= 0 ? "var(--green)" : "var(--navy)" }}>
                        {t.amount >= 0 ? "+" : ""}{brl(t.amount)}
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={cats[t.id] ?? ""}
                          onChange={(e) => setCats({ ...cats, [t.id]: e.target.value })}
                          className="bg-white px-2.5 py-1.5 text-[12px] w-full max-w-xs"
                          style={{ border: "1px solid var(--line)" }}
                        >
                          <option value="">Selecione...</option>
                          {categoriasMock.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          <input
                            type="checkbox"
                            checked={!!recurring[t.id]}
                            onChange={(e) => setRecurring({ ...recurring, [t.id]: e.target.checked })}
                          />
                          Salvar como regra
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
