import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl, formatDatePtBR } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/contas")({
  component: ContasPage,
  head: () => ({ meta: [{ title: "Contas · Aurora" }] }),
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payable {
  id: string;
  client_id: string;
  type: "pagar" | "receber";
  description: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  category: string | null;
  notes: string | null;
}

interface ClientOption {
  id: string;
  name: string;
}

type FilterView = "pendentes" | "pagos" | "todos";

interface FormState {
  type: string;
  client_id: string;
  description: string;
  amount: string;
  due_date: string;
  category: string;
  notes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function displayStatus(p: Payable): "pago" | "vencido" | "pendente" {
  if (p.paid_at) return "pago";
  if (p.due_date < todayISO()) return "vencido";
  return "pendente";
}

function StatusBadge({ status }: { status: "pago" | "vencido" | "pendente" }) {
  const cfg = {
    pago: { bg: "rgba(74,124,89,0.12)", color: "var(--green)", label: "Pago" },
    vencido: { bg: "rgba(176,96,64,0.12)", color: "#B06040", label: "Vencido" },
    pendente: { bg: "var(--linen)", color: "var(--muted-foreground)", label: "Pendente" },
  }[status];
  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] uppercase"
      style={{ background: cfg.bg, color: cfg.color, letterSpacing: "1px", fontWeight: 600 }}
    >
      {cfg.label}
    </span>
  );
}

// ─── PayableSection ───────────────────────────────────────────────────────────

