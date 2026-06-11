// ============================================================
// Aurora · Edge Function: parse-extract
// Lê um arquivo de extrato bancário do Storage,
// detecta o formato (CSV ou XLSX) e insere os lançamentos
// na tabela transactions.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedTransaction {
  date: string;
  description: string;
  raw_description: string;
  amount: number;
  bank: string;
}

interface BankConfig {
  separator: string;
  dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";
  colDate: number;
  colDesc: number;
  colAmount: number;
  skipRows: number;
  skipKeywords: string[];
  negateAmount?: boolean;
}

const BANK_CONFIGS: Record<string, BankConfig> = {
  nubank: { separator: ",", dateFormat: "YYYY-MM-DD", colDate: 0, colDesc: 2, colAmount: 3, skipRows: 1, skipKeywords: [] },
  itau: { separator: ";", dateFormat: "DD/MM/YYYY", colDate: 0, colDesc: 1, colAmount: 2, skipRows: 3, skipKeywords: ["Saldo", "SALDO", "Total", "TOTAL"] },
  bradesco: { separator: ";", dateFormat: "DD/MM/YYYY", colDate: 0, colDesc: 2, colAmount: 4, skipRows: 4, skipKeywords: ["Saldo", "SALDO", "Total"] },
  inter: { separator: ",", dateFormat: "DD/MM/YYYY", colDate: 0, colDesc: 1, colAmount: 3, skipRows: 1, skipKeywords: ["Saldo"] },
  "banco do brasil": { separator: "\t", dateFormat: "DD/MM/YYYY", colDate: 0, colDesc: 2, colAmount: 3, skipRows: 2, skipKeywords: ["Saldo", "S A L D O"] },
  santander: { separator: ";", dateFormat: "DD/MM/YYYY", colDate: 0, colDesc: 1, colAmount: 3, skipRows: 2, skipKeywords: ["Saldo", "Total"] },
};

