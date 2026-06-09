import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { clients, brl } from "@/lib/mockData";

export const Route = createFileRoute("/admin/importar")({
  component: ImportarPage,
  head: () => ({ meta: [{ title: "Importar Extratos · Aurora" }] }),
});

type Stage = "idle" | "reading" | "identifying" | "classifying" | "done";

const mockResultados = [
  { date: "02/04", desc: "Vendas balcão", value: 4820, cat: "Receita · Vendas", auto: true, recurring: true },
  { date: "03/04", desc: "Aluguel ponto", value: -6800, cat: "Despesa Fixa · Aluguel", auto: true, recurring: true },
  { date: "04/04", desc: "Folha funcionários", value: -18400, cat: "Despesa Fixa · Salários", auto: true, recurring: true },
  { date: "08/04", desc: "PIX 4521", value: 1850, cat: "—", auto: false, recurring: false },
  { date: "10/04", desc: "Energia Enel", value: -1480, cat: "Despesa Fixa · Utilidades", auto: true, recurring: true },
  { date: "12/04", desc: "DEB 887723", value: -640, cat: "—", auto: false, recurring: false },
  { date: "15/04", desc: "TED Forneced", value: -4220, cat: "—", auto: false, recurring: false },
  { date: "18/04", desc: "Manutenção forno", value: -2200, cat: "Despesa Variável · Manutenção", auto: true, recurring: false },
];

function ImportarPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [files, setFiles] = useState<string[]>([]);
  const [clientId, setClientId] = useState(clients[0].id);
  const [bank, setBank] = useState("Itaú");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function startProcess(names: string[]) {
    setFiles(names);
    setStage("reading");
    setTimeout(() => setStage("identifying"), 700);
    setTimeout(() => setStage("classifying"), 1500);
    setTimeout(() => setStage("done"), 2400);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const names = Array.from(e.dataTransfer.files).map((f) => f.name);
    if (names.length) startProcess(names);
  }

  function toggleAll() {
    if (selected.size === mockResultados.length) setSelected(new Set());
    else setSelected(new Set(mockResultados.map((_, i) => i)));
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
              const names = e.target.files ? Array.from(e.target.files).map((f) => f.name) : [];
              if (names.length) startProcess(names);
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
                {files.map((n) => (
                  <li key={n} className="text-[12px] flex items-center gap-2">
                    <span style={{ color: "var(--green)" }}>▸</span>
                    {n}
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

        {/* Result table */}
        {stage === "done" && (
          <div className="aurora-card p-0 overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: "1px solid var(--line)" }}>
              <div>
                <div className="aurora-cap mb-1">Resultado</div>
                <div className="aurora-serif text-[20px]">
                  {mockResultados.length} lançamentos · <em className="italic" style={{ color: "var(--green)" }}>{mockResultados.filter(r => r.auto).length} classificados</em>
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
                  <th className="px-4 py-3"><input type="checkbox" checked={selected.size === mockResultados.length} onChange={toggleAll} /></th>
                  {["Data", "Descrição", "Valor", "Categoria sugerida", "Ação"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 aurora-cap" style={{ fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockResultados.map((r, i) => (
                  <tr
                    key={i}
                    style={{
                      background: !r.auto ? "rgba(184,149,106,0.07)" : i % 2 === 0 ? "#fff" : "#FAFAF8",
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
                    <td className="px-5 py-3 text-[12px]">{r.date}</td>
                    <td className="px-5 py-3 text-[12px]">
                      {r.desc}
                      {r.recurring && <span title="Recorrente" className="ml-2" style={{ color: "var(--sage)" }}>↻</span>}
                    </td>
                    <td className="px-5 py-3 text-[12px] aurora-serif" style={{ color: r.value >= 0 ? "var(--green)" : "var(--navy)", fontSize: 14 }}>
                      {r.value >= 0 ? "+" : ""}{brl(r.value)}
                    </td>
                    <td className="px-5 py-3 text-[12px]" style={{ color: r.auto ? "var(--foreground)" : "var(--tan)" }}>
                      {r.auto ? r.cat : "Pendente de classificação"}
                    </td>
                    <td className="px-5 py-3 text-[11px]">
                      <span className="aurora-link mr-3">Aprovar</span>
                      <span className="aurora-link">Editar</span>
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
