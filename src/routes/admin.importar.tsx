import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useRef, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCategories } from "@/hooks/useCategories";
import { EditTransactionModal } from "@/components/EditTransactionModal";

export const Route = createFileRoute("/admin/importar")({
  component: ImportarPage,
  head: () => ({ meta: [{ title: "Importar Extratos · Aurora" }] }),
});

type Stage = "idle" | "reading" | "identifying" | "classifying" | "done";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string | null;
  status: string;
  is_recurring: boolean | null;
  confidence: number | null;
  installment_number?: number | null;
  installment_total?: number | null;
}

interface InstallmentState {
  enabled: boolean;
  number: number;
  total: number;
}

function buildDescPattern(desc: string): string {
  return desc.replace(/\d+/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

async function calcGroupId(txId: string, description: string, installmentTotal: number, date: string): Promise<string> {
  const yearMonth = date.slice(0, 7);
  const input = `${txId}:${buildDescPattern(description)}:${installmentTotal}:${yearMonth}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const b = new Uint8Array(buf);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b.slice(0, 16)).map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

interface ClientOption {
  id: string;
  name: string;
}


function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImportarPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState("");
  const [clientsLoading, setClientsLoading] = useState(true);
  const [bank, setBank] = useState("Itaú");
  const [uploadPeriod, setUploadPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelUploadOpen, setCancelUploadOpen] = useState(false);
  const [classifyTimedOut, setClassifyTimedOut] = useState(false);
  const [installments, setInstallments] = useState<Record<string, InstallmentState>>({});

  const CATEGORIAS = useCategories(clientId);

  // Manual entry form
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualDesc, setManualDesc] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualType, setManualType] = useState<"despesa" | "receita">("despesa");
  const [manualCategory, setManualCategory] = useState("");
  const [manualSource, setManualSource] = useState("Espécie");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClients() {
      const { data, error: clientsError } = await supabase()
        .from("clients")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");
      if (data && data.length > 0) {
        setClients(data);
        // clientId permanece "" — usuário escolhe manualmente
      } else if (clientsError) {
        setError(`Erro ao carregar clientes: ${clientsError.message}. Verifique se você está autenticado.`);
      } else {
        setError("Nenhum cliente cadastrado. Cadastre um cliente antes de importar extratos.");
      }
      setClientsLoading(false);
    }
    loadClients();
  }, []);


  async function handleUpload(fileList: File[], uploadClientId = clientId) {
    if (!fileList.length) return;
    if (clientsLoading) {
      setError("Aguarde o carregamento da lista de clientes.");
      return;
    }
    if (!uploadClientId) {
      setError("Selecione um cliente antes de enviar o arquivo.");
      return;
    }
    const MAX_FILE_MB = 15;
    const oversized = fileList.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setError(oversized.map((f) => `"${f.name}" excede o limite de ${MAX_FILE_MB} MB.`).join("\n"));
      return;
    }

    setFiles(fileList);
    setError(null);
    setClassifyTimedOut(false);
    setCurrentFileIndex(0);
    setStage("reading");

    const allTransactions: Transaction[] = [];
    let anyTimedOut = false;

    const {
      data: { session },
    } = await supabase().auth.getSession();
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

    for (let i = 0; i < fileList.length; i++) {
      setCurrentFileIndex(i);
      const file = fileList[i];

      try {
        setStage("reading");
        const file_base64 = await toBase64(file);

        setStage("identifying");
        setStage("classifying");

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? anonKey}`,
            apikey: anonKey,
          },
          body: JSON.stringify({
            file_base64,
            filename: file.name,
            client_id: uploadClientId,
            bank_name: bank,
            period: uploadPeriod.split("-").reverse().join("/"),
          }),
        });

        const result = await res.json();

        if (!res.ok) {
          const msg = `${file.name}: ${result.error ?? "Erro ao processar."}`;
          setError((prev) => (prev ? `${prev}\n${msg}` : msg));
          continue;
        }

        allTransactions.push(...(result.transactions ?? []));
        if (result.classify_timedout) anyTimedOut = true;
      } catch (err) {
        const msg = `${file.name}: ${String(err)}`;
        setError((prev) => (prev ? `${prev}\n${msg}` : msg));
      }
    }

    // n8n notificado pela Edge Function create-upload (N8N_WEBHOOK_URL) — não duplicar aqui
    setTransactions(allTransactions);
    if (anyTimedOut) setClassifyTimedOut(true);
    setStage("done");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (!dropped.length) return;
    setFiles(dropped);
    setError(null);
    if (clientId) setAwaitingConfirm(true);
  }

  function toggleAll() {
    if (selected.size === transactions.length) setSelected(new Set());
    else setSelected(new Set(transactions.map((_, i) => i)));
  }

  async function approveTransactions(ids: string[]) {
    if (!ids.length) return;
    setApproving(true);

    try {
      // Save installment fields for transactions that have parcelamento enabled
      const withInst = ids.filter((id) => {
        const inst = installments[id];
        return inst?.enabled && inst.total >= 2 && inst.number >= 1 && inst.number <= inst.total;
      });
      if (withInst.length > 0) {
        const tx = transactions;
        await Promise.all(
          withInst.map(async (id) => {
            const t = tx.find((r) => r.id === id);
            if (!t) return;
            const inst = installments[id];
            const groupId = await calcGroupId(id, t.description, inst.total, t.date);
            await supabase()
              .from("transactions")
              .update({ installment_number: inst.number, installment_total: inst.total, installment_group_id: groupId })
              .eq("id", id);
          })
        );
      }

      const { data: updated, error: err } = await supabase()
        .from("transactions")
        .update({ status: "approved" })
        .in("id", ids)
        .select("id");

      if (err) {
        setError(`Erro ao aprovar: ${err.message}`);
      } else if (!updated?.length) {
        setError("Nenhum lançamento foi aprovado. Verifique sua sessão e tente novamente.");
      } else {
        const approvedIds = new Set((updated as { id: string }[]).map((r) => r.id));
        setTransactions((prev) =>
          prev.map((t) => {
            if (!approvedIds.has(t.id)) return t;
            const inst = installments[t.id];
            return {
              ...t,
              status: "approved",
              ...(inst?.enabled ? { installment_number: inst.number, installment_total: inst.total } : {}),
            };
          })
        );
        setSelected(new Set());

        // Marca o upload como "approved" quando todos os lançamentos foram aprovados
        const { data: txUploadRows } = await supabase()
          .from("transactions")
          .select("upload_id")
          .in("id", Array.from(approvedIds))
          .not("upload_id", "is", null);

        const uploadIds = [...new Set((txUploadRows ?? []).map((r: { upload_id: string }) => r.upload_id))];

        if (uploadIds.length > 0) {
          await Promise.all(uploadIds.map(async (uploadId: string) => {
            const { count } = await supabase()
              .from("transactions")
              .select("id", { count: "exact", head: true })
              .eq("upload_id", uploadId)
              .neq("status", "approved");
            if (count === 0) {
              await supabase().from("uploads").update({ status: "approved" }).eq("id", uploadId);
            }
          }));
        }
      }
    } catch (e) {
      setError(String(e));
    }
    setApproving(false);
  }

  function approveSelected() {
    const ids = Array.from(selected).map((i) => transactions[i].id);
    approveTransactions(ids);
  }

  function approveAll() {
    approveTransactions(transactions.map((t) => t.id));
  }

  function approveOne(id: string) {
    approveTransactions([id]);
  }

  async function handleCancelTx(id: string) {
    const removedIdx = transactions.findIndex((t) => t.id === id);
    setCanceling(true);
    const { error: err } = await supabase().from("transactions").delete().eq("id", id);
    setCanceling(false);
    if (err) {
      setError(`Erro ao cancelar: ${err.message}`);
      setCancelingId(null);
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setSelected((prev) => {
      const s = new Set<number>();
      prev.forEach((idx) => {
        if (idx < removedIdx) s.add(idx);
        else if (idx > removedIdx) s.add(idx - 1);
      });
      return s;
    });
    setCancelingId(null);
  }

  async function handleManualEntry(e: React.FormEvent) {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(false);

    if (!clientId) { setManualError("Selecione um cliente."); return; }
    if (!manualDesc.trim()) { setManualError("Informe a descrição."); return; }
    if (!manualAmount || isNaN(parseFloat(manualAmount.replace(/\./g, "").replace(",", ".")))) { setManualError("Informe um valor válido."); return; }
    if (!manualCategory) { setManualError("Selecione uma categoria."); return; }

    const rawAmount = parseFloat(manualAmount.replace(/\./g, "").replace(",", "."));
    const signedAmount = manualType === "despesa" ? -Math.abs(rawAmount) : Math.abs(rawAmount);

    setManualSaving(true);
    const { error: insertErr } = await supabase().from("transactions").insert({
      client_id: clientId,
      upload_id: null,
      date: manualDate,
      description: manualDesc.trim(),
      raw_description: manualDesc.trim(),
      amount: signedAmount,
      category: manualCategory,
      bank: manualSource,
      status: "approved",
      is_recurring: false,
      confidence: 1,
    });
    setManualSaving(false);

    if (insertErr) {
      setManualError(`Erro ao salvar: ${insertErr.message}`);
    } else {
      setManualSuccess(true);
      setManualDesc("");
      setManualAmount("");
      setManualCategory("");
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        cap={`Pipeline de dados · ${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`}
        title="Importar"
        emphasis="extratos"
        description="Envie extratos bancários em qualquer formato. A IA identifica e classifica os lançamentos automaticamente."
      />

      <div className="px-8 lg:px-12 pb-12 grid gap-8">
        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!clientsLoading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={clientsLoading ? undefined : onDrop}
          onClick={() => { if (!clientsLoading) inputRef.current?.click(); }}
          className={`transition-colors text-center py-16 ${clientsLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          style={{
            border: `1.5px dashed ${dragOver ? "var(--green)" : "var(--line)"}`,
            background: dragOver ? "rgba(74,103,65,0.04)" : "#fff",
          }}
        >
          <input
            type="file"
            ref={inputRef}
            multiple
            accept=".pdf,.csv,.xlsx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              const fileList = e.target.files ? Array.from(e.target.files) : [];
              if (!fileList.length) return;
              setFiles(fileList);
              setError(null);
              if (clientId) setAwaitingConfirm(true);
            }}
          />
          <div className="aurora-serif text-[32px]" style={{ color: "var(--green)", letterSpacing: "-1px" }}>
            ↓
          </div>
          <div className="aurora-serif text-[24px] mt-2">Arraste o extrato aqui</div>
          <div className="text-[12px] mt-2" style={{ color: "var(--muted-foreground)" }}>
            ou clique para selecionar · PDF, CSV, XLSX, PNG, JPG · múltiplos arquivos suportados
          </div>
        </div>

        {/* File preview + form */}
        {files.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="aurora-card">
              <div className="aurora-cap mb-3">Arquivos enviados</div>
              <ul className="flex flex-col gap-2">
                {files.map((f) => (
                  <li key={f.name} className="text-[12px] flex items-center gap-2">
                    <span style={{ color: "var(--green)" }}>▸</span>
                    {f.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="aurora-card">
              <div className="aurora-cap mb-3">Cliente vinculado</div>
              <select
                value={clientId}
                onChange={(e) => {
                  const id = e.target.value;
                  setClientId(id);
                  if (id && files.length > 0 && stage === "idle") setAwaitingConfirm(true);
                }}
                className="w-full bg-white px-3 py-2.5 text-[13px]"
                style={{ border: "1px solid var(--line)" }}
              >
                <option value="">Escolher cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Status */}
        {stage !== "idle" && stage !== "done" && (
          <div className="aurora-card flex items-center gap-4">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--green)", borderTopColor: "transparent" }}
            />
            <div>
              <div className="text-[13px]" style={{ fontWeight: 500 }}>
                {files.length > 1
                  ? `Arquivo ${currentFileIndex + 1} de ${files.length}: ${files[currentFileIndex]?.name} — `
                  : ""}
                {stage === "reading" && "Lendo arquivo..."}
                {stage === "identifying" && "Identificando lançamentos..."}
                {stage === "classifying" && "Classificando com IA..."}
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                Não feche esta janela.
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="aurora-card flex items-center gap-3"
            style={{ background: "rgba(184,149,106,0.1)", borderLeft: "3px solid var(--tan)" }}
          >
            <span style={{ color: "var(--tan)", fontSize: 18 }}>!</span>
            <div className="text-[13px]" style={{ color: "var(--foreground)" }}>
              {error}
            </div>
          </div>
        )}

        {/* Aviso de timeout na classificação automática */}
        {stage === "done" && classifyTimedOut && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl text-[12px]"
            style={{ background: "rgba(184,149,106,0.12)", border: "1px solid rgba(184,149,106,0.35)", color: "var(--tan)" }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>⚠</span>
            <div>
              <strong style={{ fontWeight: 600 }}>Classificação automática expirou</strong> — os lançamentos foram importados, mas a IA não conseguiu classificá-los a tempo.
              Revise os itens com status <em>Pendente</em> e classifique manualmente ou aguarde a próxima execução automática.
            </div>
          </div>
        )}

        {/* Result table */}
        {stage === "done" && transactions.length > 0 && (
          <div className="aurora-card p-0 overflow-hidden">
            <div
              className="px-6 py-5 flex items-center justify-between flex-wrap gap-3"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div>
                <div className="aurora-cap mb-1">Resultado</div>
                <div className="aurora-serif text-[20px]">
                  {transactions.length} lançamentos ·{" "}
                  <em className="italic" style={{ color: "var(--green)" }}>
                    {transactions.filter((t) => t.status === "approved").length} aprovados
                  </em>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCancelUploadOpen(true)}
                  disabled={approving}
                  className="text-[10px] uppercase px-4 py-2 transition-opacity disabled:opacity-40"
                  style={{ border: "1px solid var(--tan)", color: "var(--tan)", letterSpacing: "2px" }}
                >
                  Cancelar envio
                </button>
                <button
                  onClick={approveSelected}
                  disabled={approving || selected.size === 0}
                  className="text-[10px] uppercase px-4 py-2 transition-opacity disabled:opacity-40"
                  style={{ border: "1px solid var(--line)", letterSpacing: "2px", color: "var(--muted-foreground)" }}
                >
                  Aprovar selecionados {selected.size > 0 ? `(${selected.size})` : ""}
                </button>
                <button
                  onClick={approveAll}
                  disabled={approving}
                  className="text-[10px] uppercase px-4 py-2 transition-opacity disabled:opacity-40"
                  style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
                >
                  {approving ? "Aprovando..." : "✓ Aprovar todos"}
                </button>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--linen)" }}>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={selected.size === transactions.length && transactions.length > 0} onChange={toggleAll} />
                  </th>
                  {["Data", "Descrição", "Valor", "Categoria sugerida", "Parcelamento", "Status", "Ação"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 aurora-cap" style={{ fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => {
                  const isApproved = tx.status === "approved";
                  const isPending = tx.status === "pending";
                  return (
                    <tr
                      key={tx.id}
                      style={{
                        background: isPending ? "rgba(184,149,106,0.07)" : i % 2 === 0 ? "#fff" : "#FAFAF8",
                        borderTop: "1px solid var(--line)",
                      }}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(i)}
                          onChange={() => {
                            const s = new Set(selected);
                            s.has(i) ? s.delete(i) : s.add(i);
                            setSelected(s);
                          }}
                        />
                      </td>
                      <td className="px-5 py-3 text-[12px]">{tx.date}</td>
                      <td className="px-5 py-3 text-[12px]">
                        {tx.description}
                        {tx.is_recurring && (
                          <span title="Recorrente" className="ml-2" style={{ color: "var(--sage)" }}>
                            ↻
                          </span>
                        )}
                      </td>
                      <td
                        className="px-5 py-3 aurora-value"
                        style={{ fontSize: 14, color: tx.amount >= 0 ? "var(--green)" : "var(--navy)" }}
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {brl(tx.amount)}
                      </td>
                      <td
                        className="px-5 py-3 text-[12px]"
                        style={{ color: isPending ? "var(--tan)" : "var(--foreground)" }}
                      >
                        {isPending ? "Pendente de classificação" : tx.category}
                      </td>
                      <td className="px-5 py-3">
                        {(() => {
                          const inst = installments[tx.id] ?? { enabled: false, number: 1, total: 2 };
                          return (
                            <div className="flex flex-col gap-1.5">
                              <label className="inline-flex items-center gap-2 cursor-pointer text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                                <input
                                  type="checkbox"
                                  checked={inst.enabled}
                                  onChange={(e) => setInstallments((prev) => ({ ...prev, [tx.id]: { ...inst, enabled: e.target.checked } }))}
                                  style={{ accentColor: "var(--navy)" }}
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
                                    onChange={(e) => setInstallments((prev) => ({ ...prev, [tx.id]: { ...inst, number: Math.min(inst.total, Math.max(1, Number(e.target.value))) } }))}
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
                                      setInstallments((prev) => ({ ...prev, [tx.id]: { ...inst, total: newTotal, number: Math.min(inst.number, newTotal) } }));
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
                      <td className="px-5 py-3 text-[11px]">
                        <span
                          className="aurora-cap px-2 py-0.5 rounded text-[10px]"
                          style={{
                            background: isApproved ? "rgba(74,103,65,0.12)" : "rgba(184,149,106,0.15)",
                            color: isApproved ? "var(--green)" : "var(--tan)",
                          }}
                        >
                          {isApproved ? "Aprovado" : tx.status === "classified" ? "Classificado" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[11px]">
                        {!isApproved && (
                          <button
                            onClick={() => approveOne(tx.id)}
                            disabled={approving}
                            className="aurora-link mr-3 disabled:opacity-40"
                          >
                            Aprovar
                          </button>
                        )}
                        <button className="aurora-link mr-3" onClick={() => setEditTx(tx)}>Editar</button>
                        {cancelingId === tx.id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-[10px]" style={{ color: "var(--tan)" }}>Confirmar?</span>
                            <button
                              onClick={() => handleCancelTx(tx.id)}
                              disabled={canceling}
                              className="aurora-link text-[10px] disabled:opacity-40"
                              style={{ color: "var(--tan)" }}
                            >
                              {canceling ? "..." : "Sim"}
                            </button>
                            <button
                              onClick={() => setCancelingId(null)}
                              className="aurora-link text-[10px]"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              Não
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setCancelingId(tx.id)}
                            className="text-[10px] transition-opacity hover:opacity-70"
                            style={{ color: "var(--tan)" }}
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {stage === "done" && clientId && (
          <div className="flex justify-end">
            <Link
              to={"/admin/dfc" as never}
              search={{ clientId, tab: "extratos" } as never}
              className="aurora-link text-[12px]"
            >
              Ver Histórico de Extratos →
            </Link>
          </div>
        )}

        {/* Manual entry */}
        <div className="aurora-card p-0 overflow-hidden">
          <button
            type="button"
            onClick={() => { setManualOpen((v) => !v); setManualSuccess(false); setManualError(null); }}
            className="w-full flex items-center justify-between px-6 py-4 text-left"
            style={{ background: "var(--linen)", borderBottom: manualOpen ? "1px solid var(--line)" : "none" }}
          >
            <div>
              <div className="aurora-cap mb-0.5">Lançamento manual</div>
              <div className="aurora-serif text-[16px]">
                Registrar pagamento em <em className="italic" style={{ color: "var(--green)" }}>espécie</em>
              </div>
            </div>
            <span className="text-[18px]" style={{ color: "var(--muted-foreground)" }}>
              {manualOpen ? "−" : "+"}
            </span>
          </button>

          {manualOpen && (
            <form onSubmit={handleManualEntry} className="px-8 py-6 grid gap-5">
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Cliente */}
                <label className="block">
                  <div className="aurora-cap mb-2">Cliente</div>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-white px-3 py-2.5 text-[13px]"
                    style={{ border: "1px solid var(--line)" }}
                  >
                    <option value="">Escolher cliente</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>

                {/* Data */}
                <label className="block">
                  <div className="aurora-cap mb-2">Data</div>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    required
                    className="w-full bg-white px-3 py-2.5 text-[13px] outline-none"
                    style={{ border: "1px solid var(--line)" }}
                  />
                </label>
              </div>

              {/* Descrição */}
              <label className="block">
                <div className="aurora-cap mb-2">Descrição</div>
                <input
                  type="text"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="Ex: Pagamento cliente João — serviço de corte"
                  required
                  className="w-full bg-white px-3 py-2.5 text-[13px] outline-none"
                  style={{ border: "1px solid var(--line)" }}
                />
              </label>

              <div className="grid lg:grid-cols-3 gap-4">
                {/* Tipo + Valor */}
                <label className="block lg:col-span-1">
                  <div className="aurora-cap mb-2">Tipo</div>
                  <div className="grid grid-cols-2" style={{ border: "1px solid var(--line)" }}>
                    {(["despesa", "receita"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setManualType(t)}
                        className="text-[10px] uppercase py-2.5 transition-colors"
                        style={{
                          letterSpacing: "1.5px",
                          background: manualType === t ? (t === "despesa" ? "var(--navy)" : "var(--green)") : "transparent",
                          color: manualType === t ? "#fff" : "var(--muted-foreground)",
                          fontWeight: 500,
                        }}
                      >
                        {t === "despesa" ? "− Despesa" : "+ Receita"}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="block">
                  <div className="aurora-cap mb-2">Valor (R$)</div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="0,00"
                    required
                    className="w-full bg-white px-3 py-2.5 text-[13px] outline-none"
                    style={{ border: "1px solid var(--line)" }}
                  />
                </label>

                {/* Origem */}
                <label className="block">
                  <div className="aurora-cap mb-2">Origem</div>
                  <select
                    value={manualSource}
                    onChange={(e) => setManualSource(e.target.value)}
                    className="w-full bg-white px-3 py-2.5 text-[13px]"
                    style={{ border: "1px solid var(--line)" }}
                  >
                    {["Espécie", "PIX", "Cartão", "Depósito", "Outro"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Categoria */}
              <label className="block">
                <div className="aurora-cap mb-2">Categoria</div>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  required
                  className="w-full bg-white px-3 py-2.5 text-[13px]"
                  style={{ border: "1px solid var(--line)" }}
                >
                  <option value="">Selecione...</option>
                  {(CATEGORIAS ?? []).map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>

              {manualError && (
                <div
                  className="flex items-center gap-3 px-4 py-3 text-[12px]"
                  style={{ background: "rgba(184,149,106,0.1)", borderLeft: "3px solid var(--tan)", color: "var(--tan)" }}
                >
                  <span style={{ fontSize: 16 }}>!</span> {manualError}
                </div>
              )}

              {manualSuccess && (
                <div
                  className="flex items-center gap-3 px-4 py-3 text-[12px]"
                  style={{ background: "rgba(74,103,65,0.08)", borderLeft: "3px solid var(--green)", color: "var(--green)" }}
                >
                  <span style={{ fontSize: 16 }}>✓</span> Lançamento registrado com sucesso.
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={manualSaving || clientsLoading}
                  className="text-[10px] uppercase px-6 py-3 transition-opacity disabled:opacity-50"
                  style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
                >
                  {manualSaving ? "Salvando..." : "Registrar lançamento"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {editTx && (
        <EditTransactionModal
          tx={editTx}
          categories={CATEGORIAS ?? []}
          onClose={() => setEditTx(null)}
          onSave={(id, updates) => {
            setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
            setEditTx(null);
          }}
        />
      )}

      {cancelUploadOpen && (
        <CancelUploadModal
          count={transactions.length}
          onCancel={() => setCancelUploadOpen(false)}
          onConfirm={async () => {
            const ids = transactions.map((t) => t.id);
            if (ids.length > 0) {
              await supabase().from("transactions").delete().in("id", ids);
            }
            setCancelUploadOpen(false);
            setStage("idle");
            setTransactions([]);
            setFiles([]);
            setSelected(new Set());
            setError(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      )}

      {awaitingConfirm && clientId && files.length > 0 && (
        <ConfirmUploadModal
          clientName={clients.find((c) => c.id === clientId)?.name ?? ""}
          files={files}
          bank={bank}
          onConfirm={(confirmedBank) => { setBank(confirmedBank); setAwaitingConfirm(false); handleUpload(files); }}
          onCancel={() => { setAwaitingConfirm(false); setFiles([]); setError(null); if (inputRef.current) inputRef.current.value = ""; }}
        />
      )}

    </AdminLayout>
  );
}

function CancelUploadModal({
  count, onConfirm, onCancel,
}: {
  count: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) onCancel(); }}
    >
      <div className="w-full max-w-md bg-white overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div className="px-6 py-5 flex items-start justify-between" style={{ background: "var(--linen)", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div className="aurora-cap mb-0.5">Cancelar envio</div>
            <div className="aurora-serif text-[20px]">Descartar lançamentos</div>
          </div>
          <button onClick={onCancel} disabled={deleting} className="text-[18px] leading-none mt-1 opacity-50 hover:opacity-100">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-[13px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            Todos os <strong>{count} lançamentos</strong> deste envio serão excluídos permanentemente. Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="text-[10px] uppercase px-5 py-3 transition-opacity disabled:opacity-50"
              style={{ border: "1px solid var(--line)", letterSpacing: "2px", fontWeight: 500 }}
            >
              Manter
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="text-[10px] uppercase px-6 py-3 transition-opacity disabled:opacity-50"
              style={{ background: "var(--tan)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
            >
              {deleting ? "Excluindo..." : "Excluir tudo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const BANKS = ["Itaú", "Santander", "Bradesco", "Banco do Brasil", "Inter", "Nubank"];

function ConfirmUploadModal({
  clientName, files, bank, onConfirm, onCancel,
}: {
  clientName: string;
  files: File[];
  bank: string;
  onConfirm: (confirmedBank: string) => void;
  onCancel: () => void;
}) {
  const [confirmedBank, setConfirmedBank] = React.useState(bank);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-md bg-white overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div className="px-6 py-5 flex items-start justify-between" style={{ background: "var(--linen)", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div className="aurora-cap mb-0.5">Confirmar</div>
            <div className="aurora-serif text-[20px]">Importar extrato</div>
          </div>
          <button onClick={onCancel} className="text-[18px] leading-none mt-1 opacity-50 hover:opacity-100">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-[13px]">
              <span style={{ color: "var(--muted-foreground)" }}>Cliente</span>
              <span style={{ fontWeight: 500 }}>{clientName}</span>
            </div>
            {/* Banco editável com destaque */}
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ background: "rgba(184,149,106,0.1)", border: "1px solid var(--tan)", borderRadius: 6 }}
            >
              <div>
                <div className="text-[10px] uppercase mb-0.5" style={{ letterSpacing: "1.5px", fontWeight: 600, color: "var(--tan)" }}>
                  Banco — confirme se está correto
                </div>
                <select
                  value={confirmedBank}
                  onChange={(e) => setConfirmedBank(e.target.value)}
                  className="bg-transparent text-[13px] font-medium outline-none"
                  style={{ color: "var(--foreground)", border: "none", cursor: "pointer" }}
                >
                  {BANKS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <span style={{ fontSize: 18 }}>🏦</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span style={{ color: "var(--muted-foreground)" }}>{files.length === 1 ? "Arquivo" : "Arquivos"}</span>
              <span style={{ textAlign: "right", maxWidth: 200 }}>{files.map((f) => f.name).join(", ")}</span>
            </div>
          </div>
          <div
            className="text-[12px] px-4 py-3"
            style={{ background: "rgba(27,57,77,0.06)", color: "var(--foreground)", lineHeight: 1.6 }}
          >
            Os lançamentos deste extrato serão vinculados a <strong>{clientName}</strong> como banco <strong>{confirmedBank}</strong>.
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="text-[10px] uppercase px-5 py-3 transition-opacity"
              style={{ border: "1px solid var(--line)", letterSpacing: "2px", fontWeight: 500 }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(confirmedBank)}
              className="text-[10px] uppercase px-6 py-3 transition-opacity"
              style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
            >
              Confirmar importação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
