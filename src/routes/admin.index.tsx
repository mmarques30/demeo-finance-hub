import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { clients, currentMonthLabel, brl, pendingTransactions } from "@/lib/mockData";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Dashboard · Aurora" }] }),
});

function AdminDashboard() {
  const ativos = clients.length;
  const pendentes = clients.filter((c) => c.status !== "Fechado").length;
  const revisar = pendingTransactions().length;
  const clientesComPendencia = new Set(pendingTransactions().map((t) => t.clientId)).size;

  const maxRevenue = Math.max(...clients.map((c) => c.revenue));
  const monthClient = "c2"; // current focus client (mock)

  return (
    <AdminLayout>
      <PageHeader
        cap={`Fechamentos · ${currentMonthLabel}`}
        title="Visão geral"
        emphasis="da carteira"
        description="Acompanhe o status do mês, lançamentos pendentes e a evolução de cada cliente em um único lugar."
        right={
          <Link
            to={"/admin/importar" as never}
            className="inline-flex items-center gap-2 px-5 py-3 text-[10px] uppercase"
            style={{ background: "var(--green)", color: "#fff", letterSpacing: "2.5px", fontWeight: 500 }}
          >
            + Importar extrato
          </Link>
        }
      />

      <div className="px-8 lg:px-12 pb-12 grid gap-8">
        {/* Status cards */}
        <div className="grid md:grid-cols-3 gap-5">
          <StatusCard label="Clientes Ativos" value={String(ativos)} sub="carteira atual" tone="green" />
          <StatusCard label="Fechamentos Pendentes" value={String(pendentes)} sub="aguardando revisão" tone="tan" />
          <StatusCard
            label="Lançamentos para revisar"
            value={String(revisar)}
            sub={`${clientesComPendencia} clientes`}
            tone="navy"
          />
        </div>

        {/* Chart */}
        <div className="aurora-card">
          <div className="flex items-end justify-between mb-7">
            <div>
              <div className="aurora-cap mb-1.5">Gráfico</div>
              <div className="aurora-serif text-[26px]">
                Receita por cliente <em className="italic" style={{ color: "var(--green)" }}>· {currentMonthLabel}</em>
              </div>
            </div>
            <div className="text-[10px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>
              em R$
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6 items-end h-[220px]">
            {clients.map((c) => {
              const height = (c.revenue / maxRevenue) * 100;
              const isCurrent = c.id === monthClient;
              return (
                <div key={c.id} className="flex flex-col items-center gap-3 h-full justify-end">
                  <div className="w-full flex items-end justify-center" style={{ height: "100%" }}>
                    <div
                      className="w-full transition-all"
                      style={{
                        height: `${height}%`,
                        background: isCurrent ? "var(--green)" : "var(--sage)",
                        borderRadius: "4px 4px 0 0",
                        opacity: isCurrent ? 1 : 0.85,
                      }}
                      title={brl(c.revenue)}
                    />
                  </div>
                  <div className="text-[10px] uppercase text-center" style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)" }}>
                    {c.name.split(" ").slice(0, 2).join(" ")}
                  </div>
                  <div className="aurora-serif text-[16px]" style={{ color: "var(--navy)" }}>
                    {brl(c.revenue).replace(",00", "")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="aurora-card p-0 overflow-hidden">
          <div className="px-7 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--line)" }}>
            <div>
              <div className="aurora-cap mb-1">Tabela</div>
              <div className="aurora-serif text-[22px]">
                Status dos <em className="italic" style={{ color: "var(--green)" }}>fechamentos</em>
              </div>
            </div>
            <Link to={"/admin/clientes" as never} className="aurora-link">
              Ver todos →
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--linen)" }}>
                {["Cliente", "Banco", "Saldo", "Status"].map((h) => (
                  <th key={h} className="text-left px-7 py-3 aurora-cap" style={{ fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, idx) => (
                <tr
                  key={c.id}
                  className="transition-colors"
                  style={{
                    background: idx % 2 === 0 ? "#fff" : "#FAFAF8",
                    borderTop: "1px solid var(--line)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(74,103,65,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#FAFAF8")}
                >
                  <td className="px-7 py-4">
                    <div className="text-[13px]" style={{ fontWeight: 500 }}>{c.name}</div>
                    <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{c.owner}</div>
                  </td>
                  <td className="px-7 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    {c.banks.join(" · ")}
                  </td>
                  <td className="px-7 py-4 aurora-serif text-[18px]" style={{ color: "var(--navy)" }}>
                    {brl(c.balance)}
                  </td>
                  <td className="px-7 py-4">
                    <StatusBadge status={c.status} />
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

function StatusCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "green" | "tan" | "navy";
}) {
  const color = tone === "green" ? "var(--green)" : tone === "tan" ? "var(--tan)" : "var(--navy)";
  return (
    <div className="aurora-card">
      <div className="aurora-cap mb-3">{label}</div>
      <div className="aurora-serif" style={{ fontSize: 44, color, lineHeight: 1, letterSpacing: "-1.5px" }}>
        {value}
      </div>
      <div className="text-[11px] mt-2" style={{ color: "var(--muted-foreground)" }}>{sub}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Fechado"
      ? "aurora-badge aurora-badge--ok"
      : status === "Pendente"
      ? "aurora-badge aurora-badge--pnd"
      : "aurora-badge aurora-badge--prog";
  return <span className={cls}>● {status}</span>;
}
