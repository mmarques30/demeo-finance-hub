import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface TransactionUpdates {
  date: string;
  description: string;
  amount: number;
  category: string | null;
  installment_number: number | null;
  installment_total: number | null;
  installment_group_id: string | null;
}

interface EditTransactionModalProps {
  tx: {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string | null;
    installment_number?: number | null;
    installment_total?: number | null;
  };
  categories: string[];
  cap?: string;
  onClose: () => void;
  onSave: (id: string, updates: TransactionUpdates) => void;
}

function buildPattern(desc: string): string {
  return desc.replace(/\d+/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

async function deterministicGroupId(clientId: string, description: string, installmentTotal: number, date: string): Promise<string> {
  const yearMonth = date.slice(0, 7);
  const input = `${clientId}:${buildPattern(description)}:${installmentTotal}:${yearMonth}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const b = new Uint8Array(buf);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b.slice(0, 16)).map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function EditTransactionModal({ tx, categories, cap = "Lançamento", onClose, onSave }: EditTransactionModalProps) {
  const [date, setDate] = useState(tx.date);
  const [desc, setDesc] = useState(tx.description);
  const [amount, setAmount] = useState(String(Math.abs(tx.amount)).replace(".", ","));
  const [tipo, setTipo] = useState<"receita" | "despesa">(tx.amount >= 0 ? "receita" : "despesa");
  const [category, setCategory] = useState(tx.category ?? "");
  const [isParcelamento, setIsParcelamento] = useState(!!(tx.installment_total && tx.installment_total > 0));
  const [parcelaNum, setParcelaNum] = useState(tx.installment_number ?? 1);
  const [parcelaTotal, setParcelaTotal] = useState(tx.installment_total ?? 2);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) { setErr("Informe um valor numérico válido."); return; }
    if (isParcelamento && (parcelaNum < 1 || parcelaTotal < 2 || parcelaNum > parcelaTotal)) {
      setErr("Parcela inválida. Verifique o número e o total."); return;
    }
    const signed = tipo === "despesa" ? -Math.abs(parsed) : Math.abs(parsed);
    setSaving(true);
    setErr(null);

    let installmentFields: { installment_number: number | null; installment_total: number | null; installment_group_id: string | null } = {
      installment_number: null,
      installment_total: null,
      installment_group_id: null,
    };

    if (isParcelamento) {
      const groupId = await deterministicGroupId(tx.id, desc, parcelaTotal, date);
      installmentFields = {
        installment_number: parcelaNum,
        installment_total: parcelaTotal,
        installment_group_id: groupId,
      };
    }

    const { error } = await supabase()
      .from("transactions")
      .update({
        date,
        description: desc,
        amount: signed,
        category: category || null,
        ...installmentFields,
      })
      .eq("id", tx.id);

    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSave(tx.id, {
      date,
      description: desc,
      amount: signed,
      category: category || null,
      ...installmentFields,
    });
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
            <div className="aurora-cap mb-0.5">{cap}</div>
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

          {/* Parcelamento */}
          <div className="flex flex-col gap-3 pt-1" style={{ borderTop: "1px solid var(--line)" }}>
            <label className="inline-flex items-center gap-2 cursor-pointer pt-3">
              <input
                type="checkbox"
                checked={isParcelamento}
                onChange={(e) => setIsParcelamento(e.target.checked)}
                style={{ accentColor: "var(--navy)", width: 14, height: 14 }}
              />
              <span className="text-[11px] uppercase" style={{ letterSpacing: "1.5px", fontWeight: 600, color: "var(--muted-foreground)" }}>
                É parcelamento
              </span>
            </label>
            {isParcelamento && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="aurora-cap">Parcela Nº</span>
                  <input
                    type="number"
                    min={1}
                    max={parcelaTotal}
                    value={parcelaNum}
                    onChange={(e) => setParcelaNum(Math.min(parcelaTotal, Math.max(1, Number(e.target.value))))}
                    className="w-16 text-center text-[13px] px-2 py-2 outline-none"
                    style={{ border: "1px solid var(--line)" }}
                  />
                </div>
                <span className="text-[12px] mt-5" style={{ color: "var(--muted-foreground)" }}>de</span>
                <div className="flex flex-col gap-1">
                  <span className="aurora-cap">Total</span>
                  <input
                    type="number"
                    min={2}
                    value={parcelaTotal}
                    onChange={(e) => {
                      const newTotal = Math.max(2, Number(e.target.value));
                      setParcelaTotal(newTotal);
                      setParcelaNum((prev) => Math.min(prev, newTotal));
                    }}
                    className="w-16 text-center text-[13px] px-2 py-2 outline-none"
                    style={{ border: "1px solid var(--line)" }}
                  />
                </div>
                <div className="mt-5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  parcelas
                </div>
              </div>
            )}
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