function parseDate(raw: string, format: BankConfig["dateFormat"]): string {
  raw = raw.trim().split(" ")[0];
  if (format === "YYYY-MM-DD") return raw;
  if (format === "DD/MM/YYYY") {
    const [d, m, y] = raw.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (format === "MM/DD/YYYY") {
    const [m, d, y] = raw.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return raw;
}

function parseAmount(raw: string): number {
  const cleaned = raw.trim().replace(/\./g, "").replace(",", ".").replace(/[^0-9.\-]/g, "");
  return parseFloat(cleaned) || 0;
}

function cleanDescription(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

function parseCSV(text: string, bankName: string): ParsedTransaction[] {
  const normalized = bankName.toLowerCase().trim().normalize("NFD");
  const key = normalized.replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
  const config = BANK_CONFIGS[key];
  if (!config) {
    throw new Error(`Banco "${bankName}" (normalizado: "${key}") não configurado. Bancos suportados: ${Object.keys(BANK_CONFIGS).join(", ")}`);
  }
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const transactions: ParsedTransaction[] = [];
  for (let i = config.skipRows; i < lines.length; i++) {
    const line = lines[i];
    if (config.skipKeywords.some((kw) => line.includes(kw))) continue;
    const cols = line.split(config.separator).map((c) => c.replace(/^"|"$/g, ""));
    if (cols.length < Math.max(config.colDate, config.colDesc, config.colAmount) + 1) continue;
    const rawDate = cols[config.colDate];
    const rawDesc = cols[config.colDesc];
    const rawAmount = cols[config.colAmount];
    if (!rawDate || !rawDesc || !rawAmount) continue;
    let amount = parseAmount(rawAmount);
    if (config.negateAmount) amount = -amount;
    if (amount === 0) continue;
    transactions.push({
      date: parseDate(rawDate, config.dateFormat),
      description: cleanDescription(rawDesc),
      raw_description: rawDesc.trim(),
      amount,
      bank: bankName,
    });
  }
  return transactions;
}

function parseXLSX(buffer: ArrayBuffer, bankName: string): ParsedTransaction[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const transactions: ParsedTransaction[] = [];

  let headerRow = 0;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i] as string[];
    if (row.some((c) => String(c).toLowerCase().includes("data"))) {
      headerRow = i;
      break;
    }
  }

  const header = (rows[headerRow] as string[]).map((h) => String(h).toLowerCase().trim());
  const colDate = header.findIndex((h) => h.includes("data"));
  const colDesc = header.findIndex((h) => h.includes("descri") || h.includes("hist") || h.includes("lança"));
  const colAmount = header.findIndex((h) => h.includes("valor") || h.includes("quantia") || h.includes("amount"));

  if (colDate === -1 || colDesc === -1 || colAmount === -1) {
    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (!row[0] || !row[1] || !row[2]) continue;
      const rawDate = String(row[0]);
      const rawDesc = String(row[1]);
      const amount = typeof row[2] === "number" ? row[2] : parseAmount(String(row[2]));
      if (amount === 0) continue;
      transactions.push({
        date: rawDate.includes("/") ? parseDate(rawDate, "DD/MM/YYYY") : rawDate,
        description: cleanDescription(rawDesc),
        raw_description: rawDesc.trim(),
        amount,
        bank: bankName,
      });
    }
    return transactions;
  }

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row[colDate] || !row[colDesc]) continue;
    const rawDate = String(row[colDate]);
    const rawDesc = String(row[colDesc]);
    const rawAmount = row[colAmount];
    const amount = typeof rawAmount === "number" ? rawAmount : parseAmount(String(rawAmount));
    if (amount === 0) continue;

    let dateStr = rawDate;
    if (!isNaN(Number(rawDate))) {
      const jsDate = XLSX.SSF.parse_date_code(Number(rawDate));
      dateStr = `${jsDate.y}-${String(jsDate.m).padStart(2, "0")}-${String(jsDate.d).padStart(2, "0")}`;
    } else {
      dateStr = rawDate.includes("/") ? parseDate(rawDate, "DD/MM/YYYY") : rawDate;
    }

    transactions.push({
      date: dateStr,
      description: cleanDescription(rawDesc),
      raw_description: rawDesc.trim(),
      amount,
      bank: bankName,
    });
  }

  return transactions;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { upload_id } = await req.json();

    if (!upload_id) {
      return new Response(JSON.stringify({ error: "upload_id é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: upload, error: uploadError } = await supabase
      .from("uploads").select("*").eq("id", upload_id).single();

    if (uploadError || !upload) {
      return new Response(JSON.stringify({ error: "Upload não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: fileData, error: storageError } = await supabase.storage
      .from("extratos").download(upload.storage_path);

    if (storageError || !fileData) {
      await supabase.from("uploads").update({
        status: "error",
        error_message: `Erro ao baixar arquivo: ${storageError?.message}`,
      }).eq("id", upload_id);
      return new Response(JSON.stringify({ error: "Erro ao baixar arquivo do Storage" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filename = upload.filename.toLowerCase();
    let transactions: ParsedTransaction[] = [];

    if (filename.endsWith(".csv")) {
      const text = await fileData.text();
      transactions = parseCSV(text, upload.bank_name);
    } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      const buffer = await fileData.arrayBuffer();
      transactions = parseXLSX(buffer, upload.bank_name);
    } else {
      await supabase.from("uploads").update({
        status: "error",
        error_message: `Formato não suportado: ${filename}. Use CSV ou XLSX. PDF e imagem serão adicionados em breve.`,
      }).eq("id", upload_id);
      return new Response(JSON.stringify({ error: "Formato não suportado nesta versão (CSV e XLSX disponíveis)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (transactions.length === 0) {
      await supabase.from("uploads").update({
        status: "error",
        error_message: "Nenhum lançamento encontrado no arquivo. Verifique o formato e o banco selecionado.",
      }).eq("id", upload_id);
      return new Response(JSON.stringify({ error: "Nenhum lançamento encontrado" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const txRows = transactions.map((tx) => ({
      client_id: upload.client_id,
      upload_id: upload.id,
      date: tx.date,
      description: tx.description,
      raw_description: tx.raw_description,
      amount: tx.amount,
      bank: tx.bank,
      status: "pending",
    }));

    const { error: insertError } = await supabase.from("transactions").insert(txRows);

    if (insertError) {
      await supabase.from("uploads").update({
        status: "error",
        error_message: `Erro ao salvar lançamentos: ${insertError.message}`,
      }).eq("id", upload_id);
      return new Response(JSON.stringify({ error: "Erro ao salvar transações" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("uploads").update({
      status: "parsed",
      tx_total: transactions.length,
      tx_pending: transactions.length,
    }).eq("id", upload_id);

    return new Response(JSON.stringify({
      success: true,
      upload_id,
      tx_count: transactions.length,
      message: `${transactions.length} lançamentos extraídos com sucesso`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("parse-extract error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
