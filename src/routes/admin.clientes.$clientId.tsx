import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { StatusBadge } from "./admin.index";
import { brl, formatDatePtBR, monthOptions, monthRangeDates } from "@/lib/utils";
import { computeHealthLevel, healthMargemPct } from "@/lib/healthScore";
import { HealthAlertCard } from "@/components/HealthAlertCard";
import { supabase } from "@/lib/supabase";
import { computeDRE, DRE_EBITDA_PIVOT, type CatInfo, type DREData } from "@/lib/dre";

export const Route = createFileRoute("/admin/clientes/$clientId")({
  component: ClientePage,
  head: () => ({ meta: [{ title: "Cliente · Aurora" }] }),
});

interface ClientDetail {
  id: string;
  name: string;
  owner_name: string;
  cnpj: string | null;
  status: string;
  last_upload_at: string | null;
  created_at: string;
  segment: string | null;
  monthly_closing_day: number | null;
  client_banks: { bank_name: string }[];
}

interface Tx {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string | null;
  status: string;
  is_recurring: boolean;
}

interface UploadHistory {
  id: string;
  period: string;
  bank_name: string;
  tx_classified: number;
  tx_pending: number;
  status: string;
  created_at: string;
}

const PERIODS = monthOptions(12);

type ActiveTab = "lancamentos" | "importacoes" | "painel";

