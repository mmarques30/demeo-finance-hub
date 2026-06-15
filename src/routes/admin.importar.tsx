import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";

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
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

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
      const { data, error: clientsError } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (data && data.length > 0) {
        setClients(data);
        setClientId(data[0].id);
      } else if (clientsError) {
        setError(`Erro ao carregar clientes: ${clientsError.message}. Verifique se você está autenticado.`);
      } else {
        setError("Nenhum cliente cadastrado. Cadastre um cliente antes de importar extratos.");
      }
      setClientsLoading(false);
    }
    loadClients();
  }, []);

  async function handleUpload(fileList: File[]) {
    if (!fileList.length) return;
    if (clientsLoading) {
      setError("Aguarde o carregamento da lista de clientes.");
      return;
    }
    if (!clientId) {
      setError("Selecione um cliente antes de enviar o arquivo.");
      return;
    }
    setFiles(fileList);
    setError(null);
    setStage("reading");

    try {
      const file = fileList[0];
      const file_base64 = await toBase64(file);

      setStage("identifying");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

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
          client_id: clientId,
          bank_name: bank,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Erro ao processar arquivo.");
        setStage("idle");
        return;
      }

      setTransactions(result.transactions ?? []);
      setStage("done");
    } catch (err) {
      setError(String(err));
      setStage("idle");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) handleUpload(dropped);
  }

  function toggleAll() {
    if (selected.size === transactions.length) setSelected(new Set());
    else setSelected(new Set(transactions.map((_, i) => i)));
  }

  async function approveTransactions(ids: string[]) {
    if (!ids.length) return;
    setApproving(true);

    const { error: err } = await supabase
      .from("transactions")
      .update({ status: "approved" })
      .in("id", ids);

    if (err) {
      setError(`Erro ao aprovar: ${err.message}`);
    } else {
      setTransactions((prev) =>
        prev.map((t) => (ids.includes(t.id) ? { ...t, status: "approved" } : t))
      );
      setSelected(new Set());
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

  async function handleManualEntry(e: React.FormEvent) {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(false);

    if (!clientId) { setManualError("Selecione um cliente."); return; }
    if (!manualDesc.trim()) { setManualError("Informe a descrição."); return; }
    if (!manualAmount || isNaN(parseFloat(manualAmount))) { setManualError("Informe um valor válido."); return; }
    if (!manualCategory) { setManualError("Selecione uma categoria."); return; }

    const rawAmount = parseFloat(manualAmount.replace(",", "."));
    const signedAmount = manualType === "despesa" ? -Math.abs(rawAmount) : Math.abs(rawAmount);

    setManualSaving(true);
    const { error: insertErr } = await supabase.from("transactions").insert({
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
        cap="Pipeline de dados · Abril"
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
              if (fileList.length) handleUpload(fileList);
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
          <div className="grid lg:grid-cols-3 gap-5">
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
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-white px-3 py-2.5 text-[13px]"
                style={{ border: "1px solid var(--line)" }}
              >
                {clients.length === 0 && (
                  <option value="">Carregando clientes...</option>
                )}
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="aurora-card">
              <div className="aurora-cap mb-3">Banco</div>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full bg-white px-3 py-2.5 text-[13px]"
                style={{ border: "1px solid var(--line)" }}
              >
                {["Itaú", "Santander", "Bradesco", "Banco do Brasil", "Inter", "Nubank"].map((b) => (
                  <option key={b}>{b}</option>
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
                  {["Data", "Descrição", "Valor", "Categoria sugerida", "Status", "Ação"].map((h) => (
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
                        className="px-5 py-3 text-[12px] aurora-serif"
                        style={{ color: tx.amount >= 0 ? "var(--green)" : "var(--navy)", fontSize: 14 }}
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
                        <span className="aurora-link">Editar</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            <form onSubmit={handleManualEntry} className="px-6 py-5 grid gap-4">
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
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
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
    </AdminLayout>
  );
}
