import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl, formatDatePtBR } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { computeForecastMonths, type ForecastMonth, type PayableProjection } from "@/hooks/useDFCForecast";
import { computeDRE, type CatInfo, type DREData } from "@/lib/dre";

export const Route = createFileRoute("/admin/relatorios")({
  component: RelatoriosPage,
  head: () => ({ meta: [{ title: "Relatórios · Aurora" }] }),
});

// ─── helpers de data ──────────────────────────────────────────────────────────
function firstOfMonthISO(offsetMonths = 0) {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() + offsetMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function lastOfMonthISO(offsetMonths = 0) {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() + offsetMonths + 1, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
function fmtLabel(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── tipos ────────────────────────────────────────────────────────────────────
interface ClientRow {
  id: string;
  name: string;
  last_upload_at: string | null;
}

interface ClientPeriod { start: string; end: string }

interface Tx {
  date: string;
  description: string;
  amount: number;
  category: string | null;
  is_recurring: boolean;
  installment_number: number | null;
  installment_total: number | null;
  installment_group_id: string | null;
}

interface ReportData {
  receitas: number;
  despesas: number;
  resultado: number;
  fixos: number;
  variaveis: number;
  byCategory: { cat: string; total: number; isReceita: boolean }[];
}

// CatInfo e DREData importados de @/lib/dre

// ─── cálculos (puros) ─────────────────────────────────────────────────────────
function computeReport(txs: Tx[]): ReportData {
  const receitas = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const despesas = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const fixos = txs
    .filter((t) => t.amount < 0 && t.is_recurring)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const variaveis = txs
    .filter((t) => t.amount < 0 && !t.is_recurring)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const catMap = new Map<string, { total: number; isReceita: boolean }>();
  for (const tx of txs) {
    const cat = tx.category || "Sem categoria";
    const cur = catMap.get(cat) ?? { total: 0, isReceita: tx.amount > 0 };
    catMap.set(cat, { total: cur.total + Math.abs(tx.amount), isReceita: cur.isReceita });
  }
  const byCategory = Array.from(catMap.entries())
    .map(([cat, v]) => ({ cat, total: v.total, isReceita: v.isReceita }))
    .sort((a, b) => b.total - a.total);
  return { receitas, despesas, resultado: receitas - despesas, fixos, variaveis, byCategory };
}

async function fetchCategories(clientId: string): Promise<Map<string, CatInfo>> {
  const { data } = await supabase()
    .from("categories")
    .select("name, group_name, type")
    .eq("client_id", clientId)
    .eq("is_active", true);
  const map = new Map<string, CatInfo>();
  for (const cat of data ?? []) map.set(cat.name, { group_name: cat.group_name, type: cat.type });
  return map;
}

// ─── exportações ──────────────────────────────────────────────────────────────
function openPrintReport(
  clientName: string,
  periodoLabel: string,
  txs: Tx[],
  forecast: ForecastMonth[],
  catMap: Map<string, CatInfo>
) {
  const d = computeReport(txs);
  const dre = computeDRE(txs, catMap);
  const today = new Date().toLocaleDateString("pt-BR");

  const projRows = forecast
    .map((p) => {
      const r = p.rec - p.des;
      return `<tr>
        <td>${p.mes}</td>
        <td style="color:#8FA688">${brl(p.rec)}</td>
        <td style="color:#B8956A">${brl(p.des)}</td>
        <td style="color:${r >= 0 ? "#8FA688" : "#B8956A"};font-weight:bold">${brl(r)}</td>
      </tr>`;
    })
    .join("");

  // DRE estruturada: grupos com valores absolutos + subtotais intermediários
  const dreRowsArr: string[] = [];
  for (const g of dre.groups) {
    const isReceita = g.name === "Receita";
    const color = isReceita ? "#8FA688" : "#B8956A";
    const prefix = isReceita ? "" : "(−) ";
    const lineRows = g.lines.map((l) =>
      `<tr>
        <td style="padding-left:24px;color:#555">${l.cat}</td>
        <td style="text-align:right;color:${color}">${isReceita ? brl(l.total) : `(${brl(l.total)})`}</td>
      </tr>`
    ).join("");
    dreRowsArr.push(`<tr style="background:#F8F6F1">
        <td style="font-weight:600;padding:8px 10px;letter-spacing:1px;font-size:11px;text-transform:uppercase;font-family:sans-serif;color:#555">${prefix}${g.name}</td>
        <td></td>
      </tr>
      ${lineRows}
      <tr style="border-top:1px solid #E8E3D9">
        <td style="font-weight:500;font-family:sans-serif;font-size:12px;padding-left:8px">Subtotal ${g.name}</td>
        <td style="text-align:right;font-weight:600;color:${color}">${isReceita ? brl(g.subtotal) : `(${brl(g.subtotal)})`}</td>
      </tr>
      <tr><td colspan="2" style="padding:4px"></td></tr>`);
    // Linha de EBITDA após Despesa Variável
    if (g.name === "Despesa Variável") {
      dreRowsArr.push(`<tr style="background:#E8F0E4;border-top:2px solid #8FA688">
        <td style="font-weight:700;font-size:13px;padding:10px 10px;font-family:sans-serif">= Resultado Operacional (EBITDA)</td>
        <td style="text-align:right;font-weight:700;font-size:14px;color:${dre.ebitda >= 0 ? "#8FA688" : "#B8956A"};padding:10px">${brl(dre.ebitda)}</td>
      </tr><tr><td colspan="2" style="padding:4px"></td></tr>`);
    }
  }
  const dreRows = dreRowsArr.join("");

  const fixosPct = d.despesas > 0 ? ((d.fixos / d.despesas) * 100).toFixed(1) : "0";
  const varPct = d.despesas > 0 ? ((d.variaveis / d.despesas) * 100).toFixed(1) : "0";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório — ${clientName} — ${periodoLabel}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,'Times New Roman',serif;color:#1B3950;background:#fff;padding:48px}
  .cap{font-family:sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#8FA688}
  h1{font-size:36px;font-weight:normal;margin:6px 0 4px}
  .sub{font-size:13px;color:#888;margin-bottom:40px;font-family:sans-serif}
  .sec{margin-bottom:36px}
  .sec-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#8FA688;margin-bottom:12px;font-family:sans-serif}
  .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .card{border:1px solid #E8E3D9;padding:16px}
  .card-lbl{font-family:sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:8px}
  .card-val{font-size:24px;font-weight:bold}
  .card-sub{font-size:11px;color:#888;margin-top:4px;font-family:sans-serif}
  table{width:100%;border-collapse:collapse;font-size:12px;font-family:sans-serif}
  th{text-align:left;padding:8px 10px;background:#F8F6F1;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#888}
  td{padding:8px 10px;border-bottom:1px solid #E8E3D9}
  @page{size:A4;margin:16mm}
  @media print{body{padding:0}}
</style>
</head>
<body>
  <div class="cap">Aurora · Relatório Financeiro</div>
  <h1>${clientName}</h1>
  <div class="sub">Período: ${periodoLabel} &nbsp;·&nbsp; Gerado em ${today}</div>

  <div class="sec">
    <div class="sec-title">Demonstrativo de Fluxo de Caixa</div>
    <div class="g4">
      <div class="card"><div class="card-lbl">Receitas</div><div class="card-val" style="color:#8FA688">${brl(d.receitas)}</div></div>
      <div class="card"><div class="card-lbl">Despesas</div><div class="card-val" style="color:#B8956A">${brl(d.despesas)}</div></div>
      <div class="card"><div class="card-lbl">Saldo do Período</div><div class="card-val" style="color:${d.resultado >= 0 ? "#8FA688" : "#B8956A"}">${brl(d.resultado)}</div></div>
      <div class="card"><div class="card-lbl">Lançamentos</div><div class="card-val" style="color:#1B3950">${txs.length}</div></div>
    </div>
  </div>

  ${
    d.despesas > 0
      ? `<div class="sec">
    <div class="sec-title">Composição das Despesas</div>
    <div class="g2">
      <div class="card"><div class="card-lbl">Despesas Fixas</div><div class="card-val" style="color:#1B3950">${brl(d.fixos)}</div><div class="card-sub">${fixosPct}% das despesas</div></div>
      <div class="card"><div class="card-lbl">Despesas Variáveis</div><div class="card-val" style="color:#B8956A">${brl(d.variaveis)}</div><div class="card-sub">${varPct}% das despesas</div></div>
    </div>
  </div>`
      : ""
  }

  <div class="sec">
    <div class="sec-title">DRE — Demonstrativo do Resultado do Exercício</div>
    <table>
      <thead><tr><th>Conta</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>
        ${dreRows}
        <tr style="background:#1B3950">
          <td style="font-weight:700;font-size:13px;padding:12px 10px;color:#fff">= Resultado Líquido do Período</td>
          <td style="text-align:right;font-weight:700;font-size:15px;color:${dre.resultadoLiquido >= 0 ? "#A8D5A2" : "#F4A57E"};padding:12px 10px">${brl(dre.resultadoLiquido)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="sec">
    <div class="sec-title">Projeção — Próximos 90 dias</div>
    <table>
      <thead><tr><th>Mês</th><th>Receitas Previstas</th><th>Despesas Previstas</th><th>Resultado Previsto</th></tr></thead>
      <tbody>${projRows}</tbody>
    </table>
  </div>

  <div style="margin-top:48px;padding-top:16px;border-top:1px solid #E8E3D9;font-size:11px;color:#aaa;font-family:sans-serif">
    Aurora · ${today}
  </div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;border:none";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument ?? iframe.contentWindow!.document;
  doc.open();
  doc.write(html);
  doc.close();
  iframe.contentWindow!.focus();
  iframe.contentWindow!.print();
  setTimeout(() => document.body.removeChild(iframe), 1000);
}

function exportExcel(
  clientName: string,
  periodoLabel: string,
  startDate: string,
  endDate: string,
  txs: Tx[],
  forecast: ForecastMonth[],
  catMap: Map<string, CatInfo>
) {
  const d = computeReport(txs);
  const dre = computeDRE(txs, catMap);
  const wb = XLSX.utils.book_new();

  const lancamentos = txs.map((t) => ({
    Data: t.date,
    Descrição: t.description,
    Valor: t.amount,
    Categoria: t.category ?? "",
    Tipo: t.amount >= 0 ? "Receita" : "Despesa",
    Recorrente: t.is_recurring ? "Sim" : "Não",
    "Parcela Nº": t.installment_number ?? "",
    "Total Parcelas": t.installment_total ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lancamentos), "Lançamentos");

  const dfcRows = [
    { Indicador: "Período", Valor: periodoLabel },
    { Indicador: "Receitas", Valor: d.receitas },
    { Indicador: "Despesas", Valor: d.despesas },
    { Indicador: "Saldo do Período", Valor: d.resultado },
    { Indicador: "Despesas Fixas", Valor: d.fixos },
    { Indicador: "Despesas Variáveis", Valor: d.variaveis },
    { Indicador: "Nº de Lançamentos", Valor: txs.length },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dfcRows), "DFC");

  const dreXlsx: { Linha: string; Categoria: string; Valor: number | string }[] = [];
  for (const g of dre.groups) {
    const prefix = g.isExpense ? "(−) " : "";
    dreXlsx.push({ Linha: `${prefix}${g.name.toUpperCase()}`, Categoria: "", Valor: "" });
    for (const l of g.lines) {
      dreXlsx.push({ Linha: "", Categoria: l.cat, Valor: g.isExpense ? -l.total : l.total });
    }
    dreXlsx.push({ Linha: `Subtotal ${g.name}`, Categoria: "", Valor: g.isExpense ? -g.subtotal : g.subtotal });
    dreXlsx.push({ Linha: "", Categoria: "", Valor: "" });
    if (g.name === "Despesa Variável") {
      dreXlsx.push({ Linha: "= RESULTADO OPERACIONAL (EBITDA)", Categoria: "", Valor: dre.ebitda });
      dreXlsx.push({ Linha: "", Categoria: "", Valor: "" });
    }
  }
  dreXlsx.push({ Linha: "= RESULTADO LÍQUIDO DO PERÍODO", Categoria: "", Valor: dre.resultadoLiquido });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dreXlsx), "DRE");

  const instTxs = txs.filter((t) => t.installment_group_id);
  const instRows = instTxs.length > 0
    ? instTxs.map((t) => ({
        Data: t.date,
        Descrição: t.description,
        "Valor Parcela": Math.abs(t.amount),
        "Parcela Nº": t.installment_number ?? "",
        "Total Parcelas": t.installment_total ?? "",
        "Parcelas Restantes": (t.installment_total ?? 0) - (t.installment_number ?? 0),
        Grupo: t.installment_group_id ?? "",
      }))
    : [{ Data: "", Descrição: "Nenhum parcelamento neste período", "Valor Parcela": "", "Parcela Nº": "", "Total Parcelas": "", "Parcelas Restantes": "", Grupo: "" }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(instRows), "Parcelamentos");

  const projRows = forecast.map((p) => ({
    Mês: p.mes,
    "Receitas Previstas": Math.round(p.rec * 100) / 100,
    "Despesas Previstas": Math.round(p.des * 100) / 100,
    "Resultado Previsto": Math.round((p.rec - p.des) * 100) / 100,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projRows), "Projeção");

  XLSX.writeFile(wb, `Relatorio_${clientName.replace(/\s+/g, "_")}_${startDate}_${endDate}.xlsx`);
}

// ─── tipos para histórico ─────────────────────────────────────────────────────
interface ExportRecord {
  id: string;
  client_id: string;
  client_name: string;
  type: "pdf" | "xlsx";
  period_label: string;
  start_date: string;
  end_date: string;
  exported_at: string;
  forecast_json: ForecastMonth[] | null;
}

// ─── componente principal ─────────────────────────────────────────────────────
type RelTab = "exportar" | "historico";

function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<RelTab>("exportar");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<Record<string, ClientPeriod>>({});
  const [exporting, setExporting] = useState<Record<string, "pdf" | "excel" | null>>({});
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histFilter, setHistFilter] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    supabase()
      .from("clients")
      .select("id, name, last_upload_at")
      .order("name")
      .then(({ data }) => {
        const cls = (data ?? []) as ClientRow[];
        setClients(cls);
        const defaults: Record<string, ClientPeriod> = {};
        for (const c of cls) defaults[c.id] = { start: firstOfMonthISO(-1), end: lastOfMonthISO(-1) };
        setPeriods(defaults);
        setLoading(false);
      });
  }, []);

  function loadHistory() {
    setHistLoading(true);
    supabase()
      .from("report_exports")
      .select("*")
      .order("exported_at", { ascending: false })
      .then(({ data }) => {
        setHistory((data ?? []) as ExportRecord[]);
        setHistLoading(false);
      });
  }

  useEffect(() => { loadHistory(); }, []);

  async function saveExportRecord(clientId: string, clientName: string, type: "pdf" | "xlsx", p: ClientPeriod, forecast: ForecastMonth[]) {
    await supabase().from("report_exports").insert({
      client_id: clientId,
      client_name: clientName,
      type,
      period_label: `${fmtLabel(p.start)} – ${fmtLabel(p.end)}`,
      start_date: p.start,
      end_date: p.end,
      forecast_json: forecast,
    });
    loadHistory();
  }

  async function deleteExportRecord(id: string) {
    setDeletingId(id);
    await supabase().from("report_exports").delete().eq("id", id);
    setHistory((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);
  }

  function setPeriod(clientId: string, field: "start" | "end", value: string) {
    setPeriods((prev) => ({ ...prev, [clientId]: { ...prev[clientId], [field]: value } }));
  }

  async function fetchTxs(clientId: string, p: ClientPeriod): Promise<Tx[]> {
    const { data } = await supabase()
      .from("transactions")
      .select("date, description, amount, category, is_recurring, installment_number, installment_total, installment_group_id")
      .eq("client_id", clientId)
      .eq("status", "approved")
      .gte("date", p.start)
      .lte("date", p.end)
      .order("date");
    return (data ?? []) as Tx[];
  }

  async function fetchForecast(clientId: string, p: ClientPeriod): Promise<ForecastMonth[]> {
    const endDt = new Date(p.end + "T12:00:00");
    const mm = endDt.getMonth() + 1;
    const yyyy = endDt.getFullYear();
    const histStart = new Date(yyyy, mm - 1 - 5, 1);
    const histStartStr = `${histStart.getFullYear()}-${String(histStart.getMonth() + 1).padStart(2, "0")}-01`;

    const [{ data: histData }, { data: instData }, { data: payablesData }] = await Promise.all([
      supabase()
        .from("transactions")
        .select("date, amount, is_recurring")
        .eq("client_id", clientId)
        .eq("status", "approved")
        .gte("date", histStartStr)
        .lte("date", p.end),
      supabase()
        .from("transactions")
        .select("amount, installment_number, installment_total, date, installment_group_id")
        .eq("client_id", clientId)
        .eq("status", "approved")
        .not("installment_group_id", "is", null),
      supabase()
        .from("payables")
        .select("type, amount, due_date")
        .eq("client_id", clientId)
        .is("paid_at", null),
    ]);

    type InstRow = { amount: number; installment_number: number; installment_total: number; date: string; installment_group_id: string };
    const rows = (instData ?? []) as InstRow[];
    const groupMap = new Map<string, InstRow>();
    for (const row of rows) {
      const cur = groupMap.get(row.installment_group_id);
      if (!cur || row.installment_number > cur.installment_number) groupMap.set(row.installment_group_id, row);
    }
    const installments = Array.from(groupMap.values()).filter((r) => r.installment_number < r.installment_total);

    return computeForecastMonths(
      (histData ?? []) as { date: string; amount: number; is_recurring: boolean }[],
      installments,
      mm,
      yyyy,
      (payablesData ?? []) as PayableProjection[],
    );
  }

  async function handlePDF(clientId: string) {
    const p = periods[clientId];
    if (!p) return;
    setExporting((e) => ({ ...e, [clientId]: "pdf" }));
    const [txs, forecast, catMap] = await Promise.all([fetchTxs(clientId, p), fetchForecast(clientId, p), fetchCategories(clientId)]);
    const client = clients.find((c) => c.id === clientId)!;
    setExporting((e) => ({ ...e, [clientId]: null }));
    openPrintReport(client.name, `${fmtLabel(p.start)} – ${fmtLabel(p.end)}`, txs, forecast, catMap);
    saveExportRecord(clientId, client.name, "pdf", p, forecast);
  }

  async function handleExcel(clientId: string) {
    const p = periods[clientId];
    if (!p) return;
    setExporting((e) => ({ ...e, [clientId]: "excel" }));
    const [txs, forecast, catMap] = await Promise.all([fetchTxs(clientId, p), fetchForecast(clientId, p), fetchCategories(clientId)]);
    const client = clients.find((c) => c.id === clientId)!;
    exportExcel(client.name, `${fmtLabel(p.start)} – ${fmtLabel(p.end)}`, p.start, p.end, txs, forecast, catMap);
    setExporting((e) => ({ ...e, [clientId]: null }));
    saveExportRecord(clientId, client.name, "xlsx", p, forecast);
  }

  const [reexporting, setReexporting] = useState<string | null>(null);

  async function handleReexport(r: ExportRecord) {
    setReexporting(r.id);
    const p: ClientPeriod = { start: r.start_date, end: r.end_date };
    const [txs, catMap] = await Promise.all([fetchTxs(r.client_id, p), fetchCategories(r.client_id)]);
    const forecast = r.forecast_json ?? await fetchForecast(r.client_id, p);
    if (r.type === "pdf") {
      openPrintReport(r.client_name, r.period_label, txs, forecast, catMap);
    } else {
      exportExcel(r.client_name, r.period_label, r.start_date, r.end_date, txs, forecast, catMap);
    }
    setReexporting(null);
  }

  const filteredHistory = histFilter
    ? history.filter((r) => r.client_id === histFilter)
    : history;

  return (
    <AdminLayout>
      <PageHeader
        cap="Entregas aos clientes"
        title="Relatórios"
        emphasis="financeiros"
        description="Exporte DFC + DFC Gerencial por cliente e consulte o histórico de documentos gerados."
      />

      {/* Tab bar */}
      <div className="flex gap-1 px-8 lg:px-12 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
        {([{ key: "exportar", label: "Exportar" }, { key: "historico", label: "Histórico" }] as { key: RelTab; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 text-[11px] uppercase transition-all"
            style={{
              letterSpacing: "2px",
              fontWeight: 600,
              borderRadius: "999px",
              background: activeTab === tab.key ? "var(--green)" : "transparent",
              color: activeTab === tab.key ? "#fff" : "var(--muted-foreground)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-8 lg:px-12 pb-12 flex flex-col gap-6 pt-6">

        {/* ── Aba: Exportar ─────────────────────────────────────────────────────── */}
        {activeTab === "exportar" && (
        <div className="aurora-card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--linen)" }}>
                {["Cliente", "Período", "Último extrato", "Formato", "Exportar"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500, borderBottom: "1px solid var(--line)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    Carregando clientes...
                  </td>
                </tr>
              )}
              {!loading && clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
              {!loading && clients.map((c, i) => {
                const p = periods[c.id] ?? { start: firstOfMonthISO(-1), end: lastOfMonthISO(-1) };
                const hasData = !!c.last_upload_at;
                const isExp = exporting[c.id];

                return (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderTop: "1px solid var(--line)" }}>
                    <td className="px-6 py-4 text-[13px]" style={{ fontWeight: 500 }}>{c.name}</td>

                    {/* Seletor de período: De / Até por cliente */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase" style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)", fontWeight: 500 }}>De</span>
                        <input
                          type="date"
                          value={p.start}
                          max={p.end}
                          onChange={(e) => setPeriod(c.id, "start", e.target.value)}
                          className="text-[11px] px-2 py-1 outline-none"
                          style={{ border: "1px solid var(--line)", color: "var(--foreground)", background: "#fff", minWidth: 120 }}
                        />
                        <span className="text-[10px] uppercase" style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)", fontWeight: 500 }}>Até</span>
                        <input
                          type="date"
                          value={p.end}
                          min={p.start}
                          max={todayISO()}
                          onChange={(e) => setPeriod(c.id, "end", e.target.value)}
                          className="text-[11px] px-2 py-1 outline-none"
                          style={{ border: "1px solid var(--line)", color: "var(--foreground)", background: "#fff", minWidth: 120 }}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                      {c.last_upload_at ? `Importado em ${formatDatePtBR(c.last_upload_at)}` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {hasData ? (
                        <span className="aurora-badge aurora-badge--ok text-[11px]">DFC + Gerencial</span>
                      ) : (
                        <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Sem dados</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePDF(c.id)}
                          disabled={!hasData || !!isExp}
                          className="text-[10px] uppercase px-3 py-1.5 disabled:opacity-40 transition-opacity"
                          style={{ border: "1px solid var(--navy)", color: "var(--navy)", letterSpacing: "1.5px" }}
                        >
                          {isExp === "pdf" ? "..." : "PDF ↓"}
                        </button>
                        <button
                          onClick={() => handleExcel(c.id)}
                          disabled={!hasData || !!isExp}
                          className="text-[10px] uppercase px-3 py-1.5 disabled:opacity-40 transition-opacity"
                          style={{ border: "1px solid var(--green)", color: "var(--green)", letterSpacing: "1.5px" }}
                        >
                          {isExp === "excel" ? "..." : "Excel ↓"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {/* ── Aba: Histórico ────────────────────────────────────────────────────── */}
        {activeTab === "historico" && (
          <div className="aurora-card p-0 overflow-hidden">
            {/* Filtro por cliente */}
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--line)", background: "var(--linen)" }}>
              <span className="aurora-cap">Filtrar por cliente</span>
              <select
                value={histFilter}
                onChange={(e) => setHistFilter(e.target.value)}
                className="bg-white px-3 py-1.5 text-[12px]"
                style={{ border: "1px solid var(--line)", minWidth: 200 }}
              >
                <option value="">Todos os clientes</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--linen)" }}>
                  {["Cliente", "Período", "Tipo", "Exportado em", ""].map((h) => (
                    <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500, borderBottom: "1px solid var(--line)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {histLoading && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>Carregando...</td></tr>
                )}
                {!histLoading && filteredHistory.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>Nenhum relatório exportado ainda.</td></tr>
                )}
                {!histLoading && filteredHistory.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF8", borderTop: "1px solid var(--line)" }}>
                    <td className="px-6 py-3 text-[13px]" style={{ fontWeight: 500 }}>{r.client_name}</td>
                    <td className="px-6 py-3 text-[12px]">{r.period_label}</td>
                    <td className="px-6 py-3">
                      <span
                        className="text-[10px] uppercase px-2 py-0.5"
                        style={{
                          border: `1px solid ${r.type === "pdf" ? "var(--navy)" : "var(--green)"}`,
                          color: r.type === "pdf" ? "var(--navy)" : "var(--green)",
                          borderRadius: "4px",
                          letterSpacing: "1.5px",
                        }}
                      >
                        {r.type === "pdf" ? "PDF" : "Excel"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                      {new Date(r.exported_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleReexport(r)}
                        disabled={reexporting === r.id}
                        className="aurora-link text-[11px] mr-4 disabled:opacity-40"
                      >
                        {reexporting === r.id ? "..." : r.type === "pdf" ? "Abrir PDF" : "Baixar Excel"}
                      </button>
                      <button
                        onClick={() => deleteExportRecord(r.id)}
                        disabled={deletingId === r.id}
                        className="text-[11px] transition-opacity hover:opacity-70 disabled:opacity-40"
                        style={{ color: "var(--tan)" }}
                      >
                        {deletingId === r.id ? "..." : "Excluir"}
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
