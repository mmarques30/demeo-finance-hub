import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { clients, currentMonthLabel } from "@/lib/mockData";

export const Route = createFileRoute("/admin/relatorios")({
  component: RelatoriosPage,
  head: () => ({ meta: [{ title: "Relatórios · Aurora" }] }),
});

function RelatoriosPage() {
  return (
    <AdminLayout>
      <PageHeader
        cap="Entregas mensais"
        title="Relatórios"
        emphasis="gerados"
        description="Histórico de relatórios entregues aos clientes da carteira."
      />
      <div className="px-8 lg:px-12 pb-12">
        <div className="aurora-card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--linen)" }}>
                {["Cliente", "Período", "Gerado em", "Tipo", "Ações"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? "#fff" : "var(--linen2)", borderTop: "1px solid var(--line)" }}>
                  <td className="px-6 py-4 text-[13px]" style={{ fontWeight: 500 }}>{c.name}</td>
                  <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>{currentMonthLabel}</td>
                  <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>{c.lastUpload}/04 · 09:14</td>
                  <td className="px-6 py-4 text-[11px]"><span className="aurora-badge aurora-badge--ok">DFC + DRE</span></td>
                  <td className="px-6 py-4 text-[11px]">
                    <span className="aurora-link mr-3">PDF ↓</span>
                    <span className="aurora-link">Excel ↓</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
