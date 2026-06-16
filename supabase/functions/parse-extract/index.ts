// ============================================================
// Aurora · Edge Function: parse-extract
// Lê um arquivo de extrato bancário do Storage,
// detecta o formato (CSV, XLSX, PDF, imagem) e insere os
// lançamentos na tabela transactions.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import Anthropic from "npm:@anthropic-ai/sdk";

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
  nubank: {
    separator: ",",
    dateFormat: "YYYY-MM-DD",
    colDate: 0,
    colDesc: 2,
    colAmount: 3,
    skipRows: 1,
    skipKeywords: [],
  },
  itau: {
    separator: ";",
    dateFormat: "DD/MM/YYYY",
    colDate: 0,
    colDesc: 1,
    colAmount: 2,
    skipRows: 3,
    skipKeywords: ["Saldo", "SALDO", "Total", "TOTAL"],
  },
  bradesco: {
    separator: ";",
    dateFormat: "DD/MM/YYYY",
    colDate: 0,
    colDesc: 2,
    colAmount: 4,
    skipRows: 4,
    skipKeywords: ["Saldo", "SALDO", "Total"],
  },
  inter: {
    separator: ",",
    dateFormat: "DD/MM/YYYY",
    colDate: 0,
    colDesc: 1,
    colAmount: 3,
    skipRows: 1,
    skipKeywords: ["Saldo"],
  },
  "banco do brasil": {
    separator: "\t",
    dateFormat: "DD/MM/YYYY",
    colDate: 0,
    colDesc: 2,
    colAmount: 3,
    skipRows: 2,
    skipKeywords: ["Saldo", "S A L D O"],
  },
  santander: {
    separator: ";",
    dateFormat: "DD/MM/YYYY",
    colDate: 0,
    colDesc: 1,
    colAmount: 3,
    skipRows: 2,
    skipKeywords: ["Saldo", "Total"],
  },
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
  const cleaned = raw
    .trim()
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.\-]/g, "");
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
    throw new Error(
      `Banco "${bankName}" (normalizado: "${key}") não configurado. Bancos suportados: ${Object.keys(BANK_CONFIGS).join(", ")}`,
    );
  }
  const clean = text
    .replace(/^﻿/, "")
    .replace(/^\xFF\xFE/, "")
    .replace(/^\xFE\xFF/, "");
  const lines = clean
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
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
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  // defval:"" preenche células vazias com string vazia — evita arrays esparsos
  // que causam undefined.includes() no findIndex
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const transactions: ParsedTransaction[] = [];

  let headerRow = 0;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    if (row.some((c) => c !== "" && String(c).toLowerCase().includes("data"))) {
      headerRow = i;
      break;
    }
  }

  const rawHeader = Array.isArray(rows[headerRow]) ? rows[headerRow] as unknown[] : [];
  const header = rawHeader.map((h) => h != null && h !== "" ? String(h).toLowerCase().trim() : "");
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

// Converte ArrayBuffer para string base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface AITransaction {
  date: string;
  description: string;
  amount: number;
}

async function parseWithAI(fileData: Blob, filename: string, bankName: string): Promise<ParsedTransaction[]> {
  const client = new Anthropic();
  const buffer = await fileData.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  const ext = filename.toLowerCase().split(".").pop() ?? "";

  const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
  const isPDF = ext === "pdf";

  if (!isImage && !isPDF) {
    throw new Error(`parseWithAI não suporta o formato .${ext}`);
  }

  const mediaType = isPDF
    ? "application/pdf"
    : ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/gif";

  const contentBlock = isPDF
    ? {
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: mediaType as "application/pdf",
          data: base64,
        },
      }
    : {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: base64,
        },
      };

  const { content } = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          contentBlock,
          {
            type: "text",
            text: `Este é um extrato bancário do banco "${bankName}". Extraia TODOS os lançamentos financeiros.

Retorne SOMENTE um JSON array no formato abaixo, sem texto adicional:
[{"date":"YYYY-MM-DD","description":"DESCRIÇÃO EM MAIÚSCULAS","amount":valor_numerico}]

Regras:
- date: formato ISO YYYY-MM-DD obrigatório
- description: texto limpo em MAIÚSCULAS, sem caracteres especiais extras
- amount: número (positivo = crédito/entrada, negativo = débito/saída)
- Ignore linhas de saldo, totais e cabeçalhos
- Inclua TODOS os lançamentos visíveis, sem filtrar
- Se não conseguir identificar lançamentos, retorne []`,
          },
        ],
      },
    ],
  });

  const raw = content[0].type === "text" ? content[0].text.trim() : "[]";
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const parsed: AITransaction[] = JSON.parse(jsonMatch[0]);
  return parsed
    .filter((t) => t.date && t.description && t.amount !== 0)
    .map((t) => ({
      date: t.date,
      description: cleanDescription(t.description),
      raw_description: t.description.trim(),
      amount: t.amount,
      bank: bankName,
    }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { upload_id } = await req.json();

    if (!upload_id) {
      return new Response(JSON.stringify({ error: "upload_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", upload_id)
      .single();

    if (uploadError || !upload) {
      return new Response(JSON.stringify({ error: "Upload não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: fileData, error: storageError } = await supabase.storage
      .from("extratos")
      .download(upload.storage_path);

    if (storageError || !fileData) {
      await supabase
        .from("uploads")
        .update({
          status: "error",
          error_message: `Erro ao baixar arquivo: ${storageError?.message}`,
        })
        .eq("id", upload_id);
      return new Response(JSON.stringify({ error: "Erro ao baixar arquivo do Storage" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    } else if (
      filename.endsWith(".pdf") ||
      filename.endsWith(".png") ||
      filename.endsWith(".jpg") ||
      filename.endsWith(".jpeg") ||
      filename.endsWith(".webp")
    ) {
      transactions = await parseWithAI(fileData, upload.filename, upload.bank_name);
    } else {
      await supabase
        .from("uploads")
        .update({
          status: "error",
          error_message: `Formato não suportado: ${filename}. Use CSV, XLSX, PDF, PNG ou JPG.`,
        })
        .eq("id", upload_id);
      return new Response(JSON.stringify({ error: `Formato não suportado: ${filename}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (transactions.length === 0) {
      await supabase
        .from("uploads")
        .update({
          status: "error",
          error_message: "Nenhum lançamento encontrado no arquivo. Verifique o formato e o banco selecionado.",
        })
        .eq("id", upload_id);
      return new Response(JSON.stringify({ error: "Nenhum lançamento encontrado" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      await supabase
        .from("uploads")
        .update({
          status: "error",
          error_message: `Erro ao salvar lançamentos: ${insertError.message}`,
        })
        .eq("id", upload_id);
      return new Response(JSON.stringify({ error: "Erro ao salvar transações" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("uploads")
      .update({
        status: "parsed",
        tx_total: transactions.length,
        tx_pending: transactions.length,
      })
      .eq("id", upload_id);

    return new Response(
      JSON.stringify({
        success: true,
        upload_id,
        tx_count: transactions.length,
        message: `${transactions.length} lançamentos extraídos com sucesso`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("parse-extract error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
