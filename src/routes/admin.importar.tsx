import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { clients, brl } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

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
  const [clientId, setClientId] = useState(clients[0].id);
  const [bank, setBank] = useState("Itaú");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(fileList: File[]) {
    if (!fileList.length) return;
    setFiles(fileList);
    setError(null);
    setStage("reading");

    try {
      const file = fileList[0];
      const file_base64 = await toBase64(file);

      setStage("identifying");

      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

      setStage("classifying");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token ?? anonKey}`,
            "apikey": anonKey,
          },
          body: JSON.stringify({
            file_base64,
            filename: file.name,
            client_id: clientId,
            bank_name: bank,
          }),
        }
      );

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
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer transition-colors text-center py-16"
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
          <div className="aurora-serif text-[32px]" style={{ color: "var(--green)", letterSpacing: "-1px" }}>↓</div>
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
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                {["Itaú", "Santander", "Bradesco", "Banco do Brasil", "Inter", "Nubank"].map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Status */}
        {stage !== "idle" && stage !== "done" && (
          <div className="aurora-card flex items-center gap-4">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--green)", borderTopColor: "transparent" }} />
            <div>
              <div className="text-[13px]" style={{ fontWeight: 500 }}>
                {stage === "reading" && "Lendo arquivo..."}
                {stage === "identifying" && "Identificando lançamentos..."}
                {stage === "classifying" && "Classificando com IA..."}
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Não feche esta janela.</div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="aurora-card flex items-center gap-3" style={{ background: "rgba(184,149,106,0.1)", borderLeft: "3px solid var(--tan)" }}>
            <span style={{ color: "var(--tan)", fontSize: 18 }}>!</span>
            <div className="text-[13px]" style={{ color: "var(--foreground)" }}>{error}</div>
          </div>
        )}

        {/* Result table */}
        {stage === "done" && transactions.length > 0 && (
          <div className="aurora-card p-0 overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: "1px solid var(--line)" }}>
              <div>
                <div className="aurora-cap mb-1">Resultado</div>
                <div className="aurora-serif text-[20px]">
                  {transactions.length} lançamentos · <em className="italic" style={{ color: "var(--green)" }}>{transactions.filter(t => t.status !== "pending").length} classificados</em>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-[10px] uppercase px-4 py-2" style={{ border: "1px solid var(--line)", letterSpacing: "2px", color: "var(--muted-foreground)" }}>
                  Aprovar selecionados
                </button>
                <button className="text-[10px] uppercase px-4 py-2" style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}>
                  ✓ Aprovar todos
                </button>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--linen)" }}>
                  <th className="px-4 py-3"><input type="checkbox" checked={selected.size === transactions.length} onChange={toggleAll} /></th>
                  {["Data", "Descrição", "Valor", "Categoria sugerida", "Ação"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 aurora-cap" style={{ fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => {
                  const isClassified = tx.status !== "pending";
                  return (
                    <tr
                      key={tx.id}
                      style={{
                        background: !isClassified ? "rgba(184,149,106,0.07)" : i % 2 === 0 ? "#fff" : "#FAFAF8",
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
                        {tx.is_recurring && <span title="Recorrente" className="ml-2" style={{ color: "var(--sage)" }}>↻</span>}
                      </td>
                      <td className="px-5 py-3 text-[12px] aurora-serif" style={{ color: tx.amount >= 0 ? "var(--green)" : "var(--navy)", fontSize: 14 }}>
                        {tx.amount >= 0 ? "+" : ""}{brl(tx.amount)}
                      </td>
                      <td className="px-5 py-3 text-[12px]" style={{ color: isClassified ? "var(--foreground)" : "var(--tan)" }}>
                        {isClassified ? tx.category : "Pendente de classificação"}
                      </td>
                      <td className="px-5 py-3 text-[11px]">
                        <span className="aurora-link mr-3">Aprovar</span>
                        <span className="aurora-link">Editar</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
