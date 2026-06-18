import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { brl, formatDatePtBR } from "@/lib/utils";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { useCategories } from "@/hooks/useCategories";

interface UploadRecord {
  id: string;
  bank_name: string;
  filename: string;
  period: string;
  status: string;
  tx_total: number;
  tx_classified: number;
  tx_pending: number;
  created_at: string;
}

interface TxRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string | null;
  status: string;
  bank: string;
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function firstOfMonthISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function ExtratosPanel({ clientId }: { clientId: string }) {
  const [startDate, setStartDate] = useState(firstOfMonthISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [txMap, setTxMap] = useState<Record<string, TxRecord[] | undefined>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [editUpload, setEditUpload] = useState<UploadRecord | null>(null);
  const [deleteUpload, setDeleteUpload] = useState<UploadRecord | null>(null);
  const [editTx, setEditTx] = useState<TxRecord | null>(null);
  const [deleteTx, setDeleteTx] = useState<{ tx: TxRecord; uploadId: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categories = useCategories(clientId);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    supabase()
      .from("uploads")
      .select("id, bank_name, filename, period, status, tx_total, tx_classified, tx_pending, created_at")
      .eq("client_id", clientId)
      .gte("created_at", startDate)
      .lte("created_at", endDate + "T23:59:59")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUploads((data ?? []) as UploadRecord[]);
        setLoading(false);
      });
  }, [clientId, startDate, endDate]);

  async function toggleExpand(uploadId: string) {
    const next = new Set(expanded);
    if (next.has(uploadId)) {
      next.delete(uploadId);
      setExpanded(next);
      return;
    }
    next.add(uploadId);
    setExpanded(next);
    if (txMap[uploadId] === undefined) {
      const { data } = await supabase()
        .from("transactions")
        .select("id, date, description, amount, category, status, bank")
        .eq("upload_id", uploadId)
        .order("date");
      setTxMap((prev) => ({ ...prev, [uploadId]: (data ?? []) as TxRecord[] }));
    }
  }

  async function handleDeleteUpload(upload: UploadRecord) {
    setDeleting(true);
    const { error } = await supabase().from("uploads").delete().eq("id", upload.id);
    setDeleting(false);
    if (!error) {
      setDeleteUpload(null);
      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
      setTxMap((prev) => { const next = { ...prev }; delete next[upload.id]; return next; });
    }
  }

  async function handleDeleteTx(tx: TxRecord, uploadId: string) {
    setDeleting(true);
    const { error } = await supabase().from("transactions").delete().eq("id", tx.id);
    setDeleting(false);
    if (!error) {
      setDeleteTx(null);
      setTxMap((prev) => ({
        ...prev,
        [uploadId]: (prev[uploadId] ?? []).filter((t) => t.id !== tx.id),
      }));
      setUploads((prev) =>
        prev.map((u) => u.id === uploadId ? { ...u, tx_total: Math.max(0, u.tx_total - 1) } : u)
      );
    }
  }

  return (
    <div className="px-8 lg:px-12 pb-12 pt-6 grid gap-6">
      <div className="flex justify-end">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          maxDate={todayISO()}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </div>

      {loading && (
        <div className="aurora-card flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--green)", borderTopColor: "transparent" }} />
          <span className="text-[12px]">Carregando extratos...</span>
        </div>
      )}

      {!loading && uploads.length === 0 && (
        <div className="aurora-card text-center py-10">
          <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            Nenhum extrato importado no período selecionado.
          </div>
        </div>
      )}

      {uploads.map((upload) => {
        const isExpanded = expanded.has(upload.id);
        const txs = txMap[upload.id];
        return (
          <div key={upload.id} className="aurora-card p-0 overflow-hidden">
            <div
              className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
              style={{ background: "var(--linen)", borderBottom: isExpanded ? "1px solid var(--line)" : "none" }}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleExpand(upload.id)}
                  className="text-[13px] transition-transform"
                  style={{ color: "var(--muted-foreground)", transform: isExpanded ? "rotate(90deg)" : "none", display: "inline-block" }}
                >
                  ▶
                </button>
                <div>
                  <div className="text-[13px]" style={{ fontWeight: 600 }}>{upload.bank_name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{upload.filename}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                <span>Período: <strong style={{ color: "var(--foreground)" }}>{upload.period}</strong></span>
                <span>{upload.tx_total} transações</span>
                <span>Importado em {formatDatePtBR(upload.created_at.slice(0, 10))}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setEditUpload(upload)} className="aurora-link text-[11px]">
                  Editar
                </button>
                <button
                  onClick={() => setDeleteUpload(upload)}
                  className="text-[11px] transition-opacity hover:opacity-70"
                  style={{ color: "var(--tan)" }}
                >
                  Excluir extrato
                </button>
              </div>
            </div>

            {isExpanded && txs === undefined && (
              <div className="flex items-center gap-3 px-6 py-5">
                <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--green)", borderTopColor: "transparent" }} />
                <span className="text-[12px]">Carregando transações...</span>
              </div>
            )}

            {isExpanded && txs !== undefined && txs.length === 0 && (
              <div className="px-6 py-6 text-[12px] text-center" style={{ color: "var(--muted-foreground)" }}>
                Nenhuma transação encontrada.
              </div>
            )}

            {isExpanded && txs !== undefined && txs.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#FAFAF8" }}>
                    {["Data", "Descrição", "Valor", "Categoria", "Status", "Ações"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 aurora-cap" style={{ fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txs.map((tx, i) => (
                    <tr key={tx.id} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderTop: "1px solid var(--line)" }}>
                      <td className="px-5 py-3 text-[12px] whitespace-nowrap">{formatDatePtBR(tx.date)}</td>
                      <td className="px-5 py-3 text-[12px]">{tx.description}</td>
                      <td className="px-5 py-3 aurora-serif text-[13px] whitespace-nowrap"
                        style={{ color: tx.amount >= 0 ? "var(--green)" : "var(--expense)" }}>
                        {tx.amount >= 0 ? "+" : ""}{brl(tx.amount)}
                      </td>
                      <td className="px-5 py-3 text-[12px]">
                        {tx.category ?? <span style={{ color: "var(--muted-foreground)" }}>—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="aurora-cap px-2 py-0.5 rounded text-[10px]"
                          style={{
                            background: tx.status === "approved" ? "rgba(74,103,65,0.12)" : "rgba(184,149,106,0.15)",
                            color: tx.status === "approved" ? "var(--green)" : "var(--tan)",
                          }}
                        >
                          {tx.status === "approved" ? "Aprovado" : tx.status === "classified" ? "Classificado" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button onClick={() => setEditTx(tx)} className="aurora-link text-[11px] mr-3">
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTx({ tx, uploadId: upload.id })}
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

      {editUpload && (
        <EditUploadModal
          upload={editUpload}
          onClose={() => setEditUpload(null)}
          onSave={(updated) => {
            setUploads((prev) => prev.map((u) => u.id === updated.id ? updated : u));
            setEditUpload(null);
          }}
        />
      )}

      {deleteUpload && (
        <DeleteUploadModal
          upload={deleteUpload}
          deleting={deleting}
          onConfirm={() => handleDeleteUpload(deleteUpload)}
          onCancel={() => setDeleteUpload(null)}
        />
      )}

      {editTx && (
        <EditTxModal
          tx={editTx}
          categories={categories}
          onClose={() => setEditTx(null)}
          onSave={(updated) => {
            const uploadId = Object.entries(txMap).find(([, list]) => list?.some((t) => t.id === updated.id))?.[0];
            if (uploadId) {
              setTxMap((prev) => ({
                ...prev,
                [uploadId]: (prev[uploadId] ?? []).map((t) => t.id === updated.id ? updated : t),
              }));
            }
            setEditTx(null);
          }}
        />
      )}

      {deleteTx && (
        <DeleteTxModal
          tx={deleteTx.tx}
          deleting={deleting}
          onConfirm={() => handleDeleteTx(deleteTx.tx, deleteTx.uploadId)}
          onCancel={() => setDeleteTx(null)}
        />
      )}
    </div>
  );
}

function EditUploadModal({
  upload, onClose, onSave,
}: {
  upload: UploadRecord;
  onClose: () => void;
  onSave: (updated: UploadRecord) => void;
}) {
  const [bankName, setBankName] = useState(upload.bank_name);
  const [period, setPeriod] = useState(upload.period);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const { error } = await supabase()
      .from("uploads")
      .update({ bank_name: bankName, period })
      .eq("id", upload.id);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSave({ ...upload, bank_name: bankName, period });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div className="px-6 py-5 flex items-start justify-between" style={{ background: "var(--linen)", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div className="aurora-cap mb-0.5">Extrato importado</div>
            <div className="aurora-serif text-[20px]">Editar metadados</div>
          </div>
          <button onClick={onClose} className="text-[18px] leading-none mt-1 opacity-50 hover:opacity-100">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <label className="block">
            <div className="aurora-cap mb-2">Banco de origem</div>
            <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} required
              className="w-full bg-white px-3 py-2.5 text-[13px] outline-none"
              style={{ border: "1px solid var(--line)" }} />
          </label>
          <label className="block">
            <div className="aurora-cap mb-2">Período (ex: 04/2026)</div>
            <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)} required
              placeholder="MM/AAAA"
              className="w-full bg-white px-3 py-2.5 text-[13px] outline-none"
              style={{ border: "1px solid var(--line)" }} />
          </label>
          {err && (
            <div className="text-[12px] px-4 py-3" style={{ background: "rgba(184,149,106,0.1)", borderLeft: "3px solid var(--tan)", color: "var(--tan)" }}>
              {err}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="text-[10px] uppercase px-5 py-3 transition-opacity"
              style={{ border: "1px solid var(--line)", letterSpacing: "2px", fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="text-[10px] uppercase px-6 py-3 transition-opacity disabled:opacity-50"
              style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteUploadModal({
  upload, deleting, onConfirm, onCancel,
}: {
  upload: UploadRecord;
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
      <div className="w-full max-w-sm bg-white overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div className="px-6 py-5 flex items-start justify-between" style={{ background: "rgba(184,149,106,0.12)", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div className="aurora-cap mb-0.5" style={{ color: "var(--tan)" }}>Atenção</div>
            <div className="aurora-serif text-[20px]">Excluir extrato</div>
          </div>
          <button onClick={onCancel} className="text-[18px] leading-none mt-1 opacity-50 hover:opacity-100">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="text-[13px]" style={{ lineHeight: 1.6 }}>
            <span style={{ fontWeight: 500 }}>{upload.filename}</span>
            <br />
            <span style={{ color: "var(--muted-foreground)" }}>{upload.bank_name} · {upload.period}</span>
          </div>
          <div className="text-[12px] px-4 py-3"
            style={{ background: "rgba(184,149,106,0.10)", borderLeft: "3px solid var(--tan)", color: "var(--foreground)", lineHeight: 1.6 }}>
            Este extrato e todas as suas <strong>{upload.tx_total} transações</strong> serão removidos permanentemente. Essa ação não pode ser desfeita.
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onCancel} disabled={deleting}
              className="text-[10px] uppercase px-5 py-3 transition-opacity disabled:opacity-40"
              style={{ border: "1px solid var(--line)", letterSpacing: "2px", fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} disabled={deleting}
              className="text-[10px] uppercase px-6 py-3 transition-opacity disabled:opacity-50"
              style={{ background: "var(--tan)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}>
              {deleting ? "Excluindo..." : "Excluir extrato"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditTxModal({
  tx, categories, onClose, onSave,
}: {
  tx: TxRecord;
  categories: string[];
  onClose: () => void;
  onSave: (updated: TxRecord) => void;
}) {
  const [date, setDate] = useState(tx.date);
  const [desc, setDesc] = useState(tx.description);
  const [amount, setAmount] = useState(String(Math.abs(tx.amount)).replace(".", ","));
  const [tipo, setTipo] = useState<"receita" | "despesa">(tx.amount >= 0 ? "receita" : "despesa");
  const [category, setCategory] = useState(tx.category ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) { setErr("Informe um valor numérico válido."); return; }
    const signed = tipo === "despesa" ? -Math.abs(parsed) : Math.abs(parsed);
    setSaving(true);
    setErr(null);
    const { error } = await supabase()
      .from("transactions")
      .update({ date, description: desc, amount: signed, category: category || null })
      .eq("id", tx.id);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSave({ ...tx, date, description: desc, amount: signed, category: category || null });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div className="px-6 py-5 flex items-start justify-between" style={{ background: "var(--linen)", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div className="aurora-cap mb-0.5">Transação do extrato</div>
            <div className="aurora-serif text-[20px]">Editar registro</div>
          </div>
          <button onClick={onClose} className="text-[18px] leading-none mt-1 opacity-50 hover:opacity-100">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <div className="aurora-cap mb-2">Data</div>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                className="w-full bg-white px-3 py-2.5 text-[13px] outline-none"
                style={{ border: "1px solid var(--line)" }} />
            </label>
            <label className="block">
              <div className="aurora-cap mb-2">Tipo</div>
              <div className="grid grid-cols-2 h-[42px]" style={{ border: "1px solid var(--line)" }}>
                {(["despesa", "receita"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTipo(t)}
                    className="text-[10px] uppercase transition-colors"
                    style={{ letterSpacing: "1.5px", background: tipo === t ? (t === "despesa" ? "var(--navy)" : "var(--green)") : "transparent", color: tipo === t ? "#fff" : "var(--muted-foreground)", fontWeight: 500 }}>
                    {t === "despesa" ? "− Desp." : "+ Rec."}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <label className="block">
            <div className="aurora-cap mb-2">Descrição</div>
            <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} required
              className="w-full bg-white px-3 py-2.5 text-[13px] outline-none"
              style={{ border: "1px solid var(--line)" }} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <div className="aurora-cap mb-2">Valor (R$)</div>
              <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required
                className="w-full bg-white px-3 py-2.5 text-[13px] outline-none"
                style={{ border: "1px solid var(--line)" }} />
            </label>
            <label className="block">
              <div className="aurora-cap mb-2">Categoria</div>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white px-3 py-2.5 text-[13px]"
                style={{ border: "1px solid var(--line)" }}>
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          {err && (
            <div className="text-[12px] px-4 py-3" style={{ background: "rgba(184,149,106,0.1)", borderLeft: "3px solid var(--tan)", color: "var(--tan)" }}>
              {err}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="text-[10px] uppercase px-5 py-3 transition-opacity"
              style={{ border: "1px solid var(--line)", letterSpacing: "2px", fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="text-[10px] uppercase px-6 py-3 transition-opacity disabled:opacity-50"
              style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteTxModal({
  tx, deleting, onConfirm, onCancel,
}: {
  tx: TxRecord;
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
      <div className="w-full max-w-sm bg-white overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div className="px-6 py-5 flex items-start justify-between" style={{ background: "rgba(184,149,106,0.12)", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div className="aurora-cap mb-0.5" style={{ color: "var(--tan)" }}>Atenção</div>
            <div className="aurora-serif text-[20px]">Excluir transação</div>
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
            style={{ background: "rgba(184,149,106,0.10)", borderLeft: "3px solid var(--tan)", color: "var(--foreground)", lineHeight: 1.6 }}>
            Esta transação será removida permanentemente. Essa ação não pode ser desfeita.
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onCancel} disabled={deleting}
              className="text-[10px] uppercase px-5 py-3 transition-opacity disabled:opacity-40"
              style={{ border: "1px solid var(--line)", letterSpacing: "2px", fontWeight: 500 }}>
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
