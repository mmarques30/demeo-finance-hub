// supabase/functions/proposal-generate/index.ts
// POST autenticado. Gera PDF da proposta no modelo Claudia de Meo e salva no bucket "proposals".

import { z } from "https://esm.sh/zod@3.23.8";
import {
  PDFDocument,
  rgb,
  PDFPage,
  PDFFont,
} from "npm:pdf-lib@1.17.1";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { serviceClient, userFromAuthHeader, isAdmin } from "../_shared/supabase.ts";

const BodySchema = z.object({ proposal_id: z.string().uuid() });

// Paleta Aurora
const GREEN = rgb(0x4A / 255, 0x67 / 255, 0x41 / 255);
const NAVY  = rgb(0x1B / 255, 0x39 / 255, 0x4D / 255);
const MUTED = rgb(0x7A / 255, 0x72 / 255, 0x60 / 255);
const LINE  = rgb(0xE2 / 255, 0xD8 / 255, 0xCC / 255);
const TEXT  = rgb(0x1C / 255, 0x1C / 255, 0x19 / 255);

// Dados Claudia de Meo (para assinatura legal)
const CM_CNPJ      = "41.062.652/0001-38";
const CM_CITY      = "Limeira";
const CM_PHONE     = "19-98112.22.77";
const CM_WHATSAPP  = "19-3702.48.78";

// Marca Aurora (usada no cabeçalho e rodapé)
const AURORA_EMAIL = "claudia@aurora.com.br";

const A4 = { width: 595.28, height: 841.89 };
const ML = 50;
const MR = 50;
const TW = A4.width - ML - MR;

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ptBR(dateStr: string): string {
  // timestamps já têm "T"; date-only precisa de hora para evitar offset de timezone
  const d = dateStr.includes("T") ? new Date(dateStr) : new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("pt-BR");
}

// Símbolo Aurora (sol nascendo) — versão pequena para header
function drawAuroraSymbol(page: PDFPage, cx: number, cyAnchor: number, R: number) {
  const ln = (x1: number, y1: number, x2: number, y2: number, op = 1, th = 1.4) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color: GREEN, thickness: th, opacity: op });

  ln(cx, cyAnchor, cx, cyAnchor + R);
  ln(cx, cyAnchor, cx + R * 0.78, cyAnchor + R * 0.78, 0.7);
  ln(cx, cyAnchor, cx - R * 0.78, cyAnchor + R * 0.78, 0.7);
  ln(cx, cyAnchor, cx + R, cyAnchor + R * 0.45, 0.35, 1);
  ln(cx, cyAnchor, cx - R, cyAnchor + R * 0.45, 0.35, 1);

  const segs = 16;
  let prev = { x: cx - R * 0.95, y: cyAnchor };
  for (let i = 1; i <= segs; i++) {
    const angle = Math.PI * (i / segs);
    const nx = cx - R * 0.95 * Math.cos(angle);
    const ny = cyAnchor + R * 0.55 * Math.sin(angle);
    page.drawLine({ start: prev, end: { x: nx, y: ny }, color: GREEN, thickness: 1.4 });
    prev = { x: nx, y: ny };
  }
  page.drawCircle({ x: cx, y: cyAnchor, size: 2, color: GREEN });
}

function drawHeader(page: PDFPage, fontBold: PDFFont, font: PDFFont) {
  drawAuroraSymbol(page, ML + 14, A4.height - 50, 14);
  page.drawText("Aurora", { x: ML + 36, y: A4.height - 40, font: fontBold, size: 13, color: GREEN });
  page.drawText("Gestão Financeira", { x: ML + 36, y: A4.height - 53, font, size: 8, color: MUTED });
  page.drawText(AURORA_EMAIL, {
    x: A4.width - MR - font.widthOfTextAtSize(AURORA_EMAIL, 8),
    y: A4.height - 46, font, size: 8, color: MUTED,
  });
  page.drawLine({
    start: { x: ML, y: A4.height - 63 },
    end: { x: A4.width - MR, y: A4.height - 63 },
    color: LINE, thickness: 0.6,
  });
}

