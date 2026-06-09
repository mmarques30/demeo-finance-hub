import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { clients } from "@/lib/mockData";
import { StatusBadge } from "./admin.index";

export const Route = createFileRoute("/admin/clientes")({
  component: ClientesPage,
  head: () => ({ meta: [{ title: "Clientes · Aura" }] }),
});

const filtros = ["Todos", "Pendentes", "Fechados", "Com pendência"] as const;

function ClientesPage() {
  const [filtro, setFiltro] = useState<typeof filtros[number]>("Todos");

  const lista = clients.filter((c) => {
    if (filtro === "Todos") return true;
    if (filtro === "Pendentes") return c.status === "Pendente";
    if (filtro === "Fechados") return c.status === "Fechado";
    if (filtro === "Com pendência") return c.pendingCount > 0;
    return true;
  });

  return (
    <AdminLayout>
      <PageHeader
        cap="Carteira · 2026"
        title="Meus"
        emphasis="clientes"
        description="Gerencie todas as empresas que estão sob a sua gestão financeira."
        right={
          <button
            className="inline-flex items-center gap-2 px-5 py-3 text-[10px] uppercase"
            style={{ background: "var(--green)", color: "#fff", letterSpacing: "2.5px", fontWeight: 500 }}
          >
            + Novo cliente
          </button>
        }
      />

      <div className="px-8 lg:px-12 pb-12">
        <div className="flex gap-2 mb-6 flex-wrap">
          {filtros.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className="text-[10px] uppercase px-4 py-2"
              style={{
                letterSpacing: "2px",
                fontWeight: 500,
                background: filtro === f ? "var(--green)" : "transparent",
                color: filtro === f ? "#fff" : "var(--muted-foreground)",
                border: "1px solid " + (filtro === f ? "var(--green)" : "var(--line)"),
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="aura-card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--linen)" }}>
                {["Empresa", "Responsável", "Bancos", "Status", "Último extrato", ""].map((h) => (
                  <th key={h} className="text-left px-6 py-3 aura-cap" style={{ fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((c, idx) => (
                <tr
                  key={c.id}
                  style={{
                    background: idx % 2 === 0 ? "#fff" : "var(--linen2)",
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="text-[13px]" style={{ fontWeight: 500 }}>{c.name}</div>
                  </td>
                  <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>{c.owner}</td>
                  <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>{c.banks.join(", ")}</td>
                  <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                  <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>{c.lastUpload}/04</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={"/admin/dfc" as never} className="aura-link">Ver painel →</Link>
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>Nenhum cliente neste filtro.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
