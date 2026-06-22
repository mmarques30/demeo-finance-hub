// supabase/functions/contract-generate/index.ts
// POST autenticado. Gera PDF do contrato no modelo Claudia de Meo com 17 cláusulas.

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

// Paleta
const GREEN = rgb(0x4A / 255, 0x67 / 255, 0x41 / 255);
const NAVY  = rgb(0x1B / 255, 0x39 / 255, 0x4D / 255);
const MUTED = rgb(0x7A / 255, 0x72 / 255, 0x60 / 255);
const LINE  = rgb(0xE2 / 255, 0xD8 / 255, 0xCC / 255);
const TEXT  = rgb(0x1C / 255, 0x1C / 255, 0x19 / 255);

// Dados Claudia de Meo (para assinatura legal)
const CM_NAME    = "Claudia de Meo – Gestão financeira";
const CM_CNPJ    = "41.062.652/0001-38";
const CM_ADDRESS = "Rua Gravatás, 140 – Bairro Colina Verde – Limeira-SP – CEP: 13.482-553";
const CM_CITY    = "Limeira";

// Marca Aurora (usada no cabeçalho e rodapé)
const AURORA_EMAIL   = "claudia@aurora.com.br";
const AURORA_WEBSITE = "bit.ly/sitegestao";

const A4 = { width: 595.28, height: 841.89 };
const ML = 50;
const MR = 50;
const TW = A4.width - ML - MR;
const TOP_CONTENT = A4.height - 90; // Y inicial após o header
const BOT_LIMIT   = 62;             // Y mínimo antes do footer

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ptBR(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
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

// --- Renderização de cabeçalho e rodapé ---

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
  const left = `${AURORA_WEBSITE}  |  ${AURORA_EMAIL}`;
  page.drawText(left, { x: ML, y: 30, font, size: 8, color: MUTED });
  page.drawText(number, {
    x: A4.width - MR - font.widthOfTextAtSize(number, 8),
    y: 30, font, size: 8, color: MUTED,
  });
}

// --- Documento fluente (cursor de página) ---

interface DocCtx {
  pdf: PDFDocument;
  fontBold: PDFFont;
  fontSans: PDFFont;
  fontSerif: PDFFont;
  fontSerifItalic: PDFFont;
  number: string;
  curPage: PDFPage | null;
  curY: number;
}

function ensurePage(ctx: DocCtx, needed = 30): PDFPage {
  if (!ctx.curPage || ctx.curY - needed < BOT_LIMIT) {
    if (ctx.curPage) drawFooter(ctx.curPage, ctx.number, ctx.fontSans);
    const p = ctx.pdf.addPage([A4.width, A4.height]);
    drawHeader(p, ctx.fontBold, ctx.fontSans);
    ctx.curPage = p;
    ctx.curY = TOP_CONTENT;
  }
  return ctx.curPage;
}

function textLine(ctx: DocCtx, text: string, font: PDFFont, size: number, color = TEXT, x = ML) {
  const needed = size * 2;
  const page = ensurePage(ctx, needed);
  page.drawText(text, { x, y: ctx.curY, font, size, color });
  ctx.curY -= size * 1.6;
}

function paragraph(ctx: DocCtx, text: string, font: PDFFont, size: number, color = TEXT, x = ML, maxW?: number) {
  const mw = maxW ?? (TW - (x - ML));
  const lh = size * 1.6;
  const words = text.split(/\s+/);
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > mw) {
      textLine(ctx, line, font, size, color, x);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) textLine(ctx, line, font, size, color, x);
  ctx.curY -= lh * 0.3; // margem após parágrafo
}

function gap(ctx: DocCtx, h = 10) {
  ctx.curY -= h;
}

function sectionTitle(ctx: DocCtx, title: string) {
  gap(ctx, 14);
  ensurePage(ctx, 36);
  textLine(ctx, title.toUpperCase(), ctx.fontBold, 9, GREEN);
  gap(ctx, 2);
}

