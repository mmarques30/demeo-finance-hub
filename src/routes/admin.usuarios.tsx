import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { supabase, FUNCTIONS_URL } from "@/lib/supabase";
import { authHeaders } from "@/lib/auth";

export const Route = createFileRoute("/admin/usuarios")({
  component: UsuariosPage,
  head: () => ({ meta: [{ title: "Usuários do Portal · Aurora" }] }),
});

interface PortalUser {
  user_id: string;
  client_id: string;
  email: string | null;
  display_name: string | null;
  portal_role: "owner" | "financeiro";
  clients: { name: string } | null;
}

interface PortalFeatures { dfc: boolean; projecao: boolean; download: boolean; }
const DEFAULT_FEATURES: PortalFeatures = { dfc: true, projecao: false, download: false };

interface ClientFeatureRow { id: string; name: string; portal_features: PortalFeatures | null; }

type FilterRole = "todos" | "owner" | "financeiro";

function UsuariosPage() {
  const qc = useQueryClient();

  const [filterClient, setFilterClient] = useState("");
  const [filterRole, setFilterRole] = useState<FilterRole>("todos");
  const [showInvite, setShowInvite] = useState(false);
  const [savingFeature, setSavingFeature] = useState<string | null>(null);

  // Lista todos os usuários do portal
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "portalUsers"],
    queryFn: async () => {
      const { data } = await supabase()
        .from("user_client_mapping")
        .select("user_id, client_id, email, display_name, portal_role, clients(name)")
        .order("display_name");
      return (data ?? []).map((row: any) => ({
        ...row,
        clients: Array.isArray(row.clients) ? (row.clients[0] ?? null) : row.clients,
      })) as PortalUser[];
    },
  });

  // Lista de clientes para o formulário de convite e para os toggles de features
  const { data: clients = [], refetch: refetchClients } = useQuery({
    queryKey: ["admin", "clientsList"],
    queryFn: async () => {
      const { data } = await supabase()
        .from("clients")
        .select("id, name, portal_features")
        .is("deleted_at", null)
        .order("name");
      return (data ?? []) as ClientFeatureRow[];
    },
  });

  async function handleToggleFeature(clientId: string, key: keyof PortalFeatures, current: PortalFeatures) {
    setSavingFeature(`${clientId}-${key}`);
    const updated = { ...current, [key]: !current[key] };
    await supabase().from("clients").update({ portal_features: updated as any }).eq("id", clientId);
    await refetchClients();
    setSavingFeature(null);
  }

  // Atualizar role
  const updateRole = useMutation({
    mutationFn: async ({ userId, clientId, role }: { userId: string; clientId: string; role: "owner" | "financeiro" }) => {
      await supabase()
        .from("user_client_mapping")
        .update({ portal_role: role })
        .eq("user_id", userId)
        .eq("client_id", clientId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "portalUsers"] }),
  });

  // Revogar acesso
  const revokeAccess = useMutation({
    mutationFn: async ({ userId, clientId }: { userId: string; clientId: string }) => {
      await supabase()
        .from("user_client_mapping")
        .delete()
        .eq("user_id", userId)
        .eq("client_id", clientId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "portalUsers"] }),
  });

  const filtered = users.filter((u) => {
    if (filterClient && !u.clients?.name.toLowerCase().includes(filterClient.toLowerCase())) return false;
    if (filterRole !== "todos" && u.portal_role !== filterRole) return false;
    return true;
  });

  const ownerCount = users.filter((u) => u.portal_role === "owner").length;
  const financeiroCount = users.filter((u) => u.portal_role === "financeiro").length;

  return (
    <AdminLayout>
      <PageHeader
        title="Usuários do Portal"
        right={
          <button
            onClick={() => setShowInvite(true)}
            className="text-[10px] uppercase px-5 py-2.5"
            style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
          >
            + Convidar usuário
          </button>
        }
      />

      <div className="px-6 lg:px-10 pb-10 flex flex-col gap-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total de usuários", value: users.length },
            { label: "Proprietários", value: ownerCount },
            { label: "Acesso Financeiro", value: financeiroCount },
          ].map(({ label, value }) => (
            <div key={label} className="aurora-card">
              <div className="aurora-cap mb-2">{label}</div>
              <div className="aurora-value" style={{ fontSize: 36, color: "var(--navy)" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Filtrar por cliente…"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-4 py-2.5 text-[13px] md:w-72"
            style={{ border: "1px solid var(--line)", background: "#fff", outline: "none" }}
          />
          <div className="flex gap-2">
            {(["todos", "owner", "financeiro"] as FilterRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className="text-[9px] uppercase px-4 py-2 transition-all"
                style={{
                  letterSpacing: "1.5px",
                  border: "1px solid",
                  borderColor: filterRole === r ? "var(--green)" : "var(--line)",
                  color: filterRole === r ? "var(--green)" : "var(--muted-foreground)",
                  background: filterRole === r ? "rgba(74,103,65,0.05)" : "transparent",
                  fontWeight: filterRole === r ? 600 : 400,
                }}
              >
                {r === "todos" ? "Todos" : r === "owner" ? "Proprietários" : "Financeiro"}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="aurora-card p-0 overflow-hidden">
          {isLoading ? (
            <div className="px-6 py-12 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              {users.length === 0 ? "Nenhum usuário de portal criado ainda." : "Nenhum resultado para os filtros aplicados."}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "#FAFAF8" }}>
                  {["Nome", "E-mail", "Cliente", "Perfil", "Ações"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 aurora-cap"
                      style={{ fontWeight: 500, fontSize: 9, borderBottom: "1px solid var(--line)", letterSpacing: "2px" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={`${u.user_id}-${u.client_id}`} style={{ borderTop: "1px solid var(--line)" }}>
                    <td className="px-5 py-3 text-[13px]" style={{ fontWeight: 500 }}>
                      {u.display_name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                      {u.email ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[12px]">
                      {u.clients?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        {(["owner", "financeiro"] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              if (u.portal_role !== r)
                                updateRole.mutate({ userId: u.user_id, clientId: u.client_id, role: r });
                            }}
                            className="text-[9px] uppercase px-2.5 py-1 transition-all"
                            style={{
                              letterSpacing: "1px",
                              border: "1px solid",
                              borderColor: u.portal_role === r ? "var(--green)" : "var(--line)",
                              color: u.portal_role === r ? "var(--green)" : "var(--muted-foreground)",
                              background: u.portal_role === r ? "rgba(74,103,65,0.06)" : "transparent",
                              fontWeight: u.portal_role === r ? 600 : 400,
                              cursor: u.portal_role === r ? "default" : "pointer",
                            }}
                          >
                            {r === "owner" ? "Proprietário" : "Financeiro"}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Revogar acesso de ${u.display_name ?? u.email} ao portal?`)) {
                            revokeAccess.mutate({ userId: u.user_id, clientId: u.client_id });
                          }
                        }}
                        className="text-[9px] uppercase px-3 py-1.5 transition-opacity hover:opacity-70"
                        style={{ border: "1px solid var(--line)", color: "var(--muted-foreground)", letterSpacing: "1.5px" }}
                      >
                        Revogar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Funcionalidades por cliente */}
        <div className="aurora-card p-0 overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)", background: "var(--linen)" }}>
            <div className="aurora-cap mb-0.5">Acesso ao Portal</div>
            <div className="aurora-serif text-[20px]">
              Funcionalidades por <em className="italic" style={{ color: "var(--green)" }}>cliente</em>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FAFAF8" }}>
                {["Cliente", "DFC / DRE", "Projeção", "Download PDF"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 aurora-cap" style={{ fontWeight: 500, fontSize: 9, borderBottom: "1px solid var(--line)", letterSpacing: "2px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const f: PortalFeatures = (c.portal_features as PortalFeatures | null) ?? DEFAULT_FEATURES;
                return (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td className="px-5 py-3 text-[13px]" style={{ fontWeight: 500 }}>{c.name}</td>
                    {(["dfc", "projecao", "download"] as (keyof PortalFeatures)[]).map((key) => {
                      const busy = savingFeature === `${c.id}-${key}`;
                      return (
                        <td key={key} className="px-5 py-3">
                          <button
                            onClick={() => handleToggleFeature(c.id, key, f)}
                            disabled={!!savingFeature}
                            className="flex items-center gap-2 transition-opacity disabled:opacity-40"
                          >
                            <div
                              className="w-9 h-5 rounded-full flex items-center flex-shrink-0 transition-colors"
                              style={{ background: f[key] ? "var(--green)" : "var(--line)", padding: "2px" }}
                            >
                              <div
                                className="w-4 h-4 rounded-full bg-white transition-transform"
                                style={{ transform: f[key] ? "translateX(16px)" : "translateX(0)" }}
                              />
                            </div>
                            <span className="text-[10px] uppercase" style={{ letterSpacing: "1.5px", color: f[key] ? "var(--green)" : "var(--muted-foreground)" }}>
                              {busy ? "…" : f[key] ? "On" : "Off"}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de convite */}
      {showInvite && (
        <InviteModal
          clients={clients}
          onClose={() => setShowInvite(false)}
          onSuccess={() => {
            setShowInvite(false);
            qc.invalidateQueries({ queryKey: ["admin", "portalUsers"] });
          }}
        />
      )}
    </AdminLayout>
  );
}

// ─── Modal de convite ──────────────────────────────────────────────────────────

function InviteModal({
  clients,
  onClose,
  onSuccess,
}: {
  clients: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"owner" | "financeiro">("owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !email || !name) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
      const res = await fetch(`${FUNCTIONS_URL}/create-client-user`, {
        method: "POST",
        headers,
        body: JSON.stringify({ client_id: clientId, email, display_name: name, portal_role: role }),
      });
      let json: Record<string, unknown> = {};
      try { json = await res.json(); } catch { /* body não era JSON */ }
      if (!res.ok) {
        setError((json.error as string) ?? `Erro HTTP ${res.status}. Tente novamente.`);
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(28,45,69,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white p-8"
        style={{ border: "1px solid var(--line)", boxShadow: "0 24px 64px -16px rgba(28,45,69,0.22)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aurora-cap mb-1">Novo acesso</div>
        <h2 className="aurora-serif text-[24px] mb-6">
          Convidar <em className="italic" style={{ color: "var(--green)" }}>usuário</em>
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="aurora-cap block mb-1.5">Cliente</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-[13px]"
              style={{ border: "1px solid var(--line)", background: "#fff", outline: "none" }}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="aurora-cap block mb-1.5">Nome completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maria Silva"
              required
              className="w-full px-4 py-2.5 text-[13px]"
              style={{ border: "1px solid var(--line)", background: "#fff", outline: "none" }}
            />
          </div>

          <div>
            <label className="aurora-cap block mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria@empresa.com"
              required
              className="w-full px-4 py-2.5 text-[13px]"
              style={{ border: "1px solid var(--line)", background: "#fff", outline: "none" }}
            />
          </div>

          <div>
            <label className="aurora-cap block mb-2">Perfil de acesso</label>
            <div className="flex gap-3">
              {(["owner", "financeiro"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="flex-1 py-2.5 text-[9px] uppercase transition-all"
                  style={{
                    letterSpacing: "1.5px",
                    border: "1px solid",
                    borderColor: role === r ? "var(--green)" : "var(--line)",
                    color: role === r ? "var(--green)" : "var(--muted-foreground)",
                    background: role === r ? "rgba(74,103,65,0.06)" : "transparent",
                    fontWeight: role === r ? 600 : 400,
                  }}
                >
                  {r === "owner" ? "Proprietário" : "Financeiro"}
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-2" style={{ color: "var(--muted-foreground)" }}>
              {role === "owner"
                ? "Acesso completo: saldo, DFC, DRE, downloads."
                : "Acesso restrito: DFC e DRE. Sem saldo consolidado nem downloads."}
            </p>
          </div>

          {error && (
            <div className="text-[12px] px-3 py-2.5" style={{ background: "rgba(184,149,106,0.10)", color: "var(--tan)", border: "1px solid var(--tan)" }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !clientId || !email || !name}
              className="flex-1 text-[10px] uppercase py-3 disabled:opacity-50"
              style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
            >
              {loading ? "Enviando convite…" : "Enviar convite →"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-[10px] uppercase"
              style={{ border: "1px solid var(--line)", color: "var(--muted-foreground)", letterSpacing: "2px" }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
