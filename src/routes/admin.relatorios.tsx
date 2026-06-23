import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl, formatDatePtBR } from "@/lib/utils";
import { todayISO, firstOfMonthISO, lastOfMonthISO } from "@/lib/dateUtils";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { computeForecastMonths, type ForecastMonth, type PayableProjection } from "@/hooks/useDFCForecast";
import { computeDRE, DRE_EBITDA_PIVOT, type CatInfo } from "@/lib/dre";

export const Route = createFileRoute("/admin/relatorios")({
  component: RelatoriosPage,
  head: () => ({ meta: [{ title: "Relatórios · Aurora" }] }),
});

// ─── helpers de data ──────────────────────────────────────────────────────────
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

interface RevenueEntry {
  id: string;
  entry_date: string;
  invoice_ref: string;
  sales_channel: string;
  gross_amount: number;
  taxes_withheld: number;
}

interface ReportData {
  receitas: number;
  despesas: number;
  resultado: number;
  fixos: number;
  variaveis: number;
  byCategory: { cat: string; total: number; isReceita: boolean }[];
}

// ─── cálculos (puros) ─────────────────────────────────────────────────────────
function computeReport(txs: Tx[]): ReportData {
  const receitas = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const despesas = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const fixos = txs.filter((t) => t.amount < 0 && t.is_recurring).reduce((s, t) => s + Math.abs(t.amount), 0);
  const variaveis = txs.filter((t) => t.amount < 0 && !t.is_recurring).reduce((s, t) => s + Math.abs(t.amount), 0);
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
  catMap: Map<string, CatInfo>,
  revenues: RevenueEntry[],
  format: ReportFormat = "DFC",
) {
  const dfcTitle = format === "DFC Gerencial" ? "DFC Gerencial — Demonstrativo Executivo" : "Demonstrativo de Fluxo de Caixa";
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

  const dreRowsArr: string[] = [];
  for (const g of dre.groups) {
    const isReceita = g.name === "Receita";
    const color = isReceita ? "#8FA688" : "#B8956A";
    const prefix = isReceita ? "" : "(−) ";
    const lineRows = g.lines
      .map((l) => `<tr>
        <td style="padding-left:24px;color:#555">${l.cat}</td>
        <td style="text-align:right;color:${color}">${isReceita ? brl(l.total) : `(${brl(l.total)})`}</td>
      </tr>`)
      .join("");
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
    if (g.name === DRE_EBITDA_PIVOT) {
      dreRowsArr.push(`<tr style="background:#E8F0E4;border-top:2px solid #8FA688">
        <td style="font-weight:700;font-size:13px;padding:10px 10px;font-family:sans-serif">= Resultado Operacional (EBITDA)</td>
        <td style="text-align:right;font-weight:700;font-size:14px;color:${dre.ebitda >= 0 ? "#8FA688" : "#B8956A"};padding:10px">${brl(dre.ebitda)}</td>
      </tr><tr><td colspan="2" style="padding:4px"></td></tr>`);
    }
  }
  const dreRows = dreRowsArr.join("");

  const fixosPct = d.despesas > 0 ? ((d.fixos / d.despesas) * 100).toFixed(1) : "0";
  const varPct = d.despesas > 0 ? ((d.variaveis / d.despesas) * 100).toFixed(1) : "0";

  // Detalhamento — Receitas Brutas (regime de competência)
  const revTotalBruto = revenues.reduce((s, r) => s + Number(r.gross_amount), 0);
  const revTotalImpostos = revenues.reduce((s, r) => s + Number(r.taxes_withheld), 0);
  const revTotalLiquido = revTotalBruto - revTotalImpostos;
  const revRows = revenues.length > 0
    ? `<div style="margin-bottom:24px">
    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#888;font-family:sans-serif;margin-bottom:8px">Regime de Competência — Receitas Brutas</div>
    <table>
      <thead><tr><th>Data</th><th>NF / Referência</th><th>Canal de Venda</th><th style="text-align:right">Valor Bruto</th><th style="text-align:right">Impostos</th><th style="text-align:right">Valor Líquido</th></tr></thead>
      <tbody>
        ${revenues.map((r) => {
          const liq = Number(r.gross_amount) - Number(r.taxes_withheld);
          return `<tr>
            <td>${new Date(r.entry_date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
            <td>${r.invoice_ref || "—"}</td>
            <td>${r.sales_channel || "—"}</td>
            <td style="text-align:right;color:#8FA688">${brl(Number(r.gross_amount))}</td>
            <td style="text-align:right;color:#B8956A">(${brl(Number(r.taxes_withheld))})</td>
            <td style="text-align:right;font-weight:600">${brl(liq)}</td>
          </tr>`;
        }).join("")}
        <tr style="background:#1B3950">
          <td colspan="3" style="font-weight:700;color:#fff;padding:10px">Totais</td>
          <td style="text-align:right;color:#A8D5A2;font-weight:700;padding:10px">${brl(revTotalBruto)}</td>
          <td style="text-align:right;color:#F4A57E;font-weight:700;padding:10px">(${brl(revTotalImpostos)})</td>
          <td style="text-align:right;color:#fff;font-weight:700;padding:10px">${brl(revTotalLiquido)}</td>
        </tr>
      </tbody>
    </table>
  </div>`
    : "";

  // Detalhamento — Movimentações (regime de caixa)
  const totalEntradas = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalSaidas = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const movRows = `<div>
    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#888;font-family:sans-serif;margin-bottom:8px">Regime de Caixa — Movimentações</div>
    <table>
      <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>
        ${txs.map((t) => `<tr>
          <td>${t.date}</td>
          <td>${t.description}</td>
          <td style="color:#888">${t.category || "—"}</td>
          <td style="text-align:right;color:${t.amount >= 0 ? "#8FA688" : "#B8956A"}">${t.amount < 0 ? `(${brl(Math.abs(t.amount))})` : brl(t.amount)}</td>
        </tr>`).join("")}
        <tr style="background:#F8F6F1;border-top:1px solid #E8E3D9">
          <td colspan="3" style="font-weight:600;font-family:sans-serif;font-size:11px;padding:8px 10px">Total Entradas</td>
          <td style="text-align:right;font-weight:700;color:#8FA688">${brl(totalEntradas)}</td>
        </tr>
        <tr style="background:#F8F6F1">
          <td colspan="3" style="font-weight:600;font-family:sans-serif;font-size:11px;padding:8px 10px">Total Saídas</td>
          <td style="text-align:right;font-weight:700;color:#B8956A">(${brl(totalSaidas)})</td>
        </tr>
        <tr style="background:#1B3950">
          <td colspan="3" style="font-weight:700;color:#fff;padding:10px;font-family:sans-serif">Resultado do Período</td>
          <td style="text-align:right;font-weight:700;color:${(totalEntradas - totalSaidas) >= 0 ? "#A8D5A2" : "#F4A57E"};padding:10px">${brl(totalEntradas - totalSaidas)}</td>
        </tr>
      </tbody>
    </table>
  </div>`;

  const detSection = `<div class="sec">
    <div class="sec-title">Detalhamento</div>
    ${revRows}
    ${movRows}
  </div>`;

  // Parcelamentos
  const instTxs = txs.filter((t) => t.installment_group_id);
  const instSection = instTxs.length > 0
    ? `<div class="sec">
    <div class="sec-title">Parcelamentos</div>
    <table>
      <thead><tr><th>Data</th><th>Descrição</th><th style="text-align:right">Valor Parcela</th><th style="text-align:center">Parcela Nº</th><th style="text-align:center">Total</th></tr></thead>
      <tbody>
        ${instTxs.map((t) => `<tr>
          <td>${t.date}</td>
          <td>${t.description}</td>
          <td style="text-align:right;color:#B8956A">(${brl(Math.abs(t.amount))})</td>
          <td style="text-align:center">${t.installment_number ?? "—"}</td>
          <td style="text-align:center">${t.installment_total ?? "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Aurora</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300&family=Jost:wght@300&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,'Times New Roman',serif;color:#1B3950;background:#fff;padding:16mm}
  h1{font-size:36px;font-weight:normal;margin:16px 0 4px}
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
  @page{size:A4;margin:0}
  @media print{body{padding:16mm}}
</style>
</head>
<body>
  <svg width="200" height="69" viewBox="0 0 400 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Aurora · Gestão Financeira">
    <rect x="0" y="26" width="12" height="40" rx="6" fill="#4A6741"/>
    <rect x="17" y="14" width="12" height="52" rx="6" fill="#4A6741" opacity=".65"/>
    <rect x="34" y="4" width="12" height="62" rx="6" fill="#4A6741" opacity=".38"/>
    <text x="58" y="60" font-family="'Cormorant Garamond',serif" font-size="50" font-weight="300" fill="#1C1C19" letter-spacing="-2">Aurora</text>
    <text x="59" y="78" font-family="'Jost',sans-serif" font-size="9" font-weight="300" fill="#7A7260" letter-spacing="2.5">GESTÃO FINANCEIRA</text>
  </svg>
  <h1>${clientName}</h1>
  <div class="sub">Período: ${periodoLabel} &nbsp;·&nbsp; Gerado em ${today}</div>

  <div class="sec">
    <div class="sec-title">${dfcTitle}</div>
    <div class="g4">
      <div class="card"><div class="card-lbl">Receitas</div><div class="card-val" style="color:#8FA688">${brl(d.receitas)}</div></div>
      <div class="card"><div class="card-lbl">Despesas</div><div class="card-val" style="color:#B8956A">${brl(d.despesas)}</div></div>
      <div class="card"><div class="card-lbl">Saldo do Período</div><div class="card-val" style="color:${d.resultado >= 0 ? "#8FA688" : "#B8956A"}">${brl(d.resultado)}</div></div>
      <div class="card"><div class="card-lbl">Lançamentos</div><div class="card-val" style="color:#1B3950">${txs.length}</div></div>
    </div>
  </div>

  ${d.despesas > 0 ? `<div class="sec">
    <div class="sec-title">Composição das Despesas</div>
    <div class="g2">
      <div class="card"><div class="card-lbl">Despesas Fixas</div><div class="card-val" style="color:#1B3950">${brl(d.fixos)}</div><div class="card-sub">${fixosPct}% das despesas</div></div>
      <div class="card"><div class="card-lbl">Despesas Variáveis</div><div class="card-val" style="color:#B8956A">${brl(d.variaveis)}</div><div class="card-sub">${varPct}% das despesas</div></div>
    </div>
  </div>` : ""}

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

  ${detSection}

  ${instSection}

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
  catMap: Map<string, CatInfo>,
  revenues: RevenueEntry[],
  format: ReportFormat = "DFC",
) {
  const d = computeReport(txs);
  const dre = computeDRE(txs, catMap);
  const wb = XLSX.utils.book_new();

  // Lançamentos
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      txs.map((t) => ({
        Data: t.date,
        Descrição: t.description,
        Valor: t.amount,
        Categoria: t.category ?? "",
        Tipo: t.amount >= 0 ? "Receita" : "Despesa",
        Recorrente: t.is_recurring ? "Sim" : "Não",
        "Parcela Nº": t.installment_number ?? "",
        "Total Parcelas": t.installment_total ?? "",
      })),
    ),
    "Lançamentos",
  );

  // DFC / DFC Gerencial
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { Indicador: "Período", Valor: periodoLabel },
      { Indicador: "Receitas", Valor: d.receitas },
      { Indicador: "Despesas", Valor: d.despesas },
      { Indicador: "Saldo do Período", Valor: d.resultado },
      { Indicador: "Despesas Fixas", Valor: d.fixos },
      { Indicador: "Despesas Variáveis", Valor: d.variaveis },
      { Indicador: "Nº de Lançamentos", Valor: txs.length },
    ]),
    format === "DFC Gerencial" ? "DFC Gerencial" : "DFC",
  );

  // Receitas Brutas (regime de competência)
  if (revenues.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        revenues.map((r) => ({
          Data: r.entry_date,
          "NF / Referência": r.invoice_ref || "",
          "Canal de Venda": r.sales_channel || "",
          "Valor Bruto": Number(r.gross_amount),
          "Impostos Retidos": Number(r.taxes_withheld),
          "Valor Líquido": Number(r.gross_amount) - Number(r.taxes_withheld),
        })),
      ),
      "Receitas Brutas",
    );
  }

  // Parcelamentos
  const instTxs = txs.filter((t) => t.installment_group_id);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      instTxs.length > 0
        ? instTxs.map((t) => ({
            Data: t.date,
            Descrição: t.description,
            "Valor Parcela": Math.abs(t.amount),
            "Parcela Nº": t.installment_number ?? "",
            "Total Parcelas": t.installment_total ?? "",
            "Parcelas Restantes": (t.installment_total ?? 0) - (t.installment_number ?? 0),
            Grupo: t.installment_group_id ?? "",
          }))
        : [{ Data: "", Descrição: "Nenhum parcelamento neste período", "Valor Parcela": "", "Parcela Nº": "", "Total Parcelas": "", "Parcelas Restantes": "", Grupo: "" }],
    ),
    "Parcelamentos",
  );

  // Projeção
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      forecast.map((p) => ({
        Mês: p.mes,
        "Receitas Previstas": Math.round(p.rec * 100) / 100,
        "Despesas Previstas": Math.round(p.des * 100) / 100,
        "Resultado Previsto": Math.round((p.rec - p.des) * 100) / 100,
      })),
    ),
    "Projeção",
  );

  // DRE
  const dreXlsx: { Linha: string; Categoria: string; Valor: number | string }[] = [];
  for (const g of dre.groups) {
    const prefix = g.isExpense ? "(−) " : "";
    dreXlsx.push({ Linha: `${prefix}${g.name.toUpperCase()}`, Categoria: "", Valor: "" });
    for (const l of g.lines) {
      dreXlsx.push({ Linha: "", Categoria: l.cat, Valor: g.isExpense ? -l.total : l.total });
    }
    dreXlsx.push({ Linha: `Subtotal ${g.name}`, Categoria: "", Valor: g.isExpense ? -g.subtotal : g.subtotal });
    dreXlsx.push({ Linha: "", Categoria: "", Valor: "" });
    if (g.name === DRE_EBITDA_PIVOT) {
      dreXlsx.push({ Linha: "= RESULTADO OPERACIONAL (EBITDA)", Categoria: "", Valor: dre.ebitda });
      dreXlsx.push({ Linha: "", Categoria: "", Valor: "" });
    }
  }
  dreXlsx.push({ Linha: "= RESULTADO LÍQUIDO DO PERÍODO", Categoria: "", Valor: dre.resultadoLiquido });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dreXlsx), "DRE");

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
  report_format: string | null;
}