function drawFooter(page: PDFPage, number: string, font: PDFFont) {
  page.drawLine({
    start: { x: ML, y: 44 },
    end: { x: A4.width - MR, y: 44 },
    color: LINE, thickness: 0.5,
  });
  const left = `${AURORA_EMAIL}  ·  contato: ${CM_PHONE}  ·  whatsapp: ${CM_WHATSAPP}`;
  page.drawText(left, { x: ML, y: 30, font, size: 8, color: MUTED });
  page.drawText(number, {
    x: A4.width - MR - font.widthOfTextAtSize(number, 8),
    y: 30, font, size: 8, color: MUTED,
  });
}

// Retorna a nova posição Y após renderizar texto com quebra de linha.
function drawWrapped(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { font: PDFFont; size: number; color?: ReturnType<typeof rgb>; maxWidth?: number; lineH?: number },
): number {
  const { font, size, color = TEXT, maxWidth = TW, lineH = size * 1.6 } = opts;
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
  if (line) {
    page.drawText(line, { x, y: cy, font, size, color });
    cy -= lineH;
  }
  return cy;
}

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  const origin = req.headers.get("origin");

  try {
    return await handleRequest(req, origin);
  } catch (err) {
    console.error("[proposal-generate] Unhandled error:", err);
    return jsonResponse({ error: String(err) }, 500, origin);
  }
});

