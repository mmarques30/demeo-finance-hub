// supabase/functions/contract-generate/index.ts
// POST autenticado. Gera o PDF do contrato com layout Aurora e salva no bucket "contracts".

import { z } from "https://esm.sh/zod@3.23.8";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFPage,
  PDFFont,
} from "https://esm.sh/pdf-lib@1.17.1";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { serviceClient, userFromAuthHeader, isAdmin } from "../_shared/supabase.ts";

const BodySchema = z.object({ contract_id: z.string().uuid() });

// Paleta Aurora (igual à proposal-generate)
const GREEN = rgb(0x4A / 255, 0x67 / 255, 0x41 / 255);
const NAVY  = rgb(0x1B / 255, 0x39 / 255, 0x4D / 255);
const MUTED = rgb(0x7A / 255, 0x72 / 255, 0x60 / 255);
const LINEN = rgb(0xF7 / 255, 0xF1 / 255, 0xE8 / 255);
const LINE  = rgb(0xE2 / 255, 0xD8 / 255, 0xCC / 255);
const TEXT  = rgb(0x1C / 255, 0x1C / 255, 0x19 / 255);

const A4 = { width: 595.28, height: 841.89 };
const ML = 60; // margem esquerda
const MR = 60; // margem direita
const TW = A4.width - ML - MR; // text width

function drawAuroraSymbol(page: PDFPage, cx: number, cyAnchor: number, R: number) {
  const line = (x1: number, y1: number, x2: number, y2: number, op = 1, th = 2) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color: GREEN, thickness: th, opacity: op });

  line(cx, cyAnchor, cx, cyAnchor + R);
  line(cx, cyAnchor, cx + R * 0.78, cyAnchor + R * 0.78, 0.7);
  line(cx, cyAnchor, cx - R * 0.78, cyAnchor + R * 0.78, 0.7);
  line(cx, cyAnchor, cx + R, cyAnchor + R * 0.45, 0.35, 1.4);
  line(cx, cyAnchor, cx - R, cyAnchor + R * 0.45, 0.35, 1.4);

  const segs = 24;
  let prev = { x: cx - R * 0.95, y: cyAnchor };
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const angle = Math.PI * t;
    const nx = cx - R * 0.95 * Math.cos(angle);
    const ny = cyAnchor + R * 0.55 * Math.sin(angle);
    page.drawLine({ start: prev, end: { x: nx, y: ny }, color: GREEN, thickness: 2 });
    prev = { x: nx, y: ny };
  }
  page.drawCircle({ x: cx, y: cyAnchor, size: 3, color: GREEN });
}

function footer(page: PDFPage, number: string, fontSans: PDFFont, fontSerifItalic: PDFFont) {
  page.drawLine({ start: { x: ML, y: 50 }, end: { x: A4.width - MR, y: 50 }, color: LINE, thickness: 0.5 });
  page.drawText("Clareza que envolve. Resultado que permanece.", {
    x: ML, y: 36, font: fontSerifItalic, size: 10, color: MUTED,
  });
  const tag = `Aurora · ${number}`;
  page.drawText(tag, {
    x: A4.width - MR - fontSans.widthOfTextAtSize(tag, 8), y: 36, font: fontSans, size: 8, color: MUTED,
  });
}

function drawWrapped(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { font: PDFFont; size: number; color?: typeof GREEN; maxWidth?: number; lineH?: number },
): number {
  const { font, size, color = TEXT, maxWidth = TW, lineH = size * 1.55 } = opts;
  const words = text.split(/\s+/);
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      page.drawText(line, { x, y: cy, font, size, color });
      cy -= lineH;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) { page.drawText(line, { x, y: cy, font, size, color }); cy -= lineH; }
  return cy;
}

