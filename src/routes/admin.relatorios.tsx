import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl, formatDatePtBR, monthRangeDates } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { computeForecastMonths, type ForecastMonth } from "@/hooks/useDFCForecast";

export const Route = createFileRoute("/admin/relatorios")({
  component: RelatoriosPage,
  head: () => ({ meta: [{ title: "Relatórios · Aurora" }] }),
});

interface ClientRow {
  id: string;
  name: string;
  last_upload_at: string | null;
}

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

interface CatInfo { group_name: string; type: string }
interface DREGroup { name: string; lines: { cat: string; total: number }[]; subtotal: number }
interface DREData { groups: DREGroup[]; resultado: number }

const DRE_GROUP_ORDER = ["Receita", "Despesa Fixa", "Despesa Variável", "Investimento", "Outros"];

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

function computeDRE(txs: Tx[], catMap: Map<string, CatInfo>): DREData {
  const groupMap = new Map<string, Map<string, number>>();
  for (const tx of txs) {
    const info = catMap.get(tx.category ?? "");
    const groupName = info?.group_name ?? "Outros";
    if (!groupMap.has(groupName)) groupMap.set(groupName, new Map());
    const cats = groupMap.get(groupName)!;
    const cat = tx.category ?? "Sem categoria";
    cats.set(cat, (cats.get(cat) ?? 0) + tx.amount);
  }
  const groups: DREGroup[] = [];
  for (const groupName of DRE_GROUP_ORDER) {
    const cats = groupMap.get(groupName);
    if (!cats) continue;
    const lines = Array.from(cats.entries())
      .map(([cat, total]) => ({ cat, total }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    groups.push({ name: groupName, lines, subtotal });
  }
  const resultado = groups.reduce((s, g) => s + g.subtotal, 0);
  return { groups, resultado };
}

function openPrintReport(clientName: string, period: string, txs: Tx[], forecast: ForecastMonth[], catMap: Map<string, CatInfo>) {
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

  const dreRows = dre.groups.map((g) => {
    const isReceita = g.name === "Receita";
    const color = isReceita ? "#8FA688" : "#B8956A";
    const lineRows = g.lines.map((l) =>
      `<tr>
        <td style="padding-left:24px;color:#555">${l.cat}</td>
        <td style="text-align:right;color:${l.total >= 0 ? "#8FA688" : "#B8956A"}">${brl(l.total)}</td>
      </tr>`
    ).join("");
    return `<tr style="background:#F8F6F1">
        <td style="font-weight:600;padding:8px 10px;letter-spacing:1px;font-size:11px;text-transform:uppercase;font-family:sans-serif;color:#555">${g.name}</td>
        <td></td>
      </tr>
      ${lineRows}
      <tr style="border-top:1px solid #E8E3D9">
        <td style="font-weight:500;font-family:sans-serif;font-size:12px;padding-left:8px">Total ${g.name}</td>
        <td style="text-align:right;font-weight:600;color:${color}">${brl(g.subtotal)}</td>
      </tr>
      <tr><td colspan="2" style="padding:4px"></td></tr>`;
  }).join("");

  const fixosPct = d.despesas > 0 ? ((d.fixos / d.despesas) * 100).toFixed(1) : "0";
  const varPct = d.despesas > 0 ? ((d.variaveis / d.despesas) * 100).toFixed(1) : "0";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório — ${clientName} — ${period}</title>
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
  <div class="sub">Período: ${period} &nbsp;·&nbsp; Gerado em ${today}</div>

  <div class="sec">
    <div class="sec-title">Demonstrativo de Fluxo de Caixa</div>
    <div class="g4">
      <div class="card"><div class="card-lbl">Receitas</div><div class="card-val" style="color:#8FA688">${brl(d.receitas)}</div></div>
      <div class="card"><div class="card-lbl">Despesas</div><div class="card-val" style="color:#B8956A">${brl(d.despesas)}</div></div>
      <div class="card"><div class="card-lbl">Resultado</div><div class="card-val" style="color:${d.resultado >= 0 ? "#8FA688" : "#B8956A"}">${brl(d.resultado)}</div></div>
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
    <div class="sec-title">Demonstrativo de Resultado do Exercício (DRE)</div>
    <table>
      <thead><tr><th>Conta</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>
        ${dreRows}
        <tr style="border-top:2px solid #1B3950">
          <td style="font-weight:700;font-size:13px;padding:10px">Resultado Líquido</td>
          <td style="text-align:right;font-weight:700;font-size:15px;color:${dre.resultado >= 0 ? "#8FA688" : "#B8956A"};padding:10px">${brl(dre.resultado)}</td>
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

  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) {
    alert("Habilite popups para gerar o PDF.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

function exportExcel(clientName: string, period: string, txs: Tx[], forecast: ForecastMonth[], catMap: Map<string, CatInfo>) {
  const d = computeReport(txs);
  const dre = computeDRE(txs, catMap);
  const wb = XLSX.utils.book_new();

  // Aba 1: Lançamentos
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

  // Aba 2: DFC Resumo
  const dfcRows = [
    { Indicador: "Receitas", Valor: d.receitas },
    { Indicador: "Despesas", Valor: d.despesas },
    { Indicador: "Resultado", Valor: d.resultado },
    { Indicador: "Despesas Fixas", Valor: d.fixos },
    { Indicador: "Despesas Variáveis", Valor: d.variaveis },
    { Indicador: "Nº de Lançamentos", Valor: txs.length },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dfcRows), "DFC");

  // Aba 3: DRE estruturada por grupo
  const dreXlsx: { Grupo: string; Categoria: string; Valor: number }[] = [];
  for (const g of dre.groups) {
    for (const l of g.lines) {
      dreXlsx.push({ Grupo: g.name, Categoria: l.cat, Valor: l.total });
    }
    dreXlsx.push({ Grupo: `Total ${g.name}`, Categoria: "", Valor: g.subtotal });
    dreXlsx.push({ Grupo: "", Categoria: "", Valor: 0 });
  }
  dreXlsx.push({ Grupo: "RESULTADO LÍQUIDO", Categoria: "", Valor: dre.resultado });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dreXlsx), "DRE");

  // Aba 4: Parcelamentos
  const instTxs = txs.filter((t) => t.installment_group_id);
  const instRows =
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
      : [{ Data: "", Descrição: "Nenhum parcelamento neste período", "Valor Parcela": "", "Parcela Nº": "", "Total Parcelas": "", "Parcelas Restantes": "", Grupo: "" }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(instRows), "Parcelamentos");

  // Aba 5: Projeção
  const projRows = forecast.map((p) => ({
    Mês: p.mes,
    "Receitas Previstas": Math.round(p.rec * 100) / 100,
    "Despesas Previstas": Math.round(p.des * 100) / 100,
    "Resultado Previsto": Math.round((p.rec - p.des) * 100) / 100,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projRows), "Projeção");

  XLSX.writeFile(wb, `Relatorio_${clientName.replace(/\s+/g, "_")}_${period.replace("/", "-")}.xlsx`);
}

function RelatoriosPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<Record<string, string[]>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<Record<string, "pdf" | "excel" | null>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: clientsData } = await supabase()
        .from("clients")
        .select("id, name, last_upload_at")
        .order("name");

      const cls = (clientsData ?? []) as ClientRow[];
      setClients(cls);

      if (cls.length === 0) {
        setLoading(false);
        return;
      }

      const { data: txDates } = await supabase()
        .from("transactions")
        .select("client_id, date")
        .in("client_id", cls.map((c) => c.id))
        .eq("status", "approved")
        .order("date", { ascending: false });

      const periodsMap: Record<string, string[]> = {};
      const seen: Record<string, Set<string>> = {};
      for (const row of txDates ?? []) {
        const [yyyy, mm] = (row.date as string).split("-");
        const p = `${mm}/${yyyy}`;
        if (!seen[row.client_id]) seen[row.client_id] = new Set();
        if (!seen[row.client_id].has(p)) {
          seen[row.client_id].add(p);
          if (!periodsMap[row.client_id]) periodsMap[row.client_id] = [];
          periodsMap[row.client_id].push(p);
        }
      }
      setAvailablePeriods(periodsMap);

      const defaults: Record<string, string> = {};
      for (const [cid, periods] of Object.entries(periodsMap)) {
        if (periods.length > 0) defaults[cid] = periods[0];
      }
      setSelectedPeriod(defaults);
      setLoading(false);
    }
    load();
  }, []);

  async function fetchTxs(clientId: string, period: string): Promise<Tx[]> {
    const { start, end } = monthRangeDates(period);
    const { data } = await supabase()
      .from("transactions")
      .select(
        "date, description, amount, category, is_recurring, installment_number, installment_total, installment_group_id"
      )
      .eq("client_id", clientId)
      .eq("status", "approved")
      .gte("date", start)
      .lte("date", end)
      .order("date");
    return (data ?? []) as Tx[];
  }

  // Busca 6 meses históricos + parcelas e calcula projeção com a mesma lógica do useDFCForecast.
  async function fetchForecast(clientId: string, period: string): Promise<ForecastMonth[]> {
    const [mm, yyyy] = period.split("/").map(Number);
    const histStart = new Date(yyyy, mm - 1 - 5, 1);
    const startDate = `${histStart.getFullYear()}-${String(histStart.getMonth() + 1).padStart(2, "0")}-01`;
    const endDate = `${yyyy}-${String(mm).padStart(2, "0")}-31`;

    const [{ data: histData }, { data: instData }] = await Promise.all([
      supabase()
        .from("transactions")
        .select("date, amount, is_recurring")
        .eq("client_id", clientId)
        .eq("status", "approved")
        .gte("date", startDate)
        .lte("date", endDate),
      supabase()
        .from("transactions")
        .select("amount, installment_number, installment_total, date, installment_group_id")
        .eq("client_id", clientId)
        .eq("status", "approved")
        .not("installment_group_id", "is", null),
    ]);

    // Deduplica parcelamentos por grupo (mantém parcela mais recente)
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
      yyyy
    );
  }

  async function handlePDF(clientId: string) {
    const period = selectedPeriod[clientId];
    if (!period) return;
    setExporting((e) => ({ ...e, [clientId]: "pdf" }));
    const [txs, forecast, catMap] = await Promise.all([
      fetchTxs(clientId, period),
      fetchForecast(clientId, period),
      fetchCategories(clientId),
    ]);
    const client = clients.find((c) => c.id === clientId)!;
    setExporting((e) => ({ ...e, [clientId]: null }));
    openPrintReport(client.name, period, txs, forecast, catMap);
  }

  async function handleExcel(clientId: string) {
    const period = selectedPeriod[clientId];
    if (!period) return;
    setExporting((e) => ({ ...e, [clientId]: "excel" }));
    const [txs, forecast, catMap] = await Promise.all([
      fetchTxs(clientId, period),
      fetchForecast(clientId, period),
      fetchCategories(clientId),
    ]);
    const client = clients.find((c) => c.id === clientId)!;
    exportExcel(client.name, period, txs, forecast, catMap);
    setExporting((e) => ({ ...e, [clientId]: null }));
  }

  return (
    <AdminLayout>
      <PageHeader
        cap="Entregas mensais"
        title="Relatórios"
        emphasis="gerados"
        description="Histórico de relatórios entregues aos clientes da carteira."
      />
      <div className="px-8 lg:px-12 pb-12">
        <div className="aurora-card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--linen)" }}>
                {["Cliente", "Período", "Último extrato", "Tipo", "Ações"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 aurora-cap"
                    style={{ fontWeight: 500, borderBottom: "1px solid var(--line)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-[12px]"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Carregando clientes...
                  </td>
                </tr>
              )}
              {!loading && clients.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-[12px]"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
              {!loading &&
                clients.map((c, i) => {
                  const periods = availablePeriods[c.id] ?? [];
                  const period = selectedPeriod[c.id];
                  const hasData = periods.length > 0;
                  const isExp = exporting[c.id];

                  return (
                    <tr
                      key={c.id}
                      style={{
                        background: i % 2 === 0 ? "#fff" : "#FAFAF8",
                        borderTop: "1px solid var(--line)",
                      }}
                    >
                      <td className="px-6 py-4 text-[13px]" style={{ fontWeight: 500 }}>
                        {c.name}
                      </td>
                      <td className="px-6 py-4">
                        {hasData ? (
                          <select
                            value={period ?? ""}
                            onChange={(e) =>
                              setSelectedPeriod((sp) => ({ ...sp, [c.id]: e.target.value }))
                            }
                            className="text-[12px] px-2 py-1"
                            style={{ border: "1px solid var(--line)", background: "#fff" }}
                          >
                            {periods.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="text-[12px]"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td
                        className="px-6 py-4 text-[12px]"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {c.last_upload_at
                          ? `Importado em ${formatDatePtBR(c.last_upload_at)}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {hasData ? (
                          <span className="aurora-badge aurora-badge--ok text-[11px]">
                            DFC + DRE
                          </span>
                        ) : (
                          <span
                            className="text-[11px]"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Sem dados
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePDF(c.id)}
                            disabled={!hasData || !!isExp}
                            className="text-[10px] uppercase px-3 py-1.5 disabled:opacity-40 transition-opacity"
                            style={{
                              border: "1px solid var(--navy)",
                              color: "var(--navy)",
                              letterSpacing: "1.5px",
                            }}
                          >
                            {isExp === "pdf" ? "..." : "PDF ↓"}
                          </button>
                          <button
                            onClick={() => handleExcel(c.id)}
                            disabled={!hasData || !!isExp}
                            className="text-[10px] uppercase px-3 py-1.5 disabled:opacity-40 transition-opacity"
                            style={{
                              border: "1px solid var(--green)",
                              color: "var(--green)",
                              letterSpacing: "1.5px",
                            }}
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
      </div>
    </AdminLayout>
  );
}