function ClientePage() {
  const { clientId } = Route.useParams();

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [tx, setTx] = useState<Tx[]>([]);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadHistory[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("lancamentos");
  const [catMap, setCatMap] = useState<Map<string, CatInfo>>(new Map());
  const [catMapLoaded, setCatMapLoaded] = useState(false);

  useEffect(() => {
    supabase()
      .from("clients")
      .select("*, client_banks(bank_name)")
      .eq("id", clientId)
      .single()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setClient(data as ClientDetail);
        setLoading(false);
      });
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    supabase()
      .from("uploads")
      .select("id, period, bank_name, tx_classified, tx_pending, status, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUploads((data ?? []) as UploadHistory[]);
        setUploadsLoading(false);
      });
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    const { start, end } = monthRangeDates(period);
    setTxLoading(true);
    supabase()
      .from("transactions")
      .select("id, date, description, amount, category, status, is_recurring")
      .eq("client_id", clientId)
      .in("status", ["approved", "pending"])
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false })
      .then(({ data }) => {
        setTx((data ?? []) as Tx[]);
        setTxLoading(false);
      });
  }, [clientId, period]);

  useEffect(() => {
    if (activeTab !== "painel" || catMapLoaded || !clientId) return;
    supabase()
      .from("categories")
      .select("name, group_name, type")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .then(({ data }) => {
        const map = new Map<string, CatInfo>();
        for (const c of data ?? []) map.set(c.name, { group_name: c.group_name, type: c.type });
        setCatMap(map);
        setCatMapLoaded(true);
      });
  }, [activeTab, catMapLoaded, clientId]);

  const receita = useMemo(
    () => tx.filter((t) => t.status === "approved" && t.amount > 0).reduce((s, t) => s + t.amount, 0),
    [tx]
  );
  const despesas = useMemo(
    () => tx.filter((t) => t.status === "approved" && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    [tx]
  );
  const saldo = receita - despesas;
  const pendentes = useMemo(() => tx.filter((t) => t.status === "pending").length, [tx]);

  const health = useMemo(
    () => computeHealthLevel(receita, despesas, client?.segment ?? null),
    [receita, despesas, client]
  );
  const margem = useMemo(() => healthMargemPct(receita, despesas), [receita, despesas]);

  const dre = useMemo<DREData>(
    () => computeDRE(tx.filter((t) => t.status === "approved"), catMap),
    [tx, catMap]
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="px-8 py-16 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
          Carregando cliente...
        </div>
      </AdminLayout>
    );
  }

  if (error || !client) {
    return (
      <AdminLayout>
        <div className="px-8 py-16 text-center text-[13px]" style={{ color: "var(--tan)" }}>
          {error ?? "Cliente não encontrado."}
        </div>
      </AdminLayout>
    );
  }

  const banks = client.client_banks.map((b) => b.bank_name);

  return (
    <AdminLayout>
      <PageHeader
        cap="Plano de contas"
        title={client.name}
        emphasis=""
        description={`${client.owner_name}${client.cnpj ? " · " + client.cnpj : ""}`}
        right={
          <div className="flex gap-2 flex-wrap">
            <Link
              to={"/admin/importar" as never}
              className="inline-flex items-center gap-2 px-5 py-3 text-[10px] uppercase transition-opacity hover:opacity-80"
              style={{ background: "var(--green)", color: "#fff", letterSpacing: "2.5px", fontWeight: 500 }}
            >
              + Importar extrato
            </Link>
            <Link
              to={"/admin/dfc" as never}
              search={{ clientId } as never}
              className="inline-flex items-center gap-2 px-5 py-3 text-[10px] uppercase transition-opacity hover:opacity-80"
              style={{ border: "1px solid var(--line)", color: "var(--foreground)", letterSpacing: "2px", fontWeight: 500 }}
            >
              Ver DFC →
            </Link>
          </div>
        }
      />

      <div className="px-8 lg:px-12 pb-12 flex flex-col gap-8">

        {/* Cabeçalho do cliente */}
        <div className="aurora-card flex flex-wrap gap-6 items-start">
          <div className="flex-1 min-w-[150px]">
            <div className="aurora-cap mb-1">Status</div>
            <StatusBadge status={client.status} />
          </div>
          <div className="flex-1 min-w-[150px]">
            <div className="aurora-cap mb-1">Bancos</div>
            <div className="text-[13px]">{banks.join(" · ") || "—"}</div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <div className="aurora-cap mb-1">Último extrato</div>
            <div className="text-[13px]">{formatDatePtBR(client.last_upload_at)}</div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <div className="aurora-cap mb-1">Cliente desde</div>
            <div className="text-[13px]">{formatDatePtBR(client.created_at)}</div>
          </div>
          {client.segment && (
            <div className="flex-1 min-w-[150px]">
              <div className="aurora-cap mb-1">Segmento</div>
              <div className="text-[13px]">{client.segment}</div>
            </div>
          )}
          {client.monthly_closing_day != null && (
            <div className="flex-1 min-w-[150px]">
              <div className="aurora-cap mb-2">Fechamento mensal</div>
              <div className="flex items-center gap-2.5">
                <div style={{ width: 40, height: 40, border: "1px solid var(--green)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(74,103,65,0.06)" }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "var(--green)", fontFamily: "serif" }}>
                    {client.monthly_closing_day}
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                  de cada<br />mês
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Alerta de saúde financeira */}
        <HealthAlertCard health={health} margem={margem} segment={client.segment} period={period} />

        {/* Abas */}
        <div style={{ borderBottom: "2px solid var(--line)", marginBottom: -8 }}>
          <div className="flex">
            {(["lancamentos", "importacoes", "painel"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === "lancamentos" ? "Lançamentos" : tab === "importacoes" ? "Importações" : "Painel DFC / DRE";
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-6 py-3 text-[11px] uppercase transition-colors relative"
                  style={{
                    letterSpacing: "2px",
                    fontWeight: 600,
                    color: isActive ? "var(--green)" : "var(--muted-foreground)",
                    background: "transparent",
                  }}
                >
                  {label}
                  {tab === "importacoes" && uploads.length > 0 && (
                    <span
                      className="ml-2 text-[10px]"
                      style={{ background: "rgba(74,103,65,0.12)", color: "var(--green)", padding: "1px 6px", borderRadius: 999 }}
                    >
                      {uploads.length}
                    </span>
                  )}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: -2,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: "var(--green)",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Aba: Lançamentos ─────────────────────────────────────────────────── */}
        {activeTab === "lancamentos" && (
          <>
            {/* Seletor de período */}
            <div className="flex items-center gap-3">
              <span className="aurora-cap">Período</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-white px-3 py-2 text-[12px]"
                style={{ border: "1px solid var(--line)" }}
              >
                {PERIODS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* KPIs do período */}
            <div className="grid md:grid-cols-4 gap-5">
              <KpiCard label="Receitas"  value={brl(receita)}         tone="green" />
              <KpiCard label="Despesas"  value={brl(despesas)}        tone="tan"   />
              <KpiCard label="Resultado" value={brl(saldo)}           tone={saldo >= 0 ? "green" : "tan"} />
              <KpiCard label="Pendentes" value={String(pendentes)}    tone="navy"  />
            </div>

            {/* Tabela de lançamentos */}
            <div className="aurora-card p-0 overflow-hidden">
              <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)", background: "var(--linen)" }}>
                <div className="aurora-cap mb-0.5">Lançamentos</div>
                <div className="aurora-serif text-[20px]">
                  {period}{" "}
                  <em className="italic" style={{ color: "var(--green)" }}>
                    · {tx.length} {tx.length === 1 ? "registro" : "registros"}
                  </em>
                </div>
              </div>

              {txLoading ? (
                <div className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                  Carregando lançamentos...
                </div>
              ) : tx.length === 0 ? (
                <div className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                  Nenhum lançamento em {period}. Tente selecionar outro mês no seletor acima.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "#FAFAF8" }}>
                      {["Data", "Descrição", "Categoria", "Valor", "Status"].map((h) => (
                        <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500, borderBottom: "1px solid var(--line)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tx.map((t, idx) => (
                      <tr key={t.id} style={{ background: idx % 2 === 0 ? "#fff" : "#FAFAF8", borderTop: "1px solid var(--line)" }}>
                        <td className="px-6 py-3 text-[12px]">{formatDatePtBR(t.date)}</td>
                        <td className="px-6 py-3 text-[12px]" style={{ maxWidth: 280 }}>{t.description}</td>
                        <td className="px-6 py-3 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          {t.category ?? <span style={{ opacity: 0.4 }}>—</span>}
                        </td>
                        <td
                          className="px-6 py-3 aurora-value"
                          style={{ fontSize: 14, color: t.amount >= 0 ? "var(--green)" : "var(--navy)" }}
                        >
                          {t.amount >= 0 ? "+" : ""}
                          {brl(t.amount)}
                        </td>
                        <td className="px-6 py-3">
                          <TxStatusBadge status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── Aba: Painel DFC / DRE ────────────────────────────────────────────── */}
        {activeTab === "painel" && (
          <>
            {/* Seletor de período */}
            <div className="flex items-center gap-3">
              <span className="aurora-cap">Período</span>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-white px-3 py-2 text-[12px]" style={{ border: "1px solid var(--line)" }}>
                {PERIODS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* DFC */}
            <div>
              <div className="aurora-cap mb-4">Demonstrativo de Fluxo de Caixa</div>
              <div className="grid md:grid-cols-4 gap-5">
                <KpiCard label="Receitas"    value={brl(receita)}   tone="green" />
                <KpiCard label="Despesas"    value={brl(despesas)}  tone="tan" />
                <KpiCard label="Resultado"   value={brl(saldo)}     tone={saldo >= 0 ? "green" : "tan"} />
                <KpiCard label="Lançamentos" value={String(tx.filter((t) => t.status === "approved").length)} tone="navy" />
              </div>
            </div>

            {/* DRE */}
            <div>
              <div className="aurora-cap mb-4">DRE — Demonstrativo do Resultado do Exercício</div>
              {!catMapLoaded ? (
                <div className="aurora-card px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                  Carregando categorias…
                </div>
              ) : dre.groups.length === 0 ? (
                <div className="aurora-card px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                  Nenhum lançamento classificado no período.
                </div>
              ) : (
                <div className="aurora-card p-0 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: "#F8F6F1" }}>
                        <th className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500, borderBottom: "1px solid var(--line)" }}>Conta</th>
                        <th className="text-right px-6 py-3 aurora-cap" style={{ fontWeight: 500, borderBottom: "1px solid var(--line)" }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dre.groups.flatMap((g) => {
                        const isReceita = g.name === "Receita";
                        const color = isReceita ? "var(--green)" : "var(--tan)";
                        const rows = [
                          <tr key={g.name + "_hdr"} style={{ background: "#F8F6F1" }}>
                            <td colSpan={2} className="px-6 py-2 aurora-cap" style={{ fontWeight: 600, color: "var(--muted-foreground)" }}>
                              {!isReceita && "(−) "}{g.name}
                            </td>
                          </tr>,
                          ...g.lines.map((l) => (
                            <tr key={g.name + "_" + l.cat} style={{ borderTop: "1px solid var(--line)" }}>
                              <td className="px-6 py-2.5 text-[12px]" style={{ paddingLeft: 32, color: "var(--muted-foreground)" }}>{l.cat}</td>
                              <td className="px-6 py-2.5 text-right text-[13px]" style={{ color }}>{isReceita ? brl(l.total) : `(${brl(l.total)})`}</td>
                            </tr>
                          )),
                          <tr key={g.name + "_sub"} style={{ borderTop: "1px solid var(--line)" }}>
                            <td className="px-6 py-3 text-[12px]" style={{ fontWeight: 600 }}>Subtotal {g.name}</td>
                            <td className="px-6 py-3 text-right" style={{ fontSize: 14, fontWeight: 700, color }}>{isReceita ? brl(g.subtotal) : `(${brl(g.subtotal)})`}</td>
                          </tr>,
                        ];
                        if (g.name === DRE_EBITDA_PIVOT) {
                          rows.push(
                            <tr key="ebitda" style={{ background: "rgba(143,166,136,0.12)", borderTop: "2px solid var(--green)" }}>
                              <td className="px-6 py-3 text-[13px]" style={{ fontWeight: 700 }}>= Resultado Operacional (EBITDA)</td>
                              <td className="px-6 py-3 text-right" style={{ fontSize: 15, fontWeight: 700, color: dre.ebitda >= 0 ? "var(--green)" : "var(--tan)" }}>{brl(dre.ebitda)}</td>
                            </tr>
                          );
                        }
                        return rows;
                      })}
                      <tr style={{ background: "var(--navy)" }}>
                        <td className="px-6 py-4 text-[13px]" style={{ fontWeight: 700, color: "#fff" }}>= Resultado Líquido do Período</td>
                        <td className="px-6 py-4 text-right" style={{ fontSize: 16, fontWeight: 700, color: dre.resultadoLiquido >= 0 ? "#A8D5A2" : "#F4A57E" }}>{brl(dre.resultadoLiquido)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Aba: Importações ─────────────────────────────────────────────────── */}
        {activeTab === "importacoes" && (
          <div className="aurora-card p-0 overflow-hidden">
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)", background: "var(--linen)" }}>
              <div className="aurora-cap mb-0.5">Histórico de importações</div>
              <div className="aurora-serif text-[20px]">
                Histórico{" "}
                <em className="italic" style={{ color: "var(--green)" }}>
                  de importações
                </em>
              </div>
            </div>

            {uploadsLoading ? (
              <div className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                Carregando histórico…
              </div>
            ) : uploads.length === 0 ? (
              <div className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                Nenhuma importação registrada.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#FAFAF8" }}>
                    {["Período", "Banco", "Classificados", "Pendentes", "Cobertura", "Status", "Importado em"].map((h) => (
                      <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500, borderBottom: "1px solid var(--line)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u, idx) => {
                    const classified = u.tx_classified ?? 0;
                    const pending    = u.tx_pending    ?? 0;
                    const total      = classified + pending;
                    const pct        = total > 0 ? Math.round((classified / total) * 100) : 0;
                    return (
                      <tr key={u.id} style={{ background: idx % 2 === 0 ? "#fff" : "#FAFAF8", borderTop: "1px solid var(--line)" }}>
                        <td className="px-6 py-3 text-[13px]" style={{ fontWeight: 600 }}>{u.period}</td>
                        <td className="px-6 py-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>{u.bank_name}</td>
                        <td className="px-6 py-3 aurora-value" style={{ fontSize: 14, color: "var(--green)" }}>{classified}</td>
                        <td className="px-6 py-3 aurora-value" style={{ fontSize: 14, color: pending > 0 ? "var(--tan)" : "var(--muted-foreground)" }}>{pending}</td>
                        <td className="px-6 py-3">
                          <span
                            className="text-[11px] uppercase px-2.5 py-1"
                            style={{
                              background: pct >= 80 ? "rgba(74,103,65,0.10)" : pct >= 50 ? "rgba(184,149,106,0.12)" : "rgba(192,57,43,0.08)",
                              color:      pct >= 80 ? "var(--green)"          : pct >= 50 ? "var(--tan)"            : "#C0392B",
                              letterSpacing: "1.5px",
                              fontWeight: 600,
                            }}
                          >
                            {pct}%
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <UploadStatusBadge status={u.status} />
                        </td>
                        <td className="px-6 py-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                          {formatDatePtBR(u.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function KpiCard({ label, value, tone }: { label: string; value: string; tone: "green" | "tan" | "navy" }) {
  const color = tone === "green" ? "var(--green)" : tone === "tan" ? "var(--tan)" : "var(--navy)";
  return (
    <div className="aurora-card">
      <div className="aurora-cap mb-3">{label}</div>
      <div className="aurora-value" style={{ fontSize: 32, color }}>{value}</div>
    </div>
  );
}

function TxStatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved"
      ? { bg: "rgba(74,103,65,0.10)",   color: "var(--green)", label: "Aprovado" }
      : status === "pending"
      ? { bg: "rgba(184,149,106,0.15)", color: "var(--tan)",   label: "Pendente" }
      : { bg: "rgba(27,57,77,0.10)",    color: "var(--navy)",  label: status     };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] uppercase"
      style={{ letterSpacing: "1.5px", fontWeight: 600, background: tone.bg, color: tone.color, padding: "4px 10px" }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 999, background: tone.color }} />
      {tone.label}
    </span>
  );
}

function UploadStatusBadge({ status }: { status: string }) {
  const tone =
    status === "done"
      ? { bg: "rgba(74,103,65,0.10)",   color: "var(--green)", label: "Concluído"   }
      : status === "processing"
      ? { bg: "rgba(27,57,77,0.10)",    color: "var(--navy)",  label: "Processando" }
      : { bg: "rgba(184,149,106,0.15)", color: "var(--tan)",   label: status         };
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] uppercase"
      style={{ letterSpacing: "1.5px", fontWeight: 600, background: tone.bg, color: tone.color, padding: "4px 10px" }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 999, background: tone.color }} />
      {tone.label}
    </span>
  );
}