function clauseTitle(ctx: DocCtx, ordinal: string, subject: string) {
  gap(ctx, 10);
  ensurePage(ctx, 40);
  const label = `Cláusula ${ordinal} – ${subject}`;
  textLine(ctx, label, ctx.fontBold, 10, NAVY);
  gap(ctx, 2);
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

  const { data: items } = contract.proposal_id
    ? await sb
        .from("proposal_items")
        .select("description, unit, quantity, unit_price, total, services(name)")
        .eq("proposal_id", contract.proposal_id)
        .order("position")
    : { data: [] };

  // --- Monta PDF ---
  const pdf = await PDFDocument.create();
  const fontSerif       = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontSerifItalic = await pdf.embedFont(StandardFonts.TimesItalic);
  const fontSans        = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSansBold    = await pdf.embedFont(StandardFonts.HelveticaBold);

  const number  = contract.number ?? "CTR-DRAFT";
  const startPtBR = ptBR(contract.start_date);
  const noticeDays: number = contract.termination_notice_days ?? 30;
  const monthly = Number(contract.total_monthly ?? 0);
  const oneOff  = Number((contract as Record<string, unknown>).total_one_off ?? 0);

  const clientName = contract.client_name ?? "—";
  const clientDoc  = contract.client_document ?? "";
  const clientAddr = String((contract as Record<string, unknown>).client_address ?? "");

  const ctx: DocCtx = {
    pdf, fontBold: fontSansBold, fontSans, fontSerif, fontSerifItalic,
    number, curPage: null, curY: 0,
  };

  // Primeira página
  ensurePage(ctx);

  // === TÍTULO ===
  textLine(ctx, "CONTRATO DE PRESTAÇÃO DE SERVIÇOS", fontSansBold, 14, NAVY);
  gap(ctx, 4);
  ensurePage(ctx, 2);
  ctx.curPage!.drawLine({
    start: { x: ML, y: ctx.curY },
    end: { x: A4.width - MR, y: ctx.curY },
    color: GREEN, thickness: 1,
  });
  gap(ctx, 20);

  // === IDENTIFICAÇÃO DAS PARTES ===
  sectionTitle(ctx, "IDENTIFICAÇÃO DAS PARTES CONTRATANTES");

  textLine(ctx, "CONTRATANTE:", fontSansBold, 10, TEXT);
  gap(ctx, 2);
  paragraph(ctx, clientName, fontSerif, 11);
  if (clientDoc) paragraph(ctx, `CNPJ: ${clientDoc}`, fontSans, 10, MUTED);
  if (clientAddr) paragraph(ctx, clientAddr, fontSans, 10, MUTED);
  gap(ctx, 12);

  textLine(ctx, "CONTRATADO:", fontSansBold, 10, TEXT);
  gap(ctx, 2);
  paragraph(ctx, CM_NAME, fontSerif, 11);
  paragraph(ctx, `CNPJ: ${CM_CNPJ}`, fontSans, 10, MUTED);
  paragraph(ctx, CM_ADDRESS, fontSans, 10, MUTED);
  gap(ctx, 8);

  // === CLÁUSULAS ===

  clauseTitle(ctx, "1ª", "DO OBJETO");
  paragraph(ctx,
    "O presente contrato tem por objeto a prestação de serviços de gestão e assessoria financeira " +
    "pela CONTRATADA à CONTRATANTE, compreendendo os serviços abaixo discriminados:",
    fontSerif, 11);
  gap(ctx, 4);
  if (items && items.length > 0) {
    for (const it of items) {
      const svc = (it.services as { name?: string } | null)?.name ?? it.description ?? "";
      paragraph(ctx, `• ${svc}`, fontSerif, 11, TEXT, ML + 8, TW - 8);
    }
  } else {
    paragraph(ctx, "• Conforme escopo acordado na proposta vinculada.", fontSerif, 11, TEXT, ML + 8, TW - 8);
  }

  clauseTitle(ctx, "2ª", "DA EXECUÇÃO");
  paragraph(ctx,
    "Os serviços serão prestados de forma remota, com ferramentas digitais de gestão, podendo haver " +
    "atendimento presencial quando solicitado pela CONTRATANTE ou a critério da CONTRATADA, " +
    "previamente combinado entre as partes.",
    fontSerif, 11);

  clauseTitle(ctx, "3ª", "DOS SISTEMAS DE GESTÃO");
  paragraph(ctx,
    "Os custos com sistemas de gestão (ERP, plataformas financeiras e similares) necessários à " +
    "execução dos serviços são de responsabilidade da CONTRATANTE, salvo disposição em contrário " +
    "estabelecida em adendo a este instrumento.",
    fontSerif, 11);

  clauseTitle(ctx, "4ª", "DAS OBRIGAÇÕES DO CONTRATADO");
  paragraph(ctx, "Constituem obrigações da CONTRATADA:", fontSerif, 11);
  gap(ctx, 4);
  const obrigContratado = [
    "I – prestar os serviços com diligência, pontualidade e qualidade técnica;",
    "II – manter absoluto sigilo sobre as informações financeiras e operacionais da CONTRATANTE;",
    "III – comunicar eventuais irregularidades ou inconsistências financeiras identificadas durante a execução dos serviços;",
    "IV – disponibilizar relatórios e demonstrativos periódicos conforme acordado entre as partes.",
  ];
  for (const ob of obrigContratado) {
    paragraph(ctx, ob, fontSerif, 11, TEXT, ML + 8, TW - 8);
  }

  clauseTitle(ctx, "5ª", "DAS OBRIGAÇÕES DO CONTRATANTE");
  paragraph(ctx, "Constituem obrigações da CONTRATANTE:", fontSerif, 11);
  gap(ctx, 4);
  const obrigContratante = [
    "I – fornecer todos os documentos, informações, acessos e sistemas necessários à execução dos serviços;",
    "II – realizar os pagamentos nos prazos e condições estabelecidos neste contrato;",
    "III – comunicar, com antecedência mínima de 5 (cinco) dias úteis, qualquer alteração relevante em suas operações financeiras que impacte na prestação dos serviços.",
  ];
  for (const ob of obrigContratante) {
    paragraph(ctx, ob, fontSerif, 11, TEXT, ML + 8, TW - 8);
  }

  clauseTitle(ctx, "6ª", "DO PAGAMENTO");
  paragraph(ctx,
    `Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor mensal de ${brl(monthly)}, ` +
    "PRÉ PAGO, com vencimento até o dia 05 (cinco) de cada mês, mediante transferência bancária ou PIX.",
    fontSerif, 11);
  if (oneOff > 0) {
    gap(ctx, 6);
    paragraph(ctx,
      `O presente contrato prevê ainda o pagamento único de implantação no valor de ${brl(oneOff)}, ` +
      "a ser quitado na data de assinatura deste instrumento.",
      fontSerif, 11);
  }
  gap(ctx, 6);
  paragraph(ctx,
    "Os honorários mensais serão reajustados anualmente com base na variação acumulada do IGPM " +
    "(Índice Geral de Preços do Mercado), ou pelo IPCA caso o IGPM apresente variação negativa, " +
    "considerando os últimos 12 (doze) meses.",
    fontSerif, 11);

  clauseTitle(ctx, "7ª", "DA MORA");
  paragraph(ctx,
    "O não pagamento na data de vencimento ensejará multa de 2% (dois por cento) sobre o valor " +
    "devido, acrescida de juros moratórios equivalentes à taxa CDI ao dia, calculados pro rata die, " +
    "sem prejuízo da possibilidade de rescisão contratual por inadimplência.",
    fontSerif, 11);

  clauseTitle(ctx, "8ª", "DAS DESPESAS");
  paragraph(ctx,
    "As despesas relacionadas diretamente à execução dos serviços, tais como deslocamentos, " +
    "hospedagens, cartórios e materiais específicos solicitados pela CONTRATANTE, não estão incluídas " +
    "nos honorários mensais e serão cobradas à parte, mediante apresentação de comprovantes fiscais.",
    fontSerif, 11);

  clauseTitle(ctx, "9ª", "DA APROVAÇÃO DE DESPESAS");
  paragraph(ctx,
    "Toda despesa extraordinária deverá ser previamente autorizada pela CONTRATANTE por escrito ou " +
    "por meio eletrônico rastreável (e-mail ou mensagem), sob pena de não reembolso.",
    fontSerif, 11);

  clauseTitle(ctx, "10ª", "DA RESCISÃO IMOTIVADA");
  paragraph(ctx,
    `Qualquer das partes poderá rescindir este contrato sem justa causa mediante aviso prévio de ` +
    `${noticeDays} (${noticeDays === 30 ? "trinta" : String(noticeDays)}) dias, por escrito, ` +
    "ao encerramento do mês calendário em curso.",
    fontSerif, 11);

  clauseTitle(ctx, "11ª", "DA RESCISÃO ANTECIPADA");
  paragraph(ctx,
    "Em caso de rescisão antecipada pela CONTRATANTE sem justa causa, antes de completado o prazo " +
    "mínimo previsto na Cláusula 13ª, serão devidos os honorários correspondentes ao período " +
    "remanescente até o término do prazo mínimo contratual.",
    fontSerif, 11);

  clauseTitle(ctx, "12ª", "DA RESCISÃO POR JUSTA CAUSA");
  paragraph(ctx,
    "O descumprimento de qualquer cláusula deste instrumento por qualquer das partes facultará à " +
    "parte inocente a rescisão imediata, sem prejuízo das penalidades cabíveis e do direito de " +
    "indenização por perdas e danos.",
    fontSerif, 11);

  clauseTitle(ctx, "13ª", "DO PRAZO");
  paragraph(ctx,
    `O presente contrato terá vigência de 12 (doze) meses, com início em ${startPtBR}, ` +
    "renovando-se automaticamente por iguais períodos, salvo manifestação contrária de qualquer " +
    `das partes com antecedência mínima de ${noticeDays} dias antes do término da vigência.`,
    fontSerif, 11);

  clauseTitle(ctx, "14ª", "DAS CONDIÇÕES GERAIS");
  paragraph(ctx,
    "O presente contrato não estabelece qualquer vínculo empregatício entre as partes, tratando-se " +
    "de relação de natureza exclusivamente civil e comercial, regida pelas disposições do Código " +
    "Civil Brasileiro (Lei nº 10.406/2002) e demais legislações aplicáveis.",
    fontSerif, 11);

  clauseTitle(ctx, "15ª", "DA CONFIDENCIALIDADE");
  paragraph(ctx,
    "As partes comprometem-se a manter absoluto sigilo sobre todas as informações de natureza " +
    "financeira, contábil, operacional e estratégica a que tiverem acesso em decorrência deste " +
    "contrato, tanto durante a vigência quanto pelo prazo de 5 (cinco) anos após o seu encerramento.",
    fontSerif, 11);

  clauseTitle(ctx, "16ª", "DAS PENALIDADES POR VIOLAÇÃO DE CONFIDENCIALIDADE");
  paragraph(ctx,
    "A violação da cláusula de confidencialidade sujeitará a parte infratora à responsabilização " +
    "civil e criminal, bem como ao pagamento de indenização por perdas e danos, sem prejuízo de " +
    "outras sanções aplicáveis na forma da lei.",
    fontSerif, 11);

  clauseTitle(ctx, "17ª", "DO FORO");
  paragraph(ctx,
    "Fica eleito o foro da Comarca de Limeira, Estado de São Paulo, para dirimir quaisquer " +
    "controvérsias decorrentes deste instrumento, com renúncia expressa a qualquer outro, " +
    "por mais privilegiado que seja.",
    fontSerif, 11);

  // === ASSINATURA ===
  gap(ctx, 30);
  ensurePage(ctx, 160);

  paragraph(ctx,
    `${CM_CITY}, ${new Date(contract.start_date + "T12:00:00Z").toLocaleDateString("pt-BR")}.`,
    fontSerif, 11, MUTED);
  gap(ctx, 48);

  const lineW = 200;
  const col2  = A4.width / 2 + 20;
  const sigY  = ctx.curY;

  ctx.curPage!.drawLine({ start: { x: ML,   y: sigY }, end: { x: ML   + lineW, y: sigY }, color: TEXT, thickness: 0.5 });
  ctx.curPage!.drawLine({ start: { x: col2, y: sigY }, end: { x: col2 + lineW, y: sigY }, color: TEXT, thickness: 0.5 });
  ctx.curY -= 16;

  ctx.curPage!.drawText("CLAUDIA DE MEO",    { x: ML,   y: ctx.curY, font: fontSansBold, size: 10, color: TEXT });
  ctx.curPage!.drawText(clientName.slice(0, 30).toUpperCase(), { x: col2, y: ctx.curY, font: fontSansBold, size: 10, color: TEXT });
  ctx.curY -= 14;

  ctx.curPage!.drawText(`CNPJ: ${CM_CNPJ}`, { x: ML, y: ctx.curY, font: fontSans, size: 9, color: MUTED });
  if (clientDoc) {
    ctx.curPage!.drawText(`CNPJ: ${clientDoc}`, { x: col2, y: ctx.curY, font: fontSans, size: 9, color: MUTED });
  }

  // Fecha última página
  drawFooter(ctx.curPage!, ctx.number, fontSans);

  const pdfBytes = await pdf.save();

  // --- Storage ---
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
    .createSignedUrl(path, 60 * 60 * 24 * 30);

  await sb.from("contracts").update({ pdf_url: signed?.signedUrl ?? null }).eq("id", body.contract_id);

  return jsonResponse({ pdf_url: signed?.signedUrl ?? null, number }, 200, origin);
});
