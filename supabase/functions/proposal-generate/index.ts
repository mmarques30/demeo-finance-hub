// supabase/functions/proposal-generate/index.ts
// POST autenticado. Gera o PDF da proposta com layout Aurora e salva no bucket "proposals".

import { z } from "https://esm.sh/zod@3.23.8";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFPage,
  PDFFont,
  degrees,
} from "https://esm.sh/pdf-lib@1.17.1";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { serviceClient, userFromAuthHeader, isAdmin } from "../_shared/supabase.ts";

const BodySchema = z.object({ proposal_id: z.string().uuid() });

// Paleta Aurora
const GREEN = rgb(0x4A / 255, 0x67 / 255, 0x41 / 255);
const NAVY = rgb(0x1B / 255, 0x39 / 255, 0x4D / 255);
const MUTED = rgb(0x7A / 255, 0x72 / 255, 0x60 / 255);
const TAN = rgb(0xB8 / 255, 0x95 / 255, 0x6A / 255);
const LINEN = rgb(0xF7 / 255, 0xF1 / 255, 0xE8 / 255);
const LINE = rgb(0xE2 / 255, 0xD8 / 255, 0xCC / 255);
const TEXT = rgb(0x1C / 255, 0x1C / 255, 0x19 / 255);

const A4 = { width: 595.28, height: 841.89 };

// Desenha o símbolo Aurora (sol nascendo) no PDF a partir de uma origem (cx, cy_anchor) e raio R.
function drawAuroraSymbol(page: PDFPage, cx: number, cyAnchor: number, R: number, color = GREEN) {
  const opts = (opacity = 1, thickness = 2) => ({
    color,
    thickness,
    opacity,
  });
  // Raio vertical
  page.drawLine({
    start: { x: cx, y: cyAnchor },
    end: { x: cx, y: cyAnchor + R },
    ...opts(1, 2),
  });
  // Raios 0.7
  page.drawLine({
    start: { x: cx, y: cyAnchor },
    end: { x: cx + R * 0.78, y: cyAnchor + R * 0.78 },
    ...opts(0.7, 2),
  });
  page.drawLine({
    start: { x: cx, y: cyAnchor },
    end: { x: cx - R * 0.78, y: cyAnchor + R * 0.78 },
    ...opts(0.7, 2),
  });
  // Raios 0.35
  page.drawLine({
    start: { x: cx, y: cyAnchor },
    end: { x: cx + R, y: cyAnchor + R * 0.45 },
    ...opts(0.35, 1.4),
  });
  page.drawLine({
    start: { x: cx, y: cyAnchor },
    end: { x: cx - R, y: cyAnchor + R * 0.45 },
    ...opts(0.35, 1.4),
  });
  // Arco base (semicírculo apontando para cima)
  // Aproximação com vários segmentos
  const segments = 24;
  let prev = { x: cx - R * 0.95, y: cyAnchor };
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const angle = Math.PI * t; // 0 → π
    const x = cx - R * 0.95 * Math.cos(angle);
    const y = cyAnchor + R * 0.55 * Math.sin(angle);
    page.drawLine({ start: prev, end: { x, y }, color, thickness: 2 });
    prev = { x, y };
  }
  // Ponto âncora
  page.drawCircle({ x: cx, y: cyAnchor, size: 3, color });
}

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { font: PDFFont; size?: number; color?: typeof GREEN; lineHeight?: number; maxWidth?: number } = {} as any,
) {
  const { font, size = 11, color = TEXT, maxWidth } = opts;
  if (!maxWidth) {
    page.drawText(text, { x, y, font, size, color });
    return y - size * 1.4;
  }
  // Wrap simples
  const words = text.split(/\s+/);
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      page.drawText(line, { x, y: cy, font, size, color });
      cy -= size * 1.5;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x, y: cy, font, size, color });
    cy -= size * 1.5;
  }
  return cy;
}