// ─── componente principal ─────────────────────────────────────────────────────
type RelTab = "exportar" | "historico";

const REPORT_FORMATS = ["DFC", "DFC Gerencial"] as const;
type ReportFormat = typeof REPORT_FORMATS[number];

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
      .is("deleted_at", null)
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

  async function saveExportRecord(clientId: string, clientName: string, type: "pdf" | "xlsx", p: ClientPeriod, forecast: ForecastMonth[], format: ReportFormat) {
    await supabase().from("report_exports").insert({
      client_id: clientId,
      client_name: clientName,
      type,
      period_label: `${fmtLabel(p.start)} – ${fmtLabel(p.end)}`,
      start_date: p.start,
      end_date: p.end,
      forecast_json: forecast,
      report_format: format,
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

  async function fetchRevenues(clientId: string, p: ClientPeriod): Promise<RevenueEntry[]> {
    const { data } = await (supabase() as any)
      .from("monthly_revenue_entries")
      .select("id, entry_date, invoice_ref, sales_channel, gross_amount, taxes_withheld")
      .eq("client_id", clientId)
      .gte("entry_date", p.start)
      .lte("entry_date", p.end)
      .order("entry_date");
    return (data ?? []) as RevenueEntry[];
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
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setExporting((e) => ({ ...e, [clientId]: "pdf" }));
    const [txs, forecast, catMap, revenues] = await Promise.all([
      fetchTxs(clientId, p),
      fetchForecast(clientId, p),
      fetchCategories(clientId),
      fetchRevenues(clientId, p),
    ]);
    setExporting((e) => ({ ...e, [clientId]: null }));
    openPrintReport(client.name, `${fmtLabel(p.start)} – ${fmtLabel(p.end)}`, txs, forecast, catMap, revenues, "DFC Gerencial");
    await saveExportRecord(clientId, client.name, "pdf", p, forecast, "DFC Gerencial");
  }

  async function handleExcel(clientId: string) {
    const p = periods[clientId];
    if (!p) return;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setExporting((e) => ({ ...e, [clientId]: "excel" }));
    const [txs, forecast, catMap, revenues] = await Promise.all([
      fetchTxs(clientId, p),
      fetchForecast(clientId, p),
      fetchCategories(clientId),
      fetchRevenues(clientId, p),
    ]);
    exportExcel(client.name, `${fmtLabel(p.start)} – ${fmtLabel(p.end)}`, p.start, p.end, txs, forecast, catMap, revenues, "DFC Gerencial");
    setExporting((e) => ({ ...e, [clientId]: null }));
    await saveExportRecord(clientId, client.name, "xlsx", p, forecast, "DFC Gerencial");
  }

  const [reexporting, setReexporting] = useState<string | null>(null);

  async function handleReexport(r: ExportRecord) {
    setReexporting(r.id);
    const p: ClientPeriod = { start: r.start_date, end: r.end_date };
    const format = (r.report_format ?? "DFC") as ReportFormat;
    const [txs, catMap, revenues] = await Promise.all([
      fetchTxs(r.client_id, p),
      fetchCategories(r.client_id),
      fetchRevenues(r.client_id, p),
    ]);
    const forecast = r.forecast_json ?? await fetchForecast(r.client_id, p);
    if (r.type === "pdf") {
      openPrintReport(r.client_name, r.period_label, txs, forecast, catMap, revenues, format);
    } else {
      exportExcel(r.client_name, r.period_label, r.start_date, r.end_date, txs, forecast, catMap, revenues, format);
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
                          <span
                            className="text-[10px] uppercase px-3 py-1.5"
                            style={{ letterSpacing: "1.5px", fontWeight: 500, background: "var(--navy)", color: "#fff", border: "1px solid var(--navy)" }}
                          >
                            DFC + Gerencial
                          </span>
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
                  {["Cliente", "Período", "Tipo", "Formato", "Exportado em", ""].map((h) => (
                    <th key={h} className="text-left px-6 py-3 aurora-cap" style={{ fontWeight: 500, borderBottom: "1px solid var(--line)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {histLoading && (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>Carregando...</td></tr>
                )}
                {!histLoading && filteredHistory.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>Nenhum relatório exportado ainda.</td></tr>
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
                    <td className="px-6 py-3">
                      <span
                        className="text-[10px] px-2 py-0.5"
                        style={{ border: "1px solid var(--line)", color: "var(--muted-foreground)", borderRadius: "4px", letterSpacing: "0.5px" }}
                      >
                        {r.report_format ?? "DFC"}
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
