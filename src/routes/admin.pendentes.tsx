import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl, buildPattern, formatDatePtBR } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/pendentes")({
  component: PendentesPage,
  head: () => ({ meta: [{ title: "Pendentes · Aurora" }] }),
});

interface PendingTx {
  id: string;
  client_id: string;
  date: string;
  description: string;
  raw_description: string;
  amount: number;
  category: string | null;
  status: string;
}

interface InstallmentState {
  enabled: boolean;
  number: number;
  total: number;
}

interface ClientInfo {
  id: string;
  name: string;
}

const PAGE_SIZE = 50;

function PendentesPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<PendingTx[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, ClientInfo>>({});
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string[]>>({});
  const [cats, setCats] = useState<Record<string, string>>({});
  const [recurring, setRecurring] = useState<Record<string, boolean>>({});
  const [installments, setInstallments] = useState<Record<string, InstallmentState>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadData(page);
  }, [page]);

  async function loadData(p: number) {
    setLoading(true);
    setError(null);
    setCats({});
    setRecurring({});
    setInstallments({});

    const [{ data: txData, error: txErr }, { count }] = await Promise.all([
      supabase()
        .from("transactions")
        .select("id, client_id, date, description, raw_description, amount, category, status")
        .eq("status", "pending")
        .order("date", { ascending: false })
        .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1),
      supabase()
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    setTotalCount(count ?? 0);

    if (txErr) {
      setError(`Erro ao carregar transações: ${txErr.message}`);
      setLoading(false);
      return;
    }

    const txList = (txData ?? []) as PendingTx[];
    setTransactions(txList);

    // Pré-popula categorias com sugestões já classificadas
    const initCats: Record<string, string> = {};
    for (const tx of txList) {
      if (tx.category) initCats[tx.id] = tx.category;
    }
    setCats(initCats);

    // Carrega nomes dos clientes únicos + categorias por cliente
    const clientIds = [...new Set(txList.map((t) => t.client_id))];
    if (clientIds.length > 0) {
      const [{ data: clientsData }, { data: catsData }] = await Promise.all([
        supabase().from("clients").select("id, name").in("id", clientIds),
        supabase()
          .from("categories")
          .select("client_id, name")
          .in("client_id", clientIds)
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      const map: Record<string, ClientInfo> = {};
      for (const c of clientsData ?? []) map[c.id] = c;
      setClientMap(map);

      const cmap: Record<string, string[]> = {};
      for (const cat of catsData ?? []) {
        (cmap[cat.client_id] ||= []).push(cat.name);
      }
      setCategoriesMap(cmap);
    }

    setLoading(false);
  }

  // UUID determinístico baseado em (client_id, padrão da descrição, total de parcelas).
  // Garante que a mesma compra parcelada importada em meses diferentes receba o mesmo grupo.
  async function deterministicGroupId(clientId: string, description: string, installmentTotal: number): Promise<string> {
    const input = `${clientId}:${buildPattern(description)}:${installmentTotal}`;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    const b = new Uint8Array(buf);
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant
    const h = Array.from(b.slice(0, 16)).map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  async function saveClient(clientId: string) {
    const clientTxs = transactions.filter((t) => t.client_id === clientId);
    setSaving(clientId);
    setError(null);

    try {
      for (const tx of clientTxs) {
        const category = cats[tx.id];
        if (!category) continue; // não toca no que não foi preenchido

        const isRecurring = !!recurring[tx.id];

        // 1. Atualiza a transação
        const inst = installments[tx.id];
        const installmentFields =
          inst?.enabled && inst.total > 0 && inst.number > 0
            ? {
                installment_number: inst.number,
                installment_total: inst.total,
                installment_group_id: await deterministicGroupId(tx.client_id, tx.description, inst.total),
              }
            : {};

        const { error: updateErr } = await supabase()
          .from("transactions")
          .update({
            category,
            status: "approved",
            is_recurring: isRecurring,
            ...installmentFields,
          })
          .eq("id", tx.id);

        if (updateErr) throw new Error(`Transação ${tx.id}: ${updateErr.message}`);

        // 2. Se "salvar como regra", insere em classification_rules como regra ativa imediata
        if (isRecurring) {
          const pattern = buildPattern(tx.description);
          await supabase().from("classification_rules").upsert(
            {
              client_id: tx.client_id,
              pattern,
              category,
              is_recurring: true,
              hits: 2,
              source: "manual",
              is_active: true,
            },
            { onConflict: "client_id,pattern" }
          );
        }
      }

      // Remove transações salvas da lista local
      const savedIds = new Set(
        clientTxs.filter((t) => !!cats[t.id]).map((t) => t.id)
      );
      setTransactions((prev) => prev.filter((t) => !savedIds.has(t.id)));
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(null);
    }
  }

  // Agrupa por cliente
  const grouped = transactions.reduce<Record<string, PendingTx[]>>((acc, t) => {
    (acc[t.client_id] ||= []).push(t);
    return acc;
  }, {});

  const clientCount = Object.keys(grouped).length;

  return (
    <AdminLayout>
      <PageHeader
        cap="Revisão manual"
        title="Lançamentos"
        emphasis="pendentes"
        description={
          loading
            ? "Carregando..."
            : `${transactions.length} lançamentos aguardando classificação em ${clientCount} clientes.`
        }
      />

      <div className="px-8 lg:px-12 pb-12 flex flex-col gap-7">
        {error && (
          <div
            className="aurora-card flex items-center gap-3"
            style={{ background: "rgba(184,149,106,0.1)", borderLeft: "3px solid var(--tan)" }}
          >
            <span style={{ color: "var(--tan)", fontSize: 18 }}>!</span>
            <div className="text-[13px]">{error}</div>
          </div>
        )}

        {loading && (
          <div className="aurora-card flex items-center gap-4">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--green)", borderTopColor: "transparent" }}
            />
            <div className="text-[13px]">Carregando lançamentos pendentes...</div>
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="aurora-card text-center py-16">
            <div className="aurora-serif text-[24px]" style={{ color: "var(--green)" }}>✓</div>
            <div className="aurora-serif text-[20px] mt-2">Tudo em dia</div>
            <div className="text-[12px] mt-2" style={{ color: "var(--muted-foreground)" }}>
              Nenhum lançamento pendente de classificação.
            </div>
          </div>
        )}

        {totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between">
            <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              Página {page + 1} de {Math.ceil(totalCount / PAGE_SIZE)} · {totalCount} lançamentos pendentes no total
            </div>
            <div className="text-[11px] uppercase" style={{ color: "var(--tan)", letterSpacing: "1.5px" }}>
              Salve antes de navegar
            </div>
          </div>
        )}

        {Object.entries(grouped).map(([cid, items]) => {
          const client = clientMap[cid];
          const isSaving = saving === cid;
          return (
            <div key={cid} className="aurora-card p-0 overflow-hidden">
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ background: "var(--linen)", borderBottom: "1px solid var(--line)" }}
              >
                <div>
                  <div className="aurora-cap mb-1">Cliente</div>
                  <div className="aurora-serif text-[20px]">
                    {client?.name ?? cid}{" "}
                    <em className="italic" style={{ color: "var(--green)" }}>
                      · {items.length} pendentes
                    </em>
                  </div>
                </div>
                <button
                  onClick={() => saveClient(cid)}
                  disabled={isSaving}
                  className="text-[10px] uppercase px-4 py-2 transition-opacity disabled:opacity-50"
                  style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
                >
                  {isSaving ? "Salvando..." : "Salvar classificação"}
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    {["Data", "Descrição", "Valor", "Categoria", "Recorrente", "Parcelamento"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 aurora-cap"
                        style={{ fontWeight: 500, borderBottom: "1px solid var(--line)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((t, idx) => (
                    <tr key={t.id} style={{ background: idx % 2 === 0 ? "#fff" : "#FAFAF8" }}>
                      <td className="px-6 py-3 text-[12px]">{formatDatePtBR(t.date)}</td>
                      <td className="px-6 py-3 text-[12px]" title={t.raw_description}>
                        {t.description}
                      </td>
                      <td
                        className="px-6 py-3 aurora-serif text-[14px]"
                        style={{ color: t.amount >= 0 ? "var(--green)" : "var(--navy)" }}
                      >
                        {t.amount >= 0 ? "+" : ""}
                        {brl(t.amount)}
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={cats[t.id] ?? ""}
                          onChange={(e) => setCats({ ...cats, [t.id]: e.target.value })}
                          className="bg-white px-2.5 py-1.5 text-[12px] w-full max-w-xs"
                          style={{ border: "1px solid var(--line)" }}
                        >
                          <option value="">Selecione...</option>
                          {(categoriesMap[cid] ?? []).map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <label
                          className="inline-flex items-center gap-2 cursor-pointer text-[11px]"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          <input
                            type="checkbox"
                            checked={!!recurring[t.id]}
                            onChange={(e) =>
                              setRecurring({ ...recurring, [t.id]: e.target.checked })
                            }
                          />
                          Salvar como regra
                        </label>
                      </td>
                      <td className="px-6 py-3">
                        {(() => {
                          const inst = installments[t.id] ?? { enabled: false, number: 1, total: 2 };
                          return (
                            <div className="flex flex-col gap-1.5">
                              <label className="inline-flex items-center gap-2 cursor-pointer text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                                <input
                                  type="checkbox"
                                  checked={inst.enabled}
                                  onChange={(e) =>
                                    setInstallments({ ...installments, [t.id]: { ...inst, enabled: e.target.checked } })
                                  }
                                />
                                Parcelamento
                              </label>
                              {inst.enabled && (
                                <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                                  <span>Parcela</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={inst.total}
                                    value={inst.number}
                                    onChange={(e) =>
                                      setInstallments({ ...installments, [t.id]: { ...inst, number: Math.max(1, Number(e.target.value)) } })
                                    }
                                    className="w-10 text-center text-[11px] px-1 py-0.5"
                                    style={{ border: "1px solid var(--line)" }}
                                  />
                                  <span>de</span>
                                  <input
                                    type="number"
                                    min={2}
                                    value={inst.total}
                                    onChange={(e) =>
                                      setInstallments({ ...installments, [t.id]: { ...inst, total: Math.max(2, Number(e.target.value)) } })
                                    }
                                    className="w-10 text-center text-[11px] px-1 py-0.5"
                                    style={{ border: "1px solid var(--line)" }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        {totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="text-[10px] uppercase px-4 py-2 transition-opacity disabled:opacity-40"
              style={{ border: "1px solid var(--line)", letterSpacing: "2px", color: "var(--muted-foreground)" }}
            >
              ← Anterior
            </button>
            <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              {page + 1} / {Math.ceil(totalCount / PAGE_SIZE)}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(Math.ceil(totalCount / PAGE_SIZE) - 1, p + 1))}
              disabled={page >= Math.ceil(totalCount / PAGE_SIZE) - 1 || loading}
              className="text-[10px] uppercase px-4 py-2 transition-opacity disabled:opacity-40"
              style={{ border: "1px solid var(--line)", letterSpacing: "2px", color: "var(--muted-foreground)" }}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
