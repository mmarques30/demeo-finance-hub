import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl, buildPattern, formatDatePtBR } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { EditTransactionModal } from "@/components/EditTransactionModal";

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
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const dateFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  }, []);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editTx, setEditTx] = useState<PendingTx | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PendingTx | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData(page);
  }, [page, showAll]);

  async function loadData(p: number) {
    setLoading(true);
    setError(null);
    setCats({});
    setRecurring({});
    setInstallments({});

    let txQuery = supabase()
      .from("transactions")
      .select("id, client_id, date, description, raw_description, amount, category, status")
      .eq("status", "pending");
    let countQuery = supabase()
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    if (!showAll) {
      txQuery = txQuery.gte("date", dateFrom);
      countQuery = countQuery.gte("date", dateFrom);
    }

    const [{ data: txData, error: txErr }, { count }] = await Promise.all([
      txQuery.order("date", { ascending: false }).range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1),
      countQuery,
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

  // UUID determinístico por evento de compra: (client_id, padrão, total de parcelas, YYYY-MM da tx).
  // Incluir yearMonth garante que duas compras parceladas distintas do mesmo fornecedor e valor
  // recebam group IDs diferentes, evitando mesclagem incorreta na projeção financeira.
  async function deterministicGroupId(clientId: string, description: string, installmentTotal: number, date: string): Promise<string> {
    const yearMonth = date.slice(0, 7);
    const input = `${clientId}:${buildPattern(description)}:${installmentTotal}:${yearMonth}`;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    const b = new Uint8Array(buf);
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant
    const h = Array.from(b.slice(0, 16)).map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  async function saveClient(clientId: string, ids?: Set<string>) {
    const clientTxs = transactions.filter(
      (t) => t.client_id === clientId && !!cats[t.id] && (ids ? ids.has(t.id) : true)
    );
    setSaving(clientId);
    setError(null);

    try {
      // Monta todos os payloads em paralelo (deterministicGroupId é async por tx)
      const payloads = await Promise.all(
        clientTxs.map(async (tx) => {
          const category = cats[tx.id];
          const isRecurring = !!recurring[tx.id];
          const inst = installments[tx.id];
          const installmentFields =
            inst?.enabled && inst.total > 0 && inst.number > 0 && inst.number <= inst.total
              ? {
                  installment_number: inst.number,
                  installment_total: inst.total,
                  installment_group_id: await deterministicGroupId(tx.client_id, tx.description, inst.total, tx.date),
                }
              : {};
          return { tx, category, isRecurring, installmentFields };
        })
      );

      // 1. Aprova todas as transações atomicamente (BEGIN/COMMIT único via RPC)
      const txUpdates = payloads.map(({ tx, category, isRecurring, installmentFields }) => ({
        id: tx.id,
        category,
        is_recurring: isRecurring,
        ...installmentFields,
      }));
      const { error: approveErr } = await supabase().rpc("approve_transactions_batch", { p_updates: txUpdates });
      if (approveErr) throw new Error(`Aprovação: ${approveErr.message}`);

      // 2. Upsert de todas as regras recorrentes em um único roundtrip
      const rulesToUpsert = payloads
        .filter(({ isRecurring }) => isRecurring)
        .map(({ tx, category }) => ({
          client_id: tx.client_id,
          pattern: buildPattern(tx.description),
          category,
          is_recurring: true,
          hits: 2,
          source: "manual",
          is_active: true,
        }));

      if (rulesToUpsert.length > 0) {
        const { error: rulesErr } = await supabase()
          .from("classification_rules")
          .upsert(rulesToUpsert, { onConflict: "client_id,pattern" });
        if (rulesErr) throw new Error(`Regras: ${rulesErr.message}`);
      }

      // Remove transações salvas da lista local e das seleções
      const savedIds = new Set(clientTxs.map((t) => t.id));
      setTransactions((prev) => prev.filter((t) => !savedIds.has(t.id)));
      setSelected((prev) => { const next = { ...prev }; savedIds.forEach((id) => delete next[id]); return next; });
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

  type Priority = "alta" | "media" | "baixa";
  const PRIORITY_DOT: Record<Priority, string> = {
    alta: "#C0392B",
    media: "var(--tan)",
    baixa: "var(--green)",
  };

  const sortedEntries = Object.entries(grouped).sort(
    ([, a], [, b]) => sortOrder === "desc" ? b.length - a.length : a.length - b.length
  );

  const priorityMap: Record<string, Priority> = (() => {
    const sorted = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length);
    const N = sorted.length;
    const res: Record<string, Priority> = {};
    sorted.forEach((cid, idx) => {
      if (idx < Math.ceil(N / 3)) res[cid] = "alta";
      else if (idx >= N - Math.ceil(N / 3)) res[cid] = "baixa";
      else res[cid] = "media";
    });
    return res;
  })();

  async function handleDeleteTx(tx: PendingTx) {
    setDeleting(true);
    const { error: err } = await supabase().from("transactions").delete().eq("id", tx.id);
    setDeleting(false);
    if (err) {
      setError(`Erro ao excluir: ${err.message}`);
    } else {
      setDeleteTarget(null);
      const remaining = transactions.filter((t) => t.id !== tx.id);
      setTransactions(remaining);
      setTotalCount((c) => c - 1);
      // Se a página ficou vazia e não é a primeira, volta uma página
      if (remaining.length === 0 && page > 0) setPage((p) => p - 1);
    }
  }

  function toggleExpanded(cid: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  }

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

      <div className="aurora-page">
        {error && (
          <div
            className="aurora-card flex items-center gap-3"
            style={{ background: "rgba(109,146,166,0.1)", borderLeft: "3px solid var(--tan)" }}
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

        {/* Filtro de data + ordenação */}
        {!loading && (
          <div className="flex items-center justify-between">
            <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              {showAll ? (
                <>
                  Histórico completo ·{" "}
                  <button
                    onClick={() => { setPage(0); setShowAll(false); }}
                    style={{ color: "var(--navy)", textDecoration: "underline" }}
                  >
                    Filtrar últimos 90 dias
                  </button>
                </>
              ) : (
                <>
                  Últimos 90 dias ·{" "}
                  <button
                    onClick={() => { setPage(0); setShowAll(true); }}
                    style={{ color: "var(--navy)", textDecoration: "underline" }}
                  >
                    Ver histórico completo
                  </button>
                </>
              )}
            </div>
            {clientCount > 1 && (
              <button
                onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
                className="text-[10px] uppercase px-3 py-1.5 transition-colors"
                style={{ border: "1px solid var(--line)", color: "var(--muted-foreground)", letterSpacing: "1.5px", fontWeight: 500, borderRadius: "999px" }}
              >
                {sortOrder === "desc" ? "↓ Mais pendentes" : "↑ Menos pendentes"}
              </button>
            )}
          </div>
        )}

        {sortedEntries.map(([cid, items]) => {
          const client = clientMap[cid];
          const isSaving = saving === cid;
          const isExpanded = expanded.has(cid);
          const priority = priorityMap[cid] ?? "media";
          return (
            <div key={cid} className="aurora-card p-0 overflow-hidden">
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer"
                style={{ background: "var(--offwhite)", borderBottom: isExpanded ? "1px solid var(--line)" : "none" }}
                onClick={() => toggleExpanded(cid)}
              >
                <div className="flex items-center gap-3">
                  <span
                    title={priority}
                    style={{ width: 8, height: 8, borderRadius: 999, background: PRIORITY_DOT[priority], flexShrink: 0, display: "inline-block" }}
                  />
                  <div>
                    <div className="aurora-cap mb-1">Cliente</div>
                    <div className="aurora-serif text-[20px]">
                      {client?.name ?? cid}{" "}
                      <em className="italic" style={{ color: "var(--green)" }}>
                        · {items.length} pendentes
                      </em>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {(() => {
                    const selIds = new Set(items.filter((t) => selected[t.id]).map((t) => t.id));
                    const selCount = selIds.size;
                    return selCount > 0 ? (
                      <button
                        onClick={() => saveClient(cid, selIds)}
                        disabled={isSaving}
                        className="text-[10px] uppercase px-4 py-2 transition-opacity disabled:opacity-50"
                        style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 , borderRadius: 999 }}
                      >
                        {isSaving ? "Salvando..." : `Aprovar selecionados (${selCount})`}
                      </button>
                    ) : (
                      <button
                        onClick={() => saveClient(cid)}
                        disabled={isSaving}
                        className="text-[10px] uppercase px-4 py-2 transition-opacity disabled:opacity-50"
                        style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 , borderRadius: 999 }}
                      >
                        {isSaving ? "Salvando..." : "Aprovar todos classificados"}
                      </button>
                    );
                  })()}
                  <span
                    style={{ fontSize: 9, color: "var(--muted-foreground)", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}
                  >
                    ▶
                  </span>
                </div>
              </div>
              {isExpanded && (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-3" style={{ borderBottom: "1px solid var(--line)", width: 40 }}>
                      <input
                        type="checkbox"
                        checked={items.length > 0 && items.every((t) => selected[t.id])}
                        onChange={(e) => {
                          const next = { ...selected };
                          items.forEach((t) => { next[t.id] = e.target.checked; });
                          setSelected(next);
                        }}
                        title="Selecionar todos"
                      />
                    </th>
                    {["Data", "Descrição", "Valor", "Categoria", "Recorrente", "Parcelamento", ""].map((h) => (
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
                    <tr key={t.id} style={{ background: selected[t.id] ? "rgba(74,103,65,0.05)" : idx % 2 === 0 ? "#fff" : "#FAFBFA" }}>
                      <td className="px-4 py-3 text-center" style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          checked={!!selected[t.id]}
                          onChange={(e) => setSelected((prev) => ({ ...prev, [t.id]: e.target.checked }))}
                        />
                      </td>
                      <td className="px-6 py-3 text-[12px]">{formatDatePtBR(t.date)}</td>
                      <td className="px-6 py-3 text-[12px]" title={t.raw_description}>
                        {t.description}
                      </td>
                      <td
                        className="px-6 py-3 aurora-value text-[14px]"
                        style={{ color: t.amount >= 0 ? "var(--green)" : "var(--expense)" }}
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
                                      setInstallments({ ...installments, [t.id]: { ...inst, number: Math.min(inst.total, Math.max(1, Number(e.target.value))) } })
                                    }
                                    className="w-10 text-center text-[11px] px-1 py-0.5"
                                    style={{ border: "1px solid var(--line)" }}
                                  />
                                  <span>de</span>
                                  <input
                                    type="number"
                                    min={2}
                                    value={inst.total}
                                    onChange={(e) => {
                                      const newTotal = Math.max(2, Number(e.target.value));
                                      setInstallments({ ...installments, [t.id]: { ...inst, total: newTotal, number: Math.min(inst.number, newTotal) } });
                                    }}
                                    className="w-10 text-center text-[11px] px-1 py-0.5"
                                    style={{ border: "1px solid var(--line)" }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditTx(t)}
                          className="aurora-link text-[11px] mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="text-[11px] transition-opacity hover:opacity-70"
                          style={{ color: "var(--tan)" }}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          );
        })}
        {totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="text-[10px] uppercase px-4 py-2 transition-opacity disabled:opacity-40"
              style={{ border: "1px solid var(--line)", letterSpacing: "2px", color: "var(--muted-foreground)" , borderRadius: 12 }}
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
              style={{ border: "1px solid var(--line)", letterSpacing: "2px", color: "var(--muted-foreground)" , borderRadius: 12 }}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>

      {editTx && (
        <EditTransactionModal
          tx={editTx}
          categories={categoriesMap[editTx.client_id] ?? []}
          cap="Lançamento pendente"
          onClose={() => setEditTx(null)}
          onSave={(id, updates) => {
            setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
            setCats((prev) => ({ ...prev, [id]: updates.category ?? "" }));
            setEditTx(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeletePendingTxModal
          tx={deleteTarget}
          deleting={deleting}
          onConfirm={() => handleDeleteTx(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminLayout>
  );
}


function DeletePendingTxModal({
  tx, deleting, onConfirm, onCancel,
}: {
  tx: PendingTx;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="aurora-modal w-full max-w-sm bg-white overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div className="px-6 py-5 flex items-start justify-between" style={{ background: "rgba(109,146,166,0.12)", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div className="aurora-cap mb-0.5" style={{ color: "var(--tan)" }}>Atenção</div>
            <div className="aurora-serif text-[20px]">Excluir lançamento</div>
          </div>
          <button onClick={onCancel} className="text-[18px] leading-none mt-1 opacity-50 hover:opacity-100">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="text-[13px]" style={{ lineHeight: 1.6 }}>
            <span style={{ fontWeight: 500 }}>{tx.description}</span>
            <br />
            <span style={{ color: "var(--muted-foreground)" }}>{formatDatePtBR(tx.date)} · {brl(tx.amount)}</span>
          </div>
          <div className="text-[12px] px-4 py-3"
            style={{ background: "rgba(109,146,166,0.10)", borderLeft: "3px solid var(--tan)", color: "var(--foreground)", lineHeight: 1.6 }}>
            Este lançamento será removido permanentemente. Essa ação não pode ser desfeita.
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onCancel} disabled={deleting}
              className="text-[10px] uppercase px-5 py-3 transition-opacity disabled:opacity-40"
              style={{ border: "1px solid var(--line)", letterSpacing: "2px", fontWeight: 500 , borderRadius: 12 }}>
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} disabled={deleting}
              className="text-[10px] uppercase px-6 py-3 transition-opacity disabled:opacity-50"
              style={{ background: "var(--tan)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}>
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