function cap(page: PDFPage, label: string, x: number, y: number, font: PDFFont) {
  page.drawText(label.toUpperCase(), { x, y, font, size: 8, color: MUTED });
  return y - 14;
}

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ptBR(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("pt-BR");
}

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  const origin = req.headers.get("origin");

  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, origin);

  const user = await userFromAuthHeader(req);
  if (!user) return jsonResponse({ error: "Não autenticado" }, 401, origin);
  if (!(await isAdmin(user.id))) return jsonResponse({ error: "Acesso negado" }, 403, origin);

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.flatten() : "Payload inválido";
    return jsonResponse({ error: msg }, 422, origin);
  }

  const sb = serviceClient();

  const { data: contract, error: cErr } = await sb
    .from("contracts")
    .select("*")
    .eq("id", body.contract_id)
    .single();
  if (cErr || !contract) return jsonResponse({ error: "Contrato não encontrado" }, 404, origin);

  // Carrega itens da proposta vinculada (para listar escopo)
  const { data: items } = contract.proposal_id
    ? await sb
        .from("proposal_items")
        .select("description, unit, quantity, unit_price, total")
        .eq("proposal_id", contract.proposal_id)
        .order("position")
    : { data: [] };

  // ------------- Monta PDF -------------
  const pdf = await PDFDocument.create();
  const fontSerif       = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontSerifItalic = await pdf.embedFont(StandardFonts.TimesItalic);
  const fontSans        = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSansBold    = await pdf.embedFont(StandardFonts.HelveticaBold);

  const number = contract.number ?? "AURORA-CTR-DRAFT";

  // =====================================================================
  // PÁGINA 1 — CAPA
  // =====================================================================
  const cover = pdf.addPage([A4.width, A4.height]);
  cover.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: LINEN });
  // Marca d'água
  cover.drawText("Aurora", {
    x: 80, y: 250, font: fontSerifItalic, size: 220, color: rgb(0.95, 0.92, 0.86),
  });
  drawAuroraSymbol(cover, A4.width / 2, A4.height - 220, 60);

  cover.drawText("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", {
    x: ML, y: A4.height - 360, font: fontSans, size: 9, color: MUTED,
  });
  cover.drawText("de Gestão Financeira", {
    x: ML, y: A4.height - 390, font: fontSerifItalic, size: 28, color: GREEN,
  });
  cover.drawText(number, {
    x: ML, y: A4.height - 428, font: fontSans, size: 11, color: TEXT,
  });

  // Bloco de partes
  let cy = A4.height - 480;
  cy = cap(cover, "Contratada", ML, cy, fontSans);
  cover.drawText("Claudia De Meo · Gestão e Assessoria Financeira", {
    x: ML, y: cy, font: fontSerif, size: 12, color: TEXT,
  });
  cy -= 28;
  cy = cap(cover, "Contratante", ML, cy, fontSans);
  cover.drawText(contract.client_name, { x: ML, y: cy, font: fontSerif, size: 12, color: TEXT });
  if (contract.client_document) {
    cy -= 18;
    cover.drawText(`CPF/CNPJ: ${contract.client_document}`, { x: ML, y: cy, font: fontSans, size: 10, color: MUTED });
  }
  cy -= 28;
  cy = cap(cover, "Início da vigência", ML, cy, fontSans);
  cover.drawText(ptBR(contract.start_date), { x: ML, y: cy, font: fontSerif, size: 12, color: TEXT });

  footer(cover, number, fontSans, fontSerifItalic);

  // =====================================================================
  // PÁGINA 2 — CLÁUSULAS
  // =====================================================================
  const p2 = pdf.addPage([A4.width, A4.height]);

  const clause = (title: string, y: number): number => {
    p2.drawText(title.toUpperCase(), { x: ML, y, font: fontSansBold, size: 9, color: GREEN });
    return y - 18;
  };

  let p2y = A4.height - 80;
  p2.drawText("CLÁUSULAS E CONDIÇÕES", { x: ML, y: p2y, font: fontSans, size: 9, color: MUTED });
  p2y -= 20;
  p2.drawText("Do contrato de prestação de serviços", {
    x: ML, y: p2y, font: fontSerifItalic, size: 22, color: TEXT,
  });
  p2y -= 40;

  // Cláusula 1 — Objeto
  p2y = clause("Cláusula 1 — Objeto", p2y);
  p2y = drawWrapped(p2,
    "A Contratada prestará à Contratante serviços de gestão e assessoria financeira, " +
    "compreendendo os seguintes serviços:",
    ML, p2y, { font: fontSerif, size: 11 });
  p2y -= 6;

  if (items && items.length > 0) {
    for (const it of items) {
      const line = `• ${it.description} (${it.unit})`;
      p2y = drawWrapped(p2, line, ML + 10, p2y, { font: fontSerif, size: 11, maxWidth: TW - 10 });
    }
  } else {
    p2y = drawWrapped(p2, "• Conforme escopo acordado na proposta vinculada.", ML + 10, p2y,
      { font: fontSerif, size: 11, maxWidth: TW - 10 });
  }
  p2y -= 16;

  // Cláusula 2 — Valor e Pagamento
  p2y = clause("Cláusula 2 — Valor e Pagamento", p2y);
  p2y = drawWrapped(p2,
    `Pelos serviços prestados, a Contratante pagará à Contratada o valor mensal de ` +
    `${brl(Number(contract.total_monthly))}, devido até o 5º dia útil de cada mês, ` +
    `mediante transferência bancária ou boleto.`,
    ML, p2y, { font: fontSerif, size: 11 });
  p2y -= 16;

  // Cláusula 3 — Vigência
  p2y = clause("Cláusula 3 — Vigência", p2y);
  p2y = drawWrapped(p2,
    `O presente contrato tem início em ${ptBR(contract.start_date)} e vigorará por prazo ` +
    `indeterminado, podendo ser rescindido por qualquer das partes mediante aviso prévio ` +
    `de ${contract.termination_notice_days} (${contract.termination_notice_days === 30 ? "trinta" : contract.termination_notice_days}) dias.`,
    ML, p2y, { font: fontSerif, size: 11 });
  p2y -= 16;

  // Cláusula 4 — Rescisão
  p2y = clause("Cláusula 4 — Rescisão", p2y);
  p2y = drawWrapped(p2,
    "O descumprimento de qualquer cláusula deste instrumento por qualquer das partes " +
    "facultará à parte inocente a rescisão imediata, sem prejuízo das penalidades cabíveis.",
    ML, p2y, { font: fontSerif, size: 11 });
  p2y -= 16;

  // Cláusula 5 — Confidencialidade
  p2y = clause("Cláusula 5 — Confidencialidade", p2y);
  p2y = drawWrapped(p2,
    "As partes comprometem-se a manter sigilo sobre todas as informações financeiras, " +
    "operacionais e estratégicas obtidas durante a vigência do contrato, sob pena de " +
    "responsabilização civil e criminal.",
    ML, p2y, { font: fontSerif, size: 11 });
  p2y -= 16;

  // Cláusula 6 — Foro
  p2y = clause("Cláusula 6 — Foro", p2y);
  p2y = drawWrapped(p2,
    "Fica eleito o foro da Comarca de Porto Alegre/RS para dirimir quaisquer controvérsias " +
    "decorrentes deste instrumento, com renúncia expressa a qualquer outro, por mais " +
    "privilegiado que seja.",
    ML, p2y, { font: fontSerif, size: 11 });

  footer(p2, number, fontSans, fontSerifItalic);

  // =====================================================================
  // PÁGINA 3 — ASSINATURAS
  // =====================================================================
  const p3 = pdf.addPage([A4.width, A4.height]);
  drawAuroraSymbol(p3, A4.width / 2, A4.height - 140, 36);

  p3.drawText("ASSINATURAS", { x: ML, y: A4.height - 210, font: fontSans, size: 9, color: MUTED });
  p3.drawText(number, {
    x: ML, y: A4.height - 228, font: fontSerif, size: 18, color: TEXT,
  });

  // Data e local
  const appUrl = Deno.env.get("AURORA_APP_URL") ?? "";
  const city = "Porto Alegre";
  p3.drawText(`${city}, ${ptBR(contract.start_date)}.`, {
    x: ML, y: A4.height - 268, font: fontSerif, size: 11, color: MUTED,
  });

  // Linhas de assinatura
  const sigY = A4.height - 380;
  const col1 = ML;
  const col2 = A4.width / 2 + 20;
  const lineW = 200;

  p3.drawLine({ start: { x: col1, y: sigY }, end: { x: col1 + lineW, y: sigY }, color: LINE, thickness: 1 });
  p3.drawLine({ start: { x: col2, y: sigY }, end: { x: col2 + lineW, y: sigY }, color: LINE, thickness: 1 });

  p3.drawText("Contratada", { x: col1, y: sigY - 16, font: fontSans, size: 9, color: MUTED });
  p3.drawText("Claudia De Meo", { x: col1, y: sigY - 30, font: fontSerif, size: 11, color: TEXT });
  p3.drawText("Gestora Financeira", { x: col1, y: sigY - 44, font: fontSans, size: 9, color: MUTED });

  p3.drawText("Contratante", { x: col2, y: sigY - 16, font: fontSans, size: 9, color: MUTED });
  p3.drawText(contract.client_name, { x: col2, y: sigY - 30, font: fontSerif, size: 11, color: TEXT });
  if (contract.client_document) {
    p3.drawText(`CPF/CNPJ: ${contract.client_document}`, { x: col2, y: sigY - 44, font: fontSans, size: 9, color: MUTED });
  }

  // Testemunhas
  const witY = sigY - 110;
  p3.drawText("TESTEMUNHAS", { x: ML, y: witY + 20, font: fontSans, size: 8, color: MUTED });
  p3.drawLine({ start: { x: col1, y: witY }, end: { x: col1 + lineW, y: witY }, color: LINE, thickness: 0.8 });
  p3.drawLine({ start: { x: col2, y: witY }, end: { x: col2 + lineW, y: witY }, color: LINE, thickness: 0.8 });
  p3.drawText("Nome / CPF", { x: col1, y: witY - 14, font: fontSans, size: 9, color: MUTED });
  p3.drawText("Nome / CPF", { x: col2, y: witY - 14, font: fontSans, size: 9, color: MUTED });

  footer(p3, number, fontSans, fontSerifItalic);

  const pdfBytes = await pdf.save();

  // ------------- Salva no Storage bucket "contracts" -------------
  const path = `${number}.pdf`;
  const { error: upErr } = await sb.storage
    .from("contracts")
    .upload(path, pdfBytes, { upsert: true, contentType: "application/pdf" });
  if (upErr) {
    console.error(upErr);
    return jsonResponse({ error: "Falha ao salvar PDF" }, 500, origin);
  }

  const { data: signed } = await sb.storage
    .from("contracts")
    .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 dias

  await sb
    .from("contracts")
    .update({ pdf_url: signed?.signedUrl ?? null })
    .eq("id", body.contract_id);

  return jsonResponse(
    { pdf_url: signed?.signedUrl ?? null, number },
    200,
    origin,
  );
});
