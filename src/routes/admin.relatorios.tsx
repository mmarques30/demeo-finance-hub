import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { currentMonthLabel, formatDatePtBR } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/relatorios")({
  component: RelatoriosPage,
  head: () => ({ meta: [{ title: "Relatórios · Aurora" }] }),
});

interface ClientRow {
  id: string;
  name: string;
  last_upload_at: string | null;
  status: string;
}

function RelatoriosPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const mesLabel = currentMonthLabel();

  useEffect(() => {
    supabase
      .from("clients")
      .select("id, name, last_upload_at, status")
      .order("name")
      .then(({ data }) => {
        setClients((data ?? []) as ClientRow[]);
        setLoading(false);
      });
  }, []);

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
                {["Cliente", "Período", "Último extrato", "Tipo", "Ações"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    Carregando clientes...
                  </td>
                </tr>
              )}
              {!loading && clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
              {!loading && clients.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderTop: "1px solid var(--line)" }}>
                  <td className="px-6 py-4 text-[13px]" style={{ fontWeight: 500 }}>{c.name}</td>
                  <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>{mesLabel}</td>
                  <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    {formatDatePtBR(c.last_upload_at)}
                  </td>
                  <td className="px-6 py-4 text-[11px]">
                    <span className="aurora-badge aurora-badge--ok">DFC + DRE</span>
                  </td>
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