function PayableSection({
  title,
  items,
  accentColor,
  marking,
  view,
  clients,
  onMarkPaid,
  onUndoPaid,
  onDelete,
}: {
  title: string;
  items: Payable[];
  accentColor: string;
  marking: string | null;
  view: FilterView;
  clients: ClientOption[];
  onMarkPaid: (id: string) => void;
  onUndoPaid: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const subtotal = items.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="aurora-card p-0 overflow-hidden">
      {/* Section header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--linen)", borderBottom: "1px solid var(--line)" }}
      >
        <div>
          <div className="aurora-cap mb-1">
            {title}
          </div>
          <div className="aurora-serif text-[20px]" style={{ color: accentColor }}>
            {brl(subtotal)}
          </div>
        </div>
        <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
          {items.length} {items.length === 1 ? "lançamento" : "lançamentos"}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
          Nenhum lançamento {view === "pendentes" ? "pendente" : view === "pagos" ? "pago" : ""}.
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              {["Vencimento", "Descrição", "Cliente", "Categoria", "Valor", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 aurora-cap"
                  style={{ fontWeight: 500, borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((p, idx) => {
              const status = displayStatus(p);
              const isMarking = marking === p.id;
              return (
                <tr key={p.id} style={{ background: idx % 2 === 0 ? "#fff" : "#FAFAF8" }}>
                  <td
                    className="px-5 py-3 text-[12px]"
                    style={{ color: status === "vencido" ? "#B06040" : undefined, whiteSpace: "nowrap" }}
                  >
                    {formatDatePtBR(p.due_date)}
                    {status === "vencido" && (
                      <span className="ml-1.5 text-[10px]">⚠</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[12px] max-w-[200px] truncate" title={p.description}>
                    {p.description}
                    {p.notes && (
                      <div className="text-[10px] mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
                        {p.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[12px]">
                    {clientMap[p.client_id] ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    {p.category ?? "—"}
                  </td>
                  <td className="px-5 py-3 aurora-serif text-[14px]" style={{ color: accentColor, whiteSpace: "nowrap" }}>
                    {brl(p.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {status !== "pago" && (
                        <button
                          onClick={() => onMarkPaid(p.id)}
                          disabled={isMarking}
                          className="text-[10px] uppercase px-2.5 py-1 transition-opacity disabled:opacity-40"
                          style={{
                            background: "var(--green)",
                            color: "#fff",
                            letterSpacing: "1.5px",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isMarking ? "…" : "✓ Pago"}
                        </button>
                      )}
                      {status === "pago" && (
                        <button
                          onClick={() => onUndoPaid(p.id)}
                          disabled={isMarking}
                          className="text-[10px] uppercase px-2.5 py-1 transition-opacity disabled:opacity-40"
                          style={{
                            border: "1px solid var(--line)",
                            color: "var(--muted-foreground)",
                            letterSpacing: "1.5px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isMarking ? "…" : "Desfazer"}
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(p.id)}
                        className="text-[12px] transition-opacity hover:opacity-60"
                        style={{ color: "var(--muted-foreground)" }}
                        title="Excluir"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── NovoLancamentoModal ──────────────────────────────────────────────────────

function NovoLancamentoModal({
  clients,
  onClose,
  onSaved,
}: {
  clients: ClientOption[];
  onClose: () => void;
  onSaved: (p: Payable) => void;
}) {
  const [form, setForm] = useState<FormState>({
    type: "pagar",
    client_id: clients[0]?.id ?? "",
    description: "",
    amount: "",
    due_date: todayISO(),
    category: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount.replace(",", "."));
    if (!form.client_id) { setError("Selecione um cliente."); return; }
    if (!form.description.trim()) { setError("Informe a descrição."); return; }
    if (isNaN(amount) || amount <= 0) { setError("Valor inválido."); return; }
    if (!form.due_date) { setError("Informe o vencimento."); return; }

    setSaving(true);
    setError(null);

    const { data, error: err } = await supabase()
      .from("payables")
      .insert({
        type: form.type,
        client_id: form.client_id,
        description: form.description.trim(),
        amount,
        due_date: form.due_date,
        category: form.category.trim() || null,
        notes: form.notes.trim() || null,
      })
      .select("id, client_id, type, description, amount, due_date, paid_at, category, notes")
      .single();

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    onSaved(data as Payable);
  }

  const inputStyle = {
    border: "1px solid var(--line)",
    background: "#fff",
    padding: "6px 10px",
    fontSize: 13,
    width: "100%",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white flex flex-col"
        style={{
          width: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          borderTop: "3px solid var(--green)",
        }}
      >
        {/* Modal header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div>
            <div className="aurora-cap mb-0.5">Novo lançamento</div>
            <div className="aurora-serif text-[18px]">Conta a pagar ou receber</div>
          </div>
          <button
            onClick={onClose}
            className="text-[16px] opacity-40 hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div
              className="text-[12px] px-3 py-2"
              style={{ background: "rgba(176,96,64,0.1)", color: "#B06040", border: "1px solid rgba(176,96,64,0.2)" }}
            >
              {error}
            </div>
          )}

          {/* Tipo toggle */}
          <div>
            <div className="aurora-cap mb-2">Tipo</div>
            <div className="flex">
              {(["pagar", "receber"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  className="flex-1 py-2 text-[11px] uppercase transition-colors"
                  style={{
                    letterSpacing: "1.5px",
                    fontWeight: 600,
                    background: form.type === t
                      ? (t === "pagar" ? "var(--navy)" : "var(--green)")
                      : "var(--linen)",
                    color: form.type === t ? "#fff" : "var(--muted-foreground)",
                    border: "1px solid var(--line)",
                  }}
                >
                  {t === "pagar" ? "A Pagar" : "A Receber"}
                </button>
              ))}
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label className="aurora-cap mb-1 block">Cliente *</label>
            <select
              value={form.client_id}
              onChange={(e) => set("client_id", e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="aurora-cap mb-1 block">Descrição *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Ex: Aluguel junho, Mensalidade serviço X..."
              style={inputStyle}
            />
          </div>

          {/* Valor + Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="aurora-cap mb-1 block">Valor (R$) *</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0,00"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="aurora-cap mb-1 block">Vencimento *</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => set("due_date", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="aurora-cap mb-1 block">Categoria</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Ex: Aluguel, Fornecedores, Receita de serviço..."
              style={inputStyle}
            />
          </div>

          {/* Observações */}
          <div>
            <label className="aurora-cap mb-1 block">Observações</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Informações adicionais..."
              style={inputStyle}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] uppercase px-4 py-2"
              style={{ color: "var(--muted-foreground)", letterSpacing: "1.5px" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-[11px] uppercase px-5 py-2 transition-opacity disabled:opacity-50"
              style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ContasPage ───────────────────────────────────────────────────────────────

function ContasPage() {
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [view, setView] = useState<FilterView>("pendentes");
  const [payables, setPayables] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: clients = [] } = useQuery<ClientOption[]>({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data } = await supabase().from("clients").select("id, name").order("name");
      return (data ?? []) as ClientOption[];
    },
  });

  async function loadPayables() {
    setLoading(true);
    setError(null);

    let q = supabase()
      .from("payables")
      .select("id, client_id, type, description, amount, due_date, paid_at, category, notes")
      .order("due_date", { ascending: true });

    if (clientFilter !== "all") q = q.eq("client_id", clientFilter);

    const { data, error: err } = await q;
    if (err) {
      setError(err.message);
    } else {
      setPayables((data ?? []) as Payable[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPayables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientFilter]);

  async function markPaid(id: string) {
    setMarking(id);
    const paid = todayISO();
    const { error: err } = await supabase()
      .from("payables")
      .update({ paid_at: paid })
      .eq("id", id);
    if (err) setError(err.message);
    else setPayables((prev) => prev.map((p) => (p.id === id ? { ...p, paid_at: paid } : p)));
    setMarking(null);
  }

  async function undoPaid(id: string) {
    setMarking(id);
    const { error: err } = await supabase()
      .from("payables")
      .update({ paid_at: null })
      .eq("id", id);
    if (err) setError(err.message);
    else setPayables((prev) => prev.map((p) => (p.id === id ? { ...p, paid_at: null } : p)));
    setMarking(null);
  }

  async function deletePayable(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    const { error: err } = await supabase().from("payables").delete().eq("id", id);
    if (err) setError(err.message);
    else setPayables((prev) => prev.filter((p) => p.id !== id));
  }

  // Client-side filter by view
  const filtered = payables.filter((p) => {
    if (view === "pendentes") return !p.paid_at;
    if (view === "pagos") return !!p.paid_at;
    return true;
  });

  const receber = filtered.filter((p) => p.type === "receber");
  const pagar = filtered.filter((p) => p.type === "pagar");

  // KPIs always from pending (regardless of view filter)
  const pending = payables.filter((p) => !p.paid_at);
  const totalReceber = pending.filter((p) => p.type === "receber").reduce((s, p) => s + p.amount, 0);
  const totalPagar = pending.filter((p) => p.type === "pagar").reduce((s, p) => s + p.amount, 0);
  const saldoPrevisto = totalReceber - totalPagar;

  return (
    <AdminLayout>
      <PageHeader
        cap="Financeiro"
        title="Contas a pagar"
        emphasis="e receber"
        description="Lançamentos programados com vencimento definido."
        right={
          <button
            onClick={() => setShowModal(true)}
            className="text-[10px] uppercase px-4 py-2"
            style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
          >
            + Novo
          </button>
        }
      />

      <div className="px-8 lg:px-12 pb-12 flex flex-col gap-7">
        {/* Error banner */}
        {error && (
          <div
            className="aurora-card flex items-center gap-3"
            style={{ background: "rgba(176,96,64,0.08)", borderLeft: "3px solid #B06040" }}
          >
            <span style={{ color: "#B06040", fontSize: 18 }}>!</span>
            <div className="text-[13px]">{error}</div>
            <button className="ml-auto text-[11px] opacity-50 hover:opacity-100" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="aurora-card">
            <div className="aurora-cap mb-2">A Receber</div>
            <div className="aurora-serif text-[28px]" style={{ color: "var(--green)" }}>
              {brl(totalReceber)}
            </div>
            <div className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
              {pending.filter((p) => p.type === "receber").length} pendentes
            </div>
          </div>
          <div className="aurora-card">
            <div className="aurora-cap mb-2">A Pagar</div>
            <div className="aurora-serif text-[28px]" style={{ color: "var(--navy)" }}>
              {brl(totalPagar)}
            </div>
            <div className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
              {pending.filter((p) => p.type === "pagar").length} pendentes
            </div>
          </div>
          <div className="aurora-card">
            <div className="aurora-cap mb-2">Saldo Previsto</div>
            <div
              className="aurora-serif text-[28px]"
              style={{ color: saldoPrevisto >= 0 ? "var(--green)" : "#B06040" }}
            >
              {brl(saldoPrevisto)}
            </div>
            <div className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
              receber − pagar pendentes
            </div>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="aurora-cap">Cliente</span>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="text-[12px] px-3 py-1.5 bg-white"
              style={{ border: "1px solid var(--line)" }}
            >
              <option value="all">Todos</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {(["pendentes", "pagos", "todos"] as FilterView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="text-[10px] uppercase px-3 py-1.5 transition-colors"
                style={{
                  letterSpacing: "1.5px",
                  background: view === v ? "var(--navy)" : "transparent",
                  color: view === v ? "#fff" : "var(--muted-foreground)",
                  border: "1px solid",
                  borderColor: view === v ? "var(--navy)" : "var(--line)",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="aurora-card flex items-center gap-4">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--green)", borderTopColor: "transparent" }}
            />
            <div className="text-[13px]">Carregando contas...</div>
          </div>
        )}

        {/* Tables */}
        {!loading && (
          <>
            <PayableSection
              title="Contas a Receber"
              items={receber}
              accentColor="var(--green)"
              marking={marking}
              view={view}
              clients={clients}
              onMarkPaid={markPaid}
              onUndoPaid={undoPaid}
              onDelete={deletePayable}
            />
            <PayableSection
              title="Contas a Pagar"
              items={pagar}
              accentColor="var(--navy)"
              marking={marking}
              view={view}
              clients={clients}
              onMarkPaid={markPaid}
              onUndoPaid={undoPaid}
              onDelete={deletePayable}
            />
          </>
        )}
      </div>

      {showModal && (
        <NovoLancamentoModal
          clients={clients}
          onClose={() => setShowModal(false)}
          onSaved={(p) => {
            setPayables((prev) => [...prev, p].sort((a, b) => a.due_date.localeCompare(b.due_date)));
            setShowModal(false);
          }}
        />
      )}
    </AdminLayout>
  );
}
