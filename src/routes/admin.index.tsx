import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl, currentMonthLabel, currentMonthStr, monthRangeDates } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Dashboard · Aurora" }] }),
});

interface ClientRow {
  id: string;
  name: string;
  status: string;
  last_upload_at: string | null;
}

interface ClientSummary extends ClientRow {
  receita: number;
  saldo: number;
  pendentes: number;
  banks: string[];
}

function AdminDashboard() {
  const [clientes, setClientes] = useState<ClientSummary[]>([]);
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { start, end } = monthRangeDates(currentMonthStr());

    const [
      { data: clientsData },
      { data: txData },
      { data: banksData },
    ] = await Promise.all([
      supabase.from("clients").select("id, name, status, last_upload_at").order("name"),
      supabase
        .from("transactions")
        .select("client_id, amount, status, date")
        .in("status", ["approved", "pending"]),
      supabase.from("client_banks").select("client_id, bank_name"),
    ]);

    const clients = (clientsData ?? []) as ClientRow[];
    const txList = txData ?? [];
    const banksList = banksData ?? [];

    // Agrupa bancos por cliente
    const banksMap: Record<string, string[]> = {};
    for (const b of banksList) {
      (banksMap[b.client_id] ||= []).push(b.bank_name);
    }

    // Indexa transações por cliente (O(n) em vez de O(n*m))
    const txByClient: Record<string, typeof txList> = {};
    for (const t of txList) {
      (txByClient[t.client_id] ||= []).push(t);
    }

    let totalPend = 0;
    const summaries: ClientSummary[] = clients.map((c) => {
      const clientTx = txByClient[c.id] ?? [];
      const receita = clientTx
        .filter((t) => t.status === "approved" && t.amount > 0 && t.date >= start && t.date <= end)
        .reduce((s, t) => s + t.amount, 0);
      const saldo = clientTx
        .filter((t) => t.status === "approved")
        .reduce((s, t) => s + t.amount, 0);
      const pendentes = clientTx.filter((t) => t.status === "pending").length;
      totalPend += pendentes;
      return { ...c, receita, saldo, pendentes, banks: banksMap[c.id] ?? [] };
    });

    setClientes(summaries);
    setTotalPendentes(totalPend);
    setLoading(false);
  }

  const ativos = clientes.length;
  const comPendencia = clientes.filter((c) => c.pendentes > 0).length;
  const totalReceita = clientes.reduce((s, c) => s + c.receita, 0);
  const totalSaldo = clientes.reduce((s, c) => s + c.saldo, 0);
  const maxReceita = Math.max(...clientes.map((c) => c.receita), 1);
  const mesLabel = currentMonthLabel();

  return (
    <AdminLayout>
      <PageHeader
        cap={`Fechamentos · ${mesLabel}`}
        title="Visão geral"
        emphasis="da carteira"
        description="Acompanhe o status do mês, lançamentos pendentes e a evolução de cada cliente em um único lugar."
        right={
          <Link
            to={"/admin/importar" as never}
            className="focus-ring inline-flex items-center gap-2 text-[11px] uppercase"
            style={{ background: "var(--green)", color: "#fff", letterSpacing: "2.5px", fontWeight: 500, padding: "14px 22px" }}
          >
            + Importar extrato
          </Link>
        }
      />

      <div className="px-6 lg:px-10 py-10 flex flex-col gap-10">
        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-5">
          <KpiCard
            icon="◷"
            label="Clientes ativos"
            value={loading ? "—" : String(ativos)}
            sub="empresas sob gestão na carteira"
            tone="sage"
            footer={loading ? "" : `${brl(totalSaldo).replace(",00", "")} em saldo consolidado`}
          />
          <KpiCard
            icon="⊙"
            label="Clientes com pendências"
            value={loading ? "—" : String(comPendencia)}
            sub="aguardando classificação"
            tone="tan"
            footer="Prazo entrega · 5º dia útil"
          />
          <KpiCard
            icon="▤"
            label="Lançamentos para revisar"
            value={loading ? "—" : String(totalPendentes)}
            sub={`espalhados em ${comPendencia} clientes`}
            tone="navy"
            footer="Classificação automática pendente"
          />
        </div>

        {/* Receita por cliente */}
        <section style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}>
          <header className="flex items-end justify-between flex-wrap gap-4 px-7 lg:px-9 py-6" style={{ borderBottom: "1px solid var(--line)" }}>
            <div>
              <div className="text-[11px] uppercase mb-2" style={{ letterSpacing: "2.5px", color: "var(--green)", fontWeight: 600 }}>
                Receita · Por cliente
              </div>
              <h2 className="aurora-serif" style={{ fontSize: 28, fontWeight: 300, letterSpacing: "-0.8px", lineHeight: 1.1 }}>
                {mesLabel} ·{" "}
                <em className="italic" style={{ color: "var(--green)" }}>
                  {brl(totalReceita).replace(",00", "")}
                </em>
              </h2>
            </div>
            <div className="text-[11px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)", fontWeight: 500 }}>
              em R$ · {ativos} empresa{ativos !== 1 ? "s" : ""}
            </div>
          </header>

          <div className="px-7 lg:px-9 py-9">
            {loading ? (
              <div className="text-[12px] text-center py-8" style={{ color: "var(--muted-foreground)" }}>Carregando...</div>
            ) : clientes.length === 0 ? (
              <div className="text-[12px] text-center py-8" style={{ color: "var(--muted-foreground)" }}>Nenhum cliente cadastrado.</div>
            ) : (
              <div className="flex gap-8 items-end" style={{ height: 260 }}>
                {clientes.map((c) => {
                  const height = (c.receita / maxReceita) * 100;
                  return (
                    <div key={c.id} className="flex flex-col items-stretch gap-4 h-full justify-end" style={{ flex: 1 }}>
                      <div className="aurora-serif text-center" style={{ fontSize: 20, fontWeight: 300, color: c.receita > 0 ? "var(--green)" : "var(--muted-foreground)", letterSpacing: "-0.5px", lineHeight: 1 }}>
                        {brl(c.receita).replace(",00", "")}
                      </div>
                      <div className="w-full flex items-end justify-center" style={{ flex: 1 }}>
                        <div className="w-full transition-all" style={{ height: `${Math.max(height, 2)}%`, background: c.receita > 0 ? "linear-gradient(180deg, var(--green), var(--green2))" : "var(--line)", minHeight: 12 }} />
                      </div>
                      <div className="text-[12px] text-center" style={{ color: "var(--foreground)", fontWeight: 500, lineHeight: 1.3 }}>
                        {c.name}
                      </div>
                      <div className="flex justify-center">
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Tabela de clientes */}
        <section style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}>
          <header className="flex items-end justify-between flex-wrap gap-4 px-7 lg:px-9 py-6" style={{ borderBottom: "1px solid var(--line)" }}>
            <div>
              <div className="text-[11px] uppercase mb-2" style={{ letterSpacing: "2.5px", color: "var(--sage)", fontWeight: 600 }}>
                Carteira · Detalhe
              </div>
              <h2 className="aurora-serif" style={{ fontSize: 28, fontWeight: 300, letterSpacing: "-0.8px", lineHeight: 1.1 }}>
                Status dos{" "}
                <em className="italic" style={{ color: "var(--green)" }}>fechamentos</em>
              </h2>
            </div>
            <Link
              to={"/admin/clientes" as never}
              className="focus-ring text-[11px] uppercase inline-flex items-center gap-2"
              style={{ letterSpacing: "2px", color: "var(--foreground)", border: "1px solid var(--foreground)", padding: "10px 18px", fontWeight: 500 }}
            >
              Ver todos →
            </Link>
          </header>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FAFAF8" }}>
                {["Cliente", "Bancos", "Saldo", "Pendentes", "Status"].map((h) => (
                  <th key={h} className="text-left px-7 lg:px-9 py-4 text-[11px] uppercase" style={{ fontWeight: 600, letterSpacing: "2px", color: "var(--muted-foreground)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-7 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>Carregando...</td>
                </tr>
              )}
              {!loading && clientes.map((c, idx) => (
                <tr
                  key={c.id}
                  style={{ borderTop: "1px solid var(--line)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(74,103,65,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-7 lg:px-9 py-5">
                    <div className="text-[14px]" style={{ fontWeight: 500, color: "var(--foreground)" }}>{c.name}</div>
                  </td>
                  <td className="px-7 lg:px-9 py-5 text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                    {c.banks.join(" · ") || "—"}
                  </td>
                  <td className="px-7 lg:px-9 py-5 aurora-serif" style={{ fontSize: 20, fontWeight: 300, color: c.saldo >= 0 ? "var(--navy)" : "var(--tan)", letterSpacing: "-0.3px" }}>
                    {brl(c.saldo)}
                  </td>
                  <td className="px-7 lg:px-9 py-5">
                    {c.pendentes > 0 ? (
                      <Link to={"/admin/pendentes" as never} className="text-[11px] uppercase px-3 py-1" style={{ background: "rgba(184,149,106,0.12)", color: "var(--tan)", letterSpacing: "1.5px", fontWeight: 600 }}>
                        {c.pendentes} pendente{c.pendentes !== 1 ? "s" : ""}
                      </Link>
                    ) : (
                      <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>—</span>
                    )}
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

function KpiCard({ icon, label, value, sub, tone, footer }: {
  icon: string; label: string; value: string; sub: string; tone: "sage" | "tan" | "navy"; footer?: string;
}) {
  const color = tone === "sage" ? "var(--green)" : tone === "tan" ? "var(--tan)" : "var(--navy)";
  const bg = tone === "sage" ? "rgba(143,166,136,0.10)" : tone === "tan" ? "rgba(184,149,106,0.12)" : "rgba(27,57,77,0.10)";
  return (
    <article className="p-7 flex flex-col gap-4" style={{ background: "#FFFFFF", border: "1px solid var(--line)", borderTop: `3px solid ${color}` }}>
      <header className="flex items-start justify-between gap-4">
        <div className="text-[12px] uppercase" style={{ letterSpacing: "2.5px", color: "var(--foreground)", fontWeight: 600, lineHeight: 1.4 }}>{label}</div>
        <div aria-hidden className="inline-flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: bg, color, fontSize: 18 }}>{icon}</div>
      </header>
      <div className="aurora-serif" style={{ fontSize: 64, fontWeight: 300, color, lineHeight: 1, letterSpacing: "-2px" }}>{value}</div>
      <div className="text-[13px]" style={{ color: "var(--foreground)", lineHeight: 1.5 }}>{sub}</div>
      {footer && (
        <div className="mt-2 pt-4 text-[11px]" style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--line)", lineHeight: 1.5 }}>{footer}</div>
      )}
    </article>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Fechado" ? { bg: "rgba(74,103,65,0.10)", color: "var(--green)" }
    : status === "Pendente" ? { bg: "rgba(184,149,106,0.15)", color: "var(--tan)" }
    : { bg: "rgba(27,57,77,0.10)", color: "var(--navy)" };
  return (
    <span className="inline-flex items-center gap-2 text-[11px] uppercase" style={{ letterSpacing: "1.5px", fontWeight: 600, background: tone.bg, color: tone.color, padding: "5px 12px" }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: tone.color }} />
      {status}
    </span>
  );
}