async function handleRequest(req: Request, origin: string | null): Promise<Response> {
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

  const { data: proposal, error: pErr } = await sb
    .from("proposals")
    .select("*")
    .eq("id", body.proposal_id)
    .single();
  if (pErr || !proposal) return jsonResponse({ error: "Proposta não encontrada" }, 404, origin);

  const { data: items } = await sb
    .from("proposal_items")
    .select("*, services(name)")
    .eq("proposal_id", proposal.id)
    .order("position");

  const { data: deal } = await sb
    .from("deals")
    .select("*, leads(*)")
    .eq("id", proposal.deal_id)
    .maybeSingle();

  // Calcula totais
  let totalMonthly = 0;
  let totalOneOff = 0;
  for (const it of items ?? []) {
    const lineTotal = Number(it.total ?? 0);
    if (it.unit === "mensal") totalMonthly += lineTotal;
    else totalOneOff += lineTotal;
  }
  if (totalMonthly === 0) totalMonthly = Number(proposal.total_monthly ?? 0);
  if (totalOneOff === 0) totalOneOff = Number(proposal.total_one_off ?? 0);

  // --- Monta PDF ---
  const pdf = await PDFDocument.create();
  const fontSerif       = await pdf.embedFont("Times-Roman");
  const fontSerifItalic = await pdf.embedFont("Times-Italic");
  const fontSans        = await pdf.embedFont("Helvetica");
  const fontSansBold    = await pdf.embedFont("Helvetica-Bold");

  const number    = proposal.number ?? "PROP-DRAFT";
  const client    = proposal.client_name ?? deal?.company ?? "—";
  const emitDate  = ptBR(proposal.created_at as string);

  // === Página 1 — Título e Apresentação ===
  const p1 = pdf.addPage([A4.width, A4.height]);
  drawHeader(p1, fontSansBold, fontSans);
  drawFooter(p1, number, fontSans);

  let cy = A4.height - 90;

  cy = drawWrapped(p1, "PROPOSTA DE GESTÃO E ASSESSORIA FINANCEIRA", ML, cy, {
    font: fontSansBold, size: 15, color: NAVY, maxWidth: TW,
  });
  cy -= 6;
  p1.drawLine({ start: { x: ML, y: cy }, end: { x: A4.width - MR, y: cy }, color: GREEN, thickness: 1 });
  cy -= 22;

  p1.drawText("Para a empresa:", { x: ML, y: cy, font: fontSans, size: 10, color: MUTED });
  cy -= 20;
  p1.drawText(client, { x: ML, y: cy, font: fontSerifItalic, size: 20, color: GREEN });
  cy -= 36;

  if (proposal.intro_text) {
    cy = drawWrapped(p1, proposal.intro_text as string, ML, cy, { font: fontSerif, size: 11, maxWidth: TW });
    cy -= 16;
  }

  if (proposal.diagnosis_text) {
    p1.drawText("Diagnóstico", { x: ML, y: cy, font: fontSansBold, size: 10, color: GREEN });
    cy -= 18;
    cy = drawWrapped(p1, proposal.diagnosis_text as string, ML, cy, { font: fontSerif, size: 11, maxWidth: TW });
  }

  // === Página 2 — Escopo de Serviços ===
  const p2 = pdf.addPage([A4.width, A4.height]);
  drawHeader(p2, fontSansBold, fontSans);
  drawFooter(p2, number, fontSans);

  let p2y = A4.height - 90;
  p2.drawText("ESCOPO DE SERVIÇOS", { x: ML, y: p2y, font: fontSansBold, size: 11, color: NAVY });
  p2y -= 8;
  p2.drawLine({ start: { x: ML, y: p2y }, end: { x: A4.width - MR, y: p2y }, color: LINE, thickness: 0.5 });
  p2y -= 22;

  p2.drawText("Prestamos os seguintes serviços:", { x: ML, y: p2y, font: fontSerif, size: 12, color: TEXT });
  p2y -= 22;

  if (items && items.length > 0) {
    for (const it of items) {
      const svc = (it.services as { name?: string } | null)?.name ?? it.description ?? "";
      p2y = drawWrapped(p2, `• ${svc}`, ML + 8, p2y, { font: fontSerif, size: 11, maxWidth: TW - 8 });
      p2y -= 2;
      if (p2y < 80) break; // overflow safety: pare antes do footer
    }
  } else {
    p2y = drawWrapped(p2, "• Serviços conforme escopo acordado.", ML + 8, p2y, { font: fontSerif, size: 11, maxWidth: TW - 8 });
  }

  // === Página 3 — Honorários ===
  const p3 = pdf.addPage([A4.width, A4.height]);
  drawHeader(p3, fontSansBold, fontSans);
  drawFooter(p3, number, fontSans);

  let p3y = A4.height - 90;
  p3.drawText("HONORÁRIOS", { x: ML, y: p3y, font: fontSansBold, size: 11, color: NAVY });
  p3y -= 8;
  p3.drawLine({ start: { x: ML, y: p3y }, end: { x: A4.width - MR, y: p3y }, color: LINE, thickness: 0.5 });
  p3y -= 32;

  p3.drawText("Valor mensal dos honorários:", { x: ML, y: p3y, font: fontSans, size: 11, color: TEXT });
  p3y -= 24;
  p3.drawText(brl(totalMonthly), { x: ML, y: p3y, font: fontSerifItalic, size: 30, color: GREEN });
  p3y -= 42;

  if (totalOneOff > 0) {
    p3.drawText("Implantação (pagamento único):", { x: ML, y: p3y, font: fontSans, size: 11, color: TEXT });
    p3y -= 24;
    p3.drawText(brl(totalOneOff), { x: ML, y: p3y, font: fontSerifItalic, size: 22, color: NAVY });
    p3y -= 40;
  }

  // Tabela de serviços (resumão)
  if (items && items.length > 0) {
    p3.drawText("Resumo dos itens:", { x: ML, y: p3y, font: fontSansBold, size: 9, color: MUTED });
    p3y -= 16;
    for (const it of items) {
      const svc = (it.services as { name?: string } | null)?.name ?? it.description ?? "";
      const row = `${svc.slice(0, 42).padEnd(44)}${brl(Number(it.total ?? 0))}`;
      p3.drawText(row, { x: ML, y: p3y, font: fontSans, size: 9, color: MUTED });
      p3y -= 14;
      if (p3y < 80) break;
    }
  }

  // === Página 4 — Condições e Assinatura ===
  const p4 = pdf.addPage([A4.width, A4.height]);
  drawHeader(p4, fontSansBold, fontSans);
  drawFooter(p4, number, fontSans);

  let p4y = A4.height - 90;
  p4.drawText("PRAZO E CONDIÇÕES DE PAGAMENTO", { x: ML, y: p4y, font: fontSansBold, size: 11, color: NAVY });
  p4y -= 8;
  p4.drawLine({ start: { x: ML, y: p4y }, end: { x: A4.width - MR, y: p4y }, color: LINE, thickness: 0.5 });
  p4y -= 20;

  if (proposal.payment_terms) {
    p4y = drawWrapped(p4, proposal.payment_terms as string, ML, p4y, { font: fontSerif, size: 11, maxWidth: TW });
    p4y -= 16;
  }

  p4y = drawWrapped(
    p4,
    `Esta proposta é válida por ${proposal.validity_days ?? 15} dias a partir de ${emitDate}.`,
    ML, p4y, { font: fontSerif, size: 11, maxWidth: TW },
  );
  p4y -= 48;

  p4.drawText(`${CM_CITY}, ${emitDate}`, { x: ML, y: p4y, font: fontSerif, size: 11, color: MUTED });
  p4y -= 54;

  p4.drawText("De acordo:", { x: ML, y: p4y, font: fontSans, size: 10, color: MUTED });
  p4y -= 52;

  const lineW = 200;
  const col2  = A4.width / 2 + 20;
  p4.drawLine({ start: { x: ML,   y: p4y }, end: { x: ML   + lineW, y: p4y }, color: TEXT, thickness: 0.5 });
  p4.drawLine({ start: { x: col2, y: p4y }, end: { x: col2 + lineW, y: p4y }, color: TEXT, thickness: 0.5 });
  p4y -= 16;

  p4.drawText("Claudia de Meo", { x: ML,   y: p4y, font: fontSansBold, size: 10, color: TEXT });
  p4.drawText(client,           { x: col2, y: p4y, font: fontSansBold, size: 10, color: TEXT });
  p4y -= 14;

  p4.drawText(`CNPJ: ${CM_CNPJ}`, { x: ML, y: p4y, font: fontSans, size: 9, color: MUTED });
  if (proposal.client_document) {
    p4.drawText(`CNPJ: ${proposal.client_document}`, { x: col2, y: p4y, font: fontSans, size: 9, color: MUTED });
  }

  const pdfBytes = await pdf.save();

  // --- Storage ---
  const path = `${number}.pdf`;
  const { error: upErr } = await sb.storage
    .from("proposals")
    .upload(path, pdfBytes, { upsert: true, contentType: "application/pdf" });
  if (upErr) {
    console.error(upErr);
    return jsonResponse({ error: "Falha ao salvar PDF" }, 500, origin);
  }

  const { data: signed } = await sb.storage
    .from("proposals")
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  const publicToken = proposal.public_token ?? crypto.randomUUID().replace(/-/g, "");
  await sb.from("proposals").update({
    pdf_url:       signed?.signedUrl ?? null,
    public_token:  publicToken,
    total_monthly: totalMonthly,
    total_one_off: totalOneOff,
  }).eq("id", proposal.id);

  const appUrl = Deno.env.get("AURORA_APP_URL") ?? "https://aurora.com.br";
  return jsonResponse(
    {
      pdf_url:       signed?.signedUrl ?? null,
      public_url:    `${appUrl}/p/proposta/${publicToken}`,
      number,
      total_monthly: totalMonthly,
      total_one_off: totalOneOff,
    },
    200,
    origin,
  );
}