function footer(page: PDFPage, number: string, font: PDFFont, fontSerif: PDFFont) {
  page.drawLine({
    start: { x: 60, y: 50 },
    end: { x: A4.width - 60, y: 50 },
    color: LINE,
    thickness: 0.5,
  });
  page.drawText("Clareza que envolve. Resultado que permanece.", {
    x: 60,
    y: 36,
    font: fontSerif,
    size: 10,
    color: MUTED,
  });
  page.drawText(`Aurora · ${number}`, {
    x: A4.width - 60 - font.widthOfTextAtSize(`Aurora · ${number}`, 8),
    y: 36,
    font,
    size: 8,
    color: MUTED,
  });
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

  // Carrega proposta, items, deal, lead
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

  // ------------- Monta PDF -------------
  const pdf = await PDFDocument.create();
  // TODO: trocar TimesRoman por Cormorant Garamond embedando TTF do public/brand quando possível.
  const fontSerif = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontSerifItalic = await pdf.embedFont(StandardFonts.TimesItalic);
  const fontSans = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const number = proposal.number ?? "AURORA-DRAFT";

  // === Página 1 — Capa ===
  const cover = pdf.addPage([A4.width, A4.height]);
  // Fundo linho
  cover.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: LINEN });
  // Marca d'água "Aurora" gigante itálico
  cover.drawText("Aurora", {
    x: 80,
    y: 250,
    font: fontSerifItalic,
    size: 220,
    color: rgb(0.95, 0.92, 0.86),
    rotate: degrees(0),
  });
  // Símbolo Aurora central
  drawAuroraSymbol(cover, A4.width / 2, A4.height - 220, 60, GREEN);
  // Cap
  cover.drawText("PROPOSTA COMERCIAL", {
    x: 60,
    y: A4.height - 380,
    font: fontSans,
    size: 9,
    color: MUTED,
  });
  cover.drawText(`Proposta ${number}`, {
    x: 60,
    y: A4.height - 420,
    font: fontSerif,
    size: 36,
    color: TEXT,
  });
  cover.drawText(`Para ${proposal.client_name ?? deal?.company ?? "—"}`, {
    x: 60,
    y: A4.height - 460,
    font: fontSerifItalic,
    size: 18,
    color: GREEN,
  });
  cover.drawText(
    `Emitida em ${new Date(proposal.created_at as string).toLocaleDateString("pt-BR")}`,
    { x: 60, y: A4.height - 490, font: fontSans, size: 10, color: MUTED },
  );
  cover.drawText(`Validade: ${proposal.validity_days} dias`, {
    x: 60,
    y: A4.height - 506,
    font: fontSans,
    size: 10,
    color: MUTED,
  });
  footer(cover, number, fontSans, fontSerifItalic);

  // === Página 2 — Intro + diagnóstico ===
  const p2 = pdf.addPage([A4.width, A4.height]);
  p2.drawText("CONTEXTO", { x: 60, y: A4.height - 80, font: fontSans, size: 9, color: MUTED });
  p2.drawText("Quem somos e quem é você", {
    x: 60,
    y: A4.height - 110,
    font: fontSerif,
    size: 24,
    color: TEXT,
  });
  let cy = A4.height - 160;
  cy = drawText(p2, "Apresentação", 60, cy, { font: fontSansBold, size: 10, color: GREEN });
  cy = drawText(p2, proposal.intro_text ?? "—", 60, cy - 4, {
    font: fontSerif,
    size: 12,
    color: TEXT,
    maxWidth: A4.width - 120,
  });
  cy -= 20;
  cy = drawText(p2, "Diagnóstico", 60, cy, { font: fontSansBold, size: 10, color: GREEN });
  cy = drawText(p2, proposal.diagnosis_text ?? "—", 60, cy - 4, {
    font: fontSerif,
    size: 12,
    color: TEXT,
    maxWidth: A4.width - 120,
  });
  cy -= 24;
  cy = drawText(p2, "Cliente", 60, cy, { font: fontSansBold, size: 10, color: GREEN });
  cy = drawText(p2, `${proposal.client_name} — ${proposal.client_email ?? "—"}`, 60, cy - 4, {
    font: fontSerif,
    size: 12,
  });
  if (proposal.client_phone) {
    cy = drawText(p2, `Telefone: ${proposal.client_phone}`, 60, cy, { font: fontSerif, size: 12 });
  }
  if (proposal.client_document) {
    cy = drawText(p2, `CNPJ/CPF: ${proposal.client_document}`, 60, cy, { font: fontSerif, size: 12 });
  }
  footer(p2, number, fontSans, fontSerifItalic);

  // === Página 3 — Itens + totais ===
  const p3 = pdf.addPage([A4.width, A4.height]);
  p3.drawText("INVESTIMENTO", {
    x: 60,
    y: A4.height - 80,
    font: fontSans,
    size: 9,
    color: MUTED,
  });
  p3.drawText("Escopo e valores", {
    x: 60,
    y: A4.height - 110,
    font: fontSerif,
    size: 24,
    color: TEXT,
  });

  // Tabela
  const cols = [
    { label: "Serviço", x: 60, w: 230 },
    { label: "Unidade", x: 290, w: 70 },
    { label: "Qtd", x: 360, w: 40 },
    { label: "Preço un.", x: 400, w: 70 },
    { label: "Total", x: 470, w: 65 },
  ];
  let ty = A4.height - 160;
  // Cabeçalho
  p3.drawRectangle({ x: 50, y: ty - 6, width: A4.width - 100, height: 22, color: LINEN });
  for (const c of cols) {
    p3.drawText(c.label.toUpperCase(), {
      x: c.x,
      y: ty,
      font: fontSans,
      size: 8,
      color: MUTED,
    });
  }
  ty -= 24;

  let totalMonthly = 0;
  let totalOneOff = 0;
  for (const it of items ?? []) {
    const lineTotal = Number(it.total ?? 0);
    if (it.unit === "mensal") totalMonthly += lineTotal;
    else totalOneOff += lineTotal;

    const name = (it.services as { name?: string } | null)?.name ?? it.description;
    drawText(p3, name.slice(0, 40), cols[0].x, ty, {
      font: fontSerif,
      size: 11,
      color: TEXT,
      maxWidth: cols[0].w,
    });
    p3.drawText(String(it.unit), { x: cols[1].x, y: ty, font: fontSans, size: 10, color: MUTED });
    p3.drawText(String(it.quantity), { x: cols[2].x, y: ty, font: fontSans, size: 10, color: TEXT });
    p3.drawText(brl(Number(it.unit_price)), {
      x: cols[3].x,
      y: ty,
      font: fontSans,
      size: 10,
      color: TEXT,
    });
    p3.drawText(brl(lineTotal), {
      x: cols[4].x,
      y: ty,
      font: fontSansBold,
      size: 10,
      color: NAVY,
    });
    ty -= 22;
    p3.drawLine({
      start: { x: 60, y: ty + 6 },
      end: { x: A4.width - 60, y: ty + 6 },
      color: LINE,
      thickness: 0.5,
    });
  }

  // Totais
  ty -= 24;
  p3.drawText("Total mensal", { x: 320, y: ty, font: fontSans, size: 10, color: MUTED });
  p3.drawText(brl(totalMonthly), { x: 470, y: ty, font: fontSerif, size: 14, color: GREEN });
  ty -= 22;
  p3.drawText("Total único", { x: 320, y: ty, font: fontSans, size: 10, color: MUTED });
  p3.drawText(brl(totalOneOff), { x: 470, y: ty, font: fontSerif, size: 14, color: TAN });
  footer(p3, number, fontSans, fontSerifItalic);

  // === Página 4 — Termos + assinatura ===
  const p4 = pdf.addPage([A4.width, A4.height]);
  p4.drawText("TERMOS", { x: 60, y: A4.height - 80, font: fontSans, size: 9, color: MUTED });
  p4.drawText("Como vamos trabalhar", {
    x: 60,
    y: A4.height - 110,
    font: fontSerif,
    size: 24,
    color: TEXT,
  });
  let p4y = A4.height - 160;
  p4y = drawText(p4, "Pagamento", 60, p4y, { font: fontSansBold, size: 10, color: GREEN });
  p4y = drawText(p4, proposal.payment_terms ?? "—", 60, p4y - 4, {
    font: fontSerif,
    size: 12,
    maxWidth: A4.width - 120,
  });
  p4y -= 20;
  p4y = drawText(p4, "Validade", 60, p4y, { font: fontSansBold, size: 10, color: GREEN });
  p4y = drawText(p4, `Esta proposta é válida por ${proposal.validity_days} dias.`, 60, p4y - 4, {
    font: fontSerif,
    size: 12,
  });

  // Assinatura
  drawAuroraSymbol(p4, A4.width / 2, 180, 30, GREEN);
  p4.drawText("Aurora · Gestão Financeira", {
    x: A4.width / 2 - 80,
    y: 130,
    font: fontSerif,
    size: 14,
    color: TEXT,
  });
  p4.drawText(number, {
    x: A4.width / 2 - fontSans.widthOfTextAtSize(number, 10) / 2,
    y: 110,
    font: fontSans,
    size: 10,
    color: MUTED,
  });
  footer(p4, number, fontSans, fontSerifItalic);

  const pdfBytes = await pdf.save();

  // ------------- Salva no Storage -------------
  const path = `${number}.pdf`;
  const { error: upErr } = await sb.storage
    .from("proposals")
    .upload(path, pdfBytes, { upsert: true, contentType: "application/pdf" });
  if (upErr) {
    console.error(upErr);
    return jsonResponse({ error: "Falha ao salvar PDF" }, 500, origin);
  }

  // Signed URL 7 dias
  const { data: signed } = await sb.storage
    .from("proposals")
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  // Atualiza proposta com totais + pdf_url
  const publicToken = proposal.public_token ?? crypto.randomUUID().replace(/-/g, "");
  await sb
    .from("proposals")
    .update({
      pdf_url: signed?.signedUrl ?? null,
      public_token: publicToken,
      total_monthly: totalMonthly,
      total_one_off: totalOneOff,
    })
    .eq("id", proposal.id);

  const appUrl = Deno.env.get("AURORA_APP_URL") ?? "https://aurora.com.br";
  return jsonResponse(
    {
      pdf_url: signed?.signedUrl ?? null,
      public_url: `${appUrl}/p/proposta/${publicToken}`,
      number,
      total_monthly: totalMonthly,
      total_one_off: totalOneOff,
    },
    200,
    origin,
  );
});
