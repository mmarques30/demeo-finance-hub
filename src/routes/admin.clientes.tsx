import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { StatusBadge } from "./admin.index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clientes")({
  component: ClientesPage,
  head: () => ({ meta: [{ title: "Clientes · Aurora" }] }),
});

// ─── tipos ────────────────────────────────────────────────────────────────────

interface ClientBank {
  bank_name: string;
}

interface ClientRow {
  id: string;
  name: string;
  owner_name: string;
  cnpj: string | null;
  status: string;
  last_upload_at: string | null;
  created_at: string;
  client_banks: ClientBank[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const BANCOS_SUGERIDOS = [
  "Itaú",
  "Bradesco",
  "Santander",
  "Banco do Brasil",
  "Caixa",
  "Inter",
  "Nubank",
  "Sicoob",
  "BTG",
  "XP",
];

const FILTROS = ["Todos", "Em andamento", "Pendente", "Fechado"] as const;
type Filtro = typeof FILTROS[number];

// ─── página principal ─────────────────────────────────────────────────────────

function ClientesPage() {
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [novoOpen, setNovoOpen] = useState(false);

  // ── query ──────────────────────────────────────────────────────────────────
  const { data: clientes = [], isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<ClientRow[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, client_banks(bank_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClientRow[];
    },
  });

  const lista = clientes.filter((c) => {
    if (filtro === "Todos") return true;
    return c.status === filtro;
  });

  return (
    <AdminLayout>
      <PageHeader
        cap="Carteira · 2026"
        title="Meus clientes"
        description="Gerencie todas as empresas sob a sua gestão financeira."
        right={
          <button
            onClick={() => setNovoOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 text-[10px] uppercase transition-opacity hover:opacity-80"
            style={{ background: "var(--green)", color: "#fff", letterSpacing: "2.5px", fontWeight: 500 }}
          >
            + Novo cliente
          </button>
        }
      />

      <div className="px-8 lg:px-12 pb-12 pt-8">
        {/* Filtros */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className="text-[10px] uppercase px-4 py-2 transition-colors"
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

        {/* Tabela */}
        <div className="aurora-card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--linen)" }}>
                {["Empresa", "Responsável", "Bancos", "Status", "Último extrato", ""].map((h) => (
                  <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    Carregando clientes…
                  </td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--tan)" }}>
                    Erro ao carregar clientes. Verifique sua conexão com o Supabase.
                  </td>
                </tr>
              )}
              {!isLoading && !error && lista.map((c, idx) => (
                <tr
                  key={c.id}
                  style={{
                    background: idx % 2 === 0 ? "#fff" : "#FAFAF8",
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="text-[13px]" style={{ fontWeight: 500 }}>{c.name}</div>
                    {c.cnpj && (
                      <div className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)", letterSpacing: "0.5px" }}>
                        {c.cnpj}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    {c.owner_name}
                  </td>
                  <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    {c.client_banks.map((b) => b.bank_name).join(", ") || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    {formatDate(c.last_upload_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={"/admin/dfc" as never}
                      search={{ clientId: c.id } as never}
                      className="aurora-link"
                    >
                      Ver Painel →
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && !error && lista.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center" style={{ color: "var(--muted-foreground)" }}>
                    <div className="text-[24px] mb-2" style={{ opacity: 0.3 }}>◷</div>
                    <div className="text-[12px]">
                      {filtro === "Todos"
                        ? "Nenhum cliente cadastrado ainda. Clique em \"+ Novo cliente\" para começar."
                        : `Nenhum cliente com status "${filtro}".`}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Contador */}
        {!isLoading && clientes.length > 0 && (
          <div className="mt-4 text-[10px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>
            {lista.length} de {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
          </div>
        )}
      </div>

      {/* Modal de novo cliente */}
      {novoOpen && <NovoClienteModal onClose={() => setNovoOpen(false)} />}
    </AdminLayout>
  );
}

// ─── modal novo cliente ───────────────────────────────────────────────────────

function NovoClienteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();

  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [bancos, setBancos] = useState<string[]>([]);
  const [bancosInput, setBancosInput] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Cria o cliente
      const { data: client, error: clientErr } = await supabase
        .from("clients")
        .insert({ name: nome.trim(), owner_name: responsavel.trim(), cnpj: cnpj.trim() || null })
        .select("id")
        .single();

      if (clientErr || !client) throw clientErr ?? new Error("Erro ao criar cliente");

      // 2. Insere os bancos (se houver)
      if (bancos.length > 0) {
        const { error: banksErr } = await supabase
          .from("client_banks")
          .insert(bancos.map((b) => ({ client_id: client.id, bank_name: b })));
        if (banksErr) throw banksErr;
      }

      return client;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente cadastrado com sucesso.");
      onClose();
    },
    onError: (err) => {
      toast.error("Erro ao cadastrar cliente: " + (err as Error).message);
    },
  });

  function addBanco(banco: string) {
    const b = banco.trim();
    if (!b || bancos.includes(b)) return;
    setBancos((prev) => [...prev, b]);
    setBancosInput("");
  }

  function removeBanco(b: string) {
    setBancos((prev) => prev.filter((x) => x !== b));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !responsavel.trim()) return;
    mutation.mutate();
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(28,45,69,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Painel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col overflow-y-auto"
        style={{
          width: "min(100vw, 480px)",
          background: "#fff",
          boxShadow: "-8px 0 48px rgba(28,45,69,0.18)",
          animation: "aurora-slide-right 0.3s cubic-bezier(.22,.61,.36,1) both",
        }}
      >
        <style>{`
          @keyframes aurora-slide-right {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-6"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div>
            <div className="aurora-cap mb-1" style={{ color: "var(--sage)" }}>Novo cadastro</div>
            <h2 className="aurora-serif" style={{ fontSize: 22, fontWeight: 300, letterSpacing: "-0.5px" }}>
              Adicionar cliente
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center"
            style={{
              border: "1px solid var(--line)",
              color: "var(--muted-foreground)",
              fontSize: 16,
              borderRadius: 8,
            }}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-8 py-8 gap-6">
          {/* Nome da empresa */}
          <Field label="Nome da empresa" required>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Padaria São Jorge"
              required
              style={inputStyle}
            />
          </Field>

          {/* Responsável */}
          <Field label="Responsável / Sócio" required>
            <input
              type="text"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Ex: Marcos Pereira"
              required
              style={inputStyle}
            />
          </Field>

          {/* CNPJ */}
          <Field label="CNPJ" hint="opcional">
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0001-00"
              style={inputStyle}
            />
          </Field>

          {/* Bancos */}
          <Field label="Bancos" hint="adicione um ou mais">
            <div className="flex gap-2">
              <input
                type="text"
                value={bancosInput}
                onChange={(e) => setBancosInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addBanco(bancosInput); }
                }}
                placeholder="Digite ou selecione"
                list="bancos-list"
                style={{ ...inputStyle, flex: 1 }}
              />
              <datalist id="bancos-list">
                {BANCOS_SUGERIDOS.map((b) => <option key={b} value={b} />)}
              </datalist>
              <button
                type="button"
                onClick={() => addBanco(bancosInput)}
                className="px-4 text-[11px] uppercase"
                style={{
                  background: "var(--linen)",
                  border: "1px solid var(--line)",
                  color: "var(--foreground)",
                  letterSpacing: "1.5px",
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                + Add
              </button>
            </div>

            {/* Sugestões rápidas */}
            <div className="flex gap-1.5 flex-wrap mt-2">
              {BANCOS_SUGERIDOS.filter((b) => !bancos.includes(b)).slice(0, 6).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => addBanco(b)}
                  className="text-[10px] px-2.5 py-1 transition-colors hover:opacity-70"
                  style={{
                    border: "1px dashed var(--line)",
                    color: "var(--muted-foreground)",
                    letterSpacing: "0.5px",
                  }}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Tags adicionadas */}
            {bancos.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {bancos.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1"
                    style={{
                      background: "rgba(143,166,136,0.12)",
                      color: "var(--green)",
                      fontWeight: 500,
                    }}
                  >
                    {b}
                    <button
                      type="button"
                      onClick={() => removeBanco(b)}
                      style={{ fontSize: 12, opacity: 0.6, lineHeight: 1 }}
                      aria-label={`Remover ${b}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          {/* Ações */}
          <div className="mt-auto flex gap-3 pt-4" style={{ borderTop: "1px solid var(--line)" }}>
            <button
              type="submit"
              disabled={mutation.isPending || !nome.trim() || !responsavel.trim()}
              className="flex-1 py-3.5 text-[11px] uppercase transition-opacity"
              style={{
                background: "var(--green)",
                color: "#fff",
                letterSpacing: "2.5px",
                fontWeight: 500,
                opacity: mutation.isPending ? 0.6 : 1,
              }}
            >
              {mutation.isPending ? "Salvando…" : "Cadastrar cliente"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 text-[11px] uppercase"
              style={{
                border: "1px solid var(--line)",
                color: "var(--muted-foreground)",
                letterSpacing: "2px",
                fontWeight: 500,
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── componentes auxiliares ───────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  fontSize: 13,
  border: "1px solid var(--line)",
  background: "#FAFAF8",
  color: "var(--foreground)",
  outline: "none",
  lineHeight: 1.4,
};

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label className="aurora-cap" style={{ fontWeight: 600 }}>
          {label}
          {required && <span style={{ color: "var(--tan)", marginLeft: 2 }}>*</span>}
        </label>
        {hint && (
          <span className="text-[9px] uppercase" style={{ color: "var(--muted-foreground)", letterSpacing: "1.5px" }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
