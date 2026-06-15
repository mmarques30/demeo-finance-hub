import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/regras")({
  component: RegrasPage,
  head: () => ({ meta: [{ title: "Regras · Aurora" }] }),
});

interface ClientOption {
  id: string;
  name: string;
}

interface Rule {
  id: string;
  pattern: string;
  category: string;
  is_recurring: boolean;
  is_active: boolean;
  hits: number;
  source: string;
  last_used: string;
}

function RegrasPage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState("");
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "pending">("all");

  useEffect(() => {
    supabase
      .from("clients")
      .select("id, name")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setClients(data);
          setClientId(data[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!clientId) return;
    loadRules();
  }, [clientId]);

  async function loadRules() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("classification_rules")
      .select("id, pattern, category, is_recurring, is_active, hits, source, last_used")
      .eq("client_id", clientId)
      .order("hits", { ascending: false });
    if (err) setError(err.message);
    else setRules(data ?? []);
    setLoading(false);
  }

  async function toggleActive(rule: Rule) {
    const { error: err } = await supabase
      .from("classification_rules")
      .update({ is_active: !rule.is_active })
      .eq("id", rule.id);
    if (err) setError(err.message);
    else setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
    );
  }

  async function deleteRule(rule: Rule) {
    const { error: err } = await supabase
      .from("classification_rules")
      .delete()
      .eq("id", rule.id);
    if (err) setError(err.message);
    else setRules((prev) => prev.filter((r) => r.id !== rule.id));
  }

  const filtered = rules.filter((r) => {
    if (filter === "active") return r.is_active;
    if (filter === "pending") return !r.is_active;
    return true;
  });

  const activeCount = rules.filter((r) => r.is_active).length;
  const pendingCount = rules.filter((r) => !r.is_active).length;

  const sourceLabel = (source: string) => {
    if (source === "manual") return "Manual";
    if (source === "approval") return "Aprendida";
    if (source === "ai") return "IA";
    return source;
  };

  const sourceColor = (source: string) => {
    if (source === "manual") return "var(--green)";
    if (source === "approval") return "var(--navy)";
    return "var(--muted-foreground)";
  };

  function formatDate(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  return (
    <AdminLayout>
      <PageHeader
        cap="Motor de classificação · M02"
        title="Regras"
        emphasis="automáticas"
        description="Regras criadas manualmente ficam ativas imediatamente. Regras aprendidas por aprovação ativam após 2 confirmações."
      />

      <div className="px-8 lg:px-12 pb-12 grid gap-6">

        {/* Seletor de cliente + filtros */}
        <div className="aurora-card flex flex-wrap items-end gap-4">
          <div>
            <div className="aurora-cap mb-2">Cliente</div>
            <select
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setError(null); }}
              className="bg-white px-3 py-2.5 text-[13px]"
              style={{ border: "1px solid var(--line)" }}
            >
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Contadores + filtro */}
          <div className="flex gap-2 ml-auto">
            {(["all", "active", "pending"] as const).map((f) => {
              const label =
                f === "all" ? `Todas (${rules.length})` :
                f === "active" ? `Ativas (${activeCount})` :
                `Aguardando (${pendingCount})`;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="text-[10px] uppercase px-3 py-2 transition-colors"
                  style={{
                    letterSpacing: "1.5px",
                    background: filter === f ? "var(--green)" : "transparent",
                    color: filter === f ? "#fff" : "var(--muted-foreground)",
                    border: "1px solid var(--line)",
                    fontWeight: filter === f ? 500 : 400,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="aurora-card flex items-center gap-3"
            style={{ background: "rgba(184,149,106,0.1)", borderLeft: "3px solid var(--tan)" }}>
            <span style={{ color: "var(--tan)", fontSize: 18 }}>!</span>
            <div className="text-[13px]">{error}</div>
          </div>
        )}

        {/* Tabela */}
        {loading ? (
          <div className="aurora-card flex items-center gap-4">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--green)", borderTopColor: "transparent" }} />
            <div className="text-[13px]">Carregando regras...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="aurora-card text-center py-16">
            <div className="aurora-serif text-[24px]" style={{ color: "var(--green)" }}>✓</div>
            <div className="aurora-serif text-[20px] mt-2">
              {rules.length === 0 ? "Nenhuma regra ainda" : "Nenhuma regra neste filtro"}
            </div>
            <div className="text-[12px] mt-2" style={{ color: "var(--muted-foreground)" }}>
              {rules.length === 0
                ? "As regras são criadas automaticamente ao aprovar lançamentos."
                : "Tente outro filtro."}
            </div>
          </div>
        ) : (
          <div className="aurora-card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--linen)" }}>
                  {["Padrão", "Categoria", "Origem", "Usos", "Último uso", "Status", "Ação"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 aurora-cap" style={{ fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((rule, i) => (
                  <tr key={rule.id}
                    style={{
                      background: i % 2 === 0 ? "#fff" : "#FAFAF8",
                      borderTop: "1px solid var(--line)",
                      opacity: rule.is_active ? 1 : 0.5,
                    }}>
                    <td className="px-5 py-3">
                      <code className="text-[12px]"
                        style={{ background: "var(--linen)", padding: "2px 6px" }}>
                        {rule.pattern}
                      </code>
                      {rule.is_recurring && (
                        <span className="ml-2 text-[11px]" style={{ color: "var(--sage)" }} title="Recorrente">↻</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[12px]">{rule.category}</td>
                    <td className="px-5 py-3">
                      <span className="aurora-cap text-[10px] px-2 py-0.5"
                        style={{ color: sourceColor(rule.source), border: `1px solid ${sourceColor(rule.source)}`, opacity: 0.8 }}>
                        {sourceLabel(rule.source)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                      {rule.hits}
                      {!rule.is_active && rule.source === "approval" && (
                        <span className="ml-1 text-[10px]" style={{ color: "var(--tan)" }}>
                          ({2 - rule.hits} para ativar)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                      {formatDate(rule.last_used)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="aurora-cap text-[10px] px-2 py-0.5 rounded"
                        style={{
                          background: rule.is_active ? "rgba(74,103,65,0.12)" : "rgba(184,149,106,0.15)",
                          color: rule.is_active ? "var(--green)" : "var(--tan)",
                        }}>
                        {rule.is_active ? "Ativa" : "Aguardando"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[11px]">
                      <button
                        onClick={() => toggleActive(rule)}
                        className="aurora-link mr-3"
                        style={{ color: rule.is_active ? "var(--tan)" : "var(--green)" }}
                      >
                        {rule.is_active ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => deleteRule(rule)}
                        className="aurora-link"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
