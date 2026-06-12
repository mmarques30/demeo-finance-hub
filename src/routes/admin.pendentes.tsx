import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/pendentes")({
  component: PendentesPage,
  head: () => ({ meta: [{ title: "Pendentes · Aurora" }] }),
});

const CATEGORIAS = [
  "Receita · Vendas",
  "Receita · Serviços",
  "Receita · Convênios",
  "Receita · Honorários",
  "Receita · Delivery",
  "Despesa Fixa · Aluguel",
  "Despesa Fixa · Salários",
  "Despesa Fixa · Utilidades",
  "Despesa Fixa · Contabilidade",
  "Despesa Variável · Insumos",
  "Despesa Variável · Marketing",
  "Despesa Variável · Manutenção",
  "Investimento · Equipamentos",
  "Investimento · Educação",
  "Transferência",
  "Outros",
];

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

interface ClientInfo {
  id: string;
  name: string;
}

function PendentesPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<PendingTx[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, ClientInfo>>({});
  const [cats, setCats] = useState<Record<string, string>>({});
  const [recurring, setRecurring] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null); // client_id being saved
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    const { data: txData, error: txErr } = await supabase
      .from("transactions")
      .select("id, client_id, date, description, raw_description, amount, category, status")
      .eq("status", "pending")
      .order("date", { ascending: false });

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

    // Carrega nomes dos clientes únicos
    const clientIds = [...new Set(txList.map((t) => t.client_id))];
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name")
        .in("id", clientIds);
      const map: Record<string, ClientInfo> = {};
      for (const c of clients ?? []) map[c.id] = c;
      setClientMap(map);
    }

    setLoading(false);
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
        const { error: updateErr } = await supabase
          .from("transactions")
          .update({
            category,
            status: "approved",
            is_recurring: isRecurring,
          })
          .eq("id", tx.id);

        if (updateErr) throw new Error(`Transação ${tx.id}: ${updateErr.message}`);

        // 2. Se "salvar como regra", insere em classification_rules
        if (isRecurring) {
          const pattern = tx.description
            .split(" ")
            .slice(0, 3)
            .join(" ")
            .toUpperCase();
          await supabase.from("classification_rules").upsert(
            {
              client_id: tx.client_id,
              pattern,
              category,
              is_recurring: true,
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
                    {["Data", "Descrição", "Valor", "Categoria", "Recorrente"].map((h) => (
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
                      <td className="px-6 py-3 text-[12px]">{t.date}</td>
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
                          {CATEGORIAS.map((c) => (
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
