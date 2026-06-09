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
  const totalRevenue = clients.reduce((s, c) => s + c.revenue, 0);
  const totalBalance = clients.reduce((s, c) => s + c.balance, 0);

  const maxRevenue = Math.max(...clients.map((c) => c.revenue));
  const monthClient = "c2";

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
            className="focus-ring inline-flex items-center gap-2 text-[11px] uppercase"
            style={{
              background: "var(--green)",
              color: "#fff",
              letterSpacing: "2.5px",
              fontWeight: 500,
              padding: "14px 22px",
            }}
          >
            + Importar extrato
          </Link>
        }
      />

      <div className="px-6 lg:px-10 py-10 flex flex-col gap-10">
        {/* KPIs principais — 3 cards grandes, conectados aos objetivos do módulo */}
        <div className="grid md:grid-cols-3 gap-5">
          <KpiCard
            icon="◷"
            label="Clientes ativos"
            value={String(ativos)}
            sub="empresas sob gestão na carteira"
            tone="sage"
            footer={`${brl(totalBalance).replace(",00", "")} em saldo consolidado`}
          />
          <KpiCard
            icon="⊙"
            label="Fechamentos pendentes"
            value={String(pendentes)}
            sub="aguardando sua revisão"
            tone="tan"
            footer="Prazo entrega · 5º dia útil"
          />
          <KpiCard
            icon="▤"
            label="Lançamentos para revisar"
            value={String(revisar)}
            sub={`espalhados em ${clientesComPendencia} clientes`}
            tone="navy"
            footer="Classificação automática pendente"
          />
        </div>

        {/* Receita por cliente — agora com header mais limpo e barras maiores */}
        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--line)",
          }}
        >
          <header
            className="flex items-end justify-between flex-wrap gap-4 px-7 lg:px-9 py-6"
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            <div>
              <div
                className="text-[11px] uppercase mb-2"
                style={{ letterSpacing: "2.5px", color: "var(--green)", fontWeight: 600 }}
              >
                Receita · Por cliente
              </div>
              <h2
                className="aurora-serif"
                style={{
                  fontSize: 28,
                  fontWeight: 300,
                  letterSpacing: "-0.8px",
                  lineHeight: 1.1,
                }}
              >
                {currentMonthLabel} ·{" "}
                <em className="italic" style={{ color: "var(--green)" }}>
                  {brl(totalRevenue).replace(",00", "")}
                </em>
              </h2>
            </div>
            <div
              className="text-[11px] uppercase"
              style={{ letterSpacing: "2px", color: "var(--muted-foreground)", fontWeight: 500 }}
            >
              em R$ · 4 empresas
            </div>
          </header>

          <div className="px-7 lg:px-9 py-9">
            <div className="grid grid-cols-4 gap-8 items-end" style={{ height: 260 }}>
              {clients.map((c) => {
                const height = (c.revenue / maxRevenue) * 100;
                const isCurrent = c.id === monthClient;
                return (
                  <div key={c.id} className="flex flex-col items-stretch gap-4 h-full justify-end">
                    {/* Valor topo da barra */}
                    <div
                      className="aurora-serif text-center"
                      style={{
                        fontSize: 22,
                        fontWeight: 300,
                        color: isCurrent ? "var(--green)" : "var(--navy)",
                        letterSpacing: "-0.5px",
                        lineHeight: 1,
                      }}
                    >
                      {brl(c.revenue).replace(",00", "")}
                    </div>
                    {/* Barra */}
                    <div className="w-full flex items-end justify-center" style={{ flex: 1 }}>
                      <div
                        className="w-full transition-all"
                        style={{
                          height: `${height}%`,
                          background: isCurrent
                            ? "linear-gradient(180deg, var(--green), var(--green2))"
                            : "var(--sage)",
                          opacity: isCurrent ? 1 : 0.85,
                          minHeight: 12,
                        }}
                        title={brl(c.revenue)}
                      />
                    </div>
                    {/* Label cliente */}
                    <div
                      className="text-[12px] text-center"
                      style={{
                        color: "var(--foreground)",
                        fontWeight: isCurrent ? 500 : 400,
                        lineHeight: 1.3,
                      }}
                    >
                      {c.name}
                    </div>
                    {/* Status sob nome */}
                    <div className="flex justify-center">
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tabela — mais respiro, linhas maiores */}
        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--line)",
          }}
        >
          <header
            className="flex items-end justify-between flex-wrap gap-4 px-7 lg:px-9 py-6"
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            <div>
              <div
                className="text-[11px] uppercase mb-2"
                style={{ letterSpacing: "2.5px", color: "var(--sage)", fontWeight: 600 }}
              >
                Carteira · Detalhe
              </div>
              <h2
                className="aurora-serif"
                style={{
                  fontSize: 28,
                  fontWeight: 300,
                  letterSpacing: "-0.8px",
                  lineHeight: 1.1,
                }}
              >
                Status dos{" "}
                <em className="italic" style={{ color: "var(--green)" }}>
                  fechamentos
                </em>
              </h2>
            </div>
            <Link
              to={"/admin/clientes" as never}
              className="focus-ring text-[11px] uppercase inline-flex items-center gap-2"
              style={{
                letterSpacing: "2px",
                color: "var(--foreground)",
                border: "1px solid var(--foreground)",
                padding: "10px 18px",
                fontWeight: 500,
              }}
            >
              Ver todos →
            </Link>
          </header>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FAFAF8" }}>
                {["Cliente", "Banco", "Saldo", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-7 lg:px-9 py-4 text-[11px] uppercase"
                    style={{
                      fontWeight: 600,
                      letterSpacing: "2px",
                      color: "var(--muted-foreground)",
                    }}
                  >
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
                    borderTop: "1px solid var(--line)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(74,103,65,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-7 lg:px-9 py-5">
                    <div className="text-[14px]" style={{ fontWeight: 500, color: "var(--foreground)" }}>
                      {c.name}
                    </div>
                    <div className="text-[12px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                      {c.owner}
                    </div>
                  </td>
                  <td className="px-7 lg:px-9 py-5 text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                    {c.banks.join(" · ")}
                  </td>
                  <td
                    className="px-7 lg:px-9 py-5 aurora-serif"
                    style={{ fontSize: 20, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.3px" }}
                  >
                    {brl(c.balance)}
                  </td>
                  <td className="px-7 lg:px-9 py-5">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AdminLayout>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone,
  footer,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  tone: "sage" | "tan" | "navy";
  footer?: string;
}) {
  const color =
    tone === "sage" ? "var(--green)" : tone === "tan" ? "var(--tan)" : "var(--navy)";
  const bg =
    tone === "sage"
      ? "rgba(143,166,136,0.10)"
      : tone === "tan"
      ? "rgba(184,149,106,0.12)"
      : "rgba(27,57,77,0.10)";
  return (
    <article
      className="p-7 flex flex-col gap-4"
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--line)",
        borderTop: `3px solid ${color}`,
      }}
    >
      <header className="flex items-start justify-between gap-4">
        <div
          className="text-[12px] uppercase"
          style={{
            letterSpacing: "2.5px",
            color: "var(--foreground)",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          {label}
        </div>
        <div
          aria-hidden
          className="inline-flex items-center justify-center shrink-0"
          style={{
            width: 40,
            height: 40,
            background: bg,
            color,
            fontSize: 18,
          }}
        >
          {icon}
        </div>
      </header>

      <div
        className="aurora-serif"
        style={{
          fontSize: 64,
          fontWeight: 300,
          color,
          lineHeight: 1,
          letterSpacing: "-2px",
        }}
      >
        {value}
      </div>

      <div className="text-[13px]" style={{ color: "var(--foreground)", lineHeight: 1.5 }}>
        {sub}
      </div>

      {footer && (
        <div
          className="mt-2 pt-4 text-[11px]"
          style={{
            color: "var(--muted-foreground)",
            borderTop: "1px solid var(--line)",
            lineHeight: 1.5,
          }}
        >
          {footer}
        </div>
      )}
    </article>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Fechado"
      ? { bg: "rgba(74,103,65,0.10)", color: "var(--green)" }
      : status === "Pendente"
      ? { bg: "rgba(184,149,106,0.15)", color: "var(--tan)" }
      : { bg: "rgba(27,57,77,0.10)", color: "var(--navy)" };
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] uppercase"
      style={{
        letterSpacing: "1.5px",
        fontWeight: 600,
        background: tone.bg,
        color: tone.color,
        padding: "5px 12px",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: tone.color }} />
      {status}
    </span>
  );
}
