// supabase/functions/contract-generate/index.ts
// POST autenticado. Gera PDF do contrato no modelo real Claudia de Meo (17 cláusulas).

import { z } from "https://esm.sh/zod@3.23.8";
import {
  PDFDocument,
  rgb,
  PDFPage,
  PDFFont,
} from "npm:pdf-lib@1.17.1";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { serviceClient, userFromAuthHeader, isAdmin } from "../_shared/supabase.ts"; // owner + admin

const BodySchema = z.object({ contract_id: z.string().uuid() });

// Paleta Aurora
const GREEN = rgb(0x4A / 255, 0x67 / 255, 0x41 / 255);
const NAVY  = rgb(0x1B / 255, 0x39 / 255, 0x4D / 255);
const MUTED = rgb(0x7A / 255, 0x72 / 255, 0x60 / 255);
const LINE  = rgb(0xE2 / 255, 0xD8 / 255, 0xCC / 255);
const TEXT  = rgb(0x1C / 255, 0x1C / 255, 0x19 / 255);

// Dados legais da Contratada
const CM_NAME    = "Claudia de Meo – Gestão financeira";
const CM_CNPJ    = "41.062.652/0001-38";
const CM_ADDRESS = "Rua Gravatás, 140 – Bairro Colina Verde – Limeira – SP, CEP: 13.482-553";
const CM_CITY    = "Limeira";

// Marca Aurora (cabeçalho / rodapé)
const AURORA_EMAIL   = "claudia@aurora.com.br";
const AURORA_WEBSITE = "bit.ly/sitegestao";

const A4         = { width: 595.28, height: 841.89 };
const ML         = 50;
const MR         = 50;
const TW         = A4.width - ML - MR;
const TOP_CONTENT = A4.height - 90;
const BOT_LIMIT   = 62;

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ptBR(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// Calcula data de término: startDate + 12 meses - 1 dia (ex: 12/05/2026 → 11/05/2027)
function endDate(startStr: string, months = 12): string {
  const d = new Date(startStr + "T12:00:00Z");
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function drawHeader(page: PDFPage, fontBold: PDFFont, font: PDFFont) {
  // Logo Aurora: 3 barras verticais ascendentes, alinhadas na base (fiel ao SVG dos relatórios)
  const barW = 7;
  const barGap = 4;
  const yBot = A4.height - 59;
  ([
    { h: 20, op: 1.00 },
    { h: 26, op: 0.65 },
    { h: 31, op: 0.38 },
  ] as Array<{ h: number; op: number }>).forEach((b, i) => {
    page.drawRectangle({ x: ML + i * (barW + barGap), y: yBot, width: barW, height: b.h, color: GREEN, opacity: b.op });
  });
  const textX = ML + 3 * (barW + barGap) + 5;
  page.drawText("Aurora", { x: textX, y: A4.height - 40, font: fontBold, size: 14, color: GREEN });
  page.drawText("GESTÃO FINANCEIRA", { x: textX, y: A4.height - 52, font, size: 7, color: MUTED });
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
  page.drawLine({ start: { x: ML, y: 44 }, end: { x: A4.width - MR, y: 44 }, color: LINE, thickness: 0.5 });
  const left = `${AURORA_WEBSITE}  |  ${AURORA_EMAIL}`;
  page.drawText(left, { x: ML, y: 30, font, size: 8, color: MUTED });
  page.drawText(number, {
    x: A4.width - MR - font.widthOfTextAtSize(number, 8),
    y: 30, font, size: 8, color: MUTED,
  });
}

// --- Cursor de documento ---

interface DocCtx {
  pdf: PDFDocument;
  fontBold: PDFFont;
  fontSans: PDFFont;
  fontSerif: PDFFont;
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
  ensurePage(ctx, size * 2);
  ctx.curPage!.drawText(text, { x, y: ctx.curY, font, size, color });
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
  ctx.curY -= lh * 0.25;
}

function gap(ctx: DocCtx, h = 10) { ctx.curY -= h; }

function sectionTitle(ctx: DocCtx, title: string) {
  gap(ctx, 14);
  ensurePage(ctx, 36);
  textLine(ctx, title, ctx.fontBold, 10, TEXT);
  gap(ctx, 2);
}

function clauseLabel(ctx: DocCtx, ordinal: string) {
  gap(ctx, 8);
  ensurePage(ctx, 36);
  textLine(ctx, `Cláusula ${ordinal}.`, ctx.fontBold, 10, TEXT);
}

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  const origin = req.headers.get("origin");

  try {
    return await handleRequest(req, origin);
  } catch (err) {
    console.error("[contract-generate] Unhandled error:", err);
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

  const { data: contract, error: cErr } = await sb
    .from("contracts")
    .select("*")
    .eq("id", body.contract_id)
    .single();
  if (cErr || !contract) return jsonResponse({ error: "Contrato não encontrado" }, 404, origin);

  const { data: items } = contract.proposal_id
    ? await sb
        .from("proposal_items")
        .select("description, services(name)")
        .eq("proposal_id", contract.proposal_id)
        .order("position")
    : { data: [] };

  // --- Monta PDF ---
  const pdf           = await PDFDocument.create();
  const fontSerif     = await pdf.embedFont("Times-Roman");
  const fontSans      = await pdf.embedFont("Helvetica");
  const fontSansBold  = await pdf.embedFont("Helvetica-Bold");

  const number       = contract.number ?? "CTR-DRAFT";
  const startStr     = contract.start_date as string;
  const startPtBR    = ptBR(startStr);
  const endDateStr   = endDate(startStr, 12);
  const noticeDays   = contract.termination_notice_days ?? 30;
  const monthly      = Number(contract.total_monthly ?? 0);
  const oneOff       = Number(contract.total_one_off ?? 0);
  const clientName   = contract.client_name ?? "—";
  const clientDoc    = contract.client_document ?? "";
  const clientAddr   = (contract as Record<string, unknown>).client_address as string ?? "";
  const clientEmail  = contract.client_email ?? "";

  const ctx: DocCtx = {
    pdf, fontBold: fontSansBold, fontSans, fontSerif,
    number, curPage: null, curY: 0,
  };

  ensurePage(ctx);

  // === TÍTULO ===
  textLine(ctx, "CONTRATO DE PRESTAÇÃO DE SERVIÇOS", fontSansBold, 13, NAVY);
  gap(ctx, 6);
  ctx.curPage!.drawLine({
    start: { x: ML, y: ctx.curY }, end: { x: A4.width - MR, y: ctx.curY }, color: LINE, thickness: 0.6,
  });
  gap(ctx, 20);

  // === IDENTIFICAÇÃO DAS PARTES ===
  textLine(ctx, "IDENTIFICAÇÃO DAS PARTES CONTRATANTES", fontSansBold, 10, TEXT);
  gap(ctx, 12);

  textLine(ctx, "CONTRATANTE:", fontSansBold, 10, TEXT);
  gap(ctx, 4);
  paragraph(ctx,
    `${clientName}, pessoa jurídica de direito privado, CNPJ nº ${clientDoc}` +
    (clientAddr ? `, com sede na ${clientAddr}.` : "."),
    fontSerif, 11);
  gap(ctx, 10);

  textLine(ctx, "CONTRATADO:", fontSansBold, 10, TEXT);
  gap(ctx, 4);
  paragraph(ctx,
    `${CM_NAME}, pessoa jurídica, CNPJ ${CM_CNPJ}, com sede na ${CM_ADDRESS}.`,
    fontSerif, 11);
  gap(ctx, 12);

  paragraph(ctx,
    "As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de " +
    "Prestação de Serviços, que regerá pelas cláusulas seguintes e pelas condições de preço, " +
    "forma e termo de pagamento descritas no presente, e em conformidade à Legislação Vigente.",
    fontSerif, 11);

  // === Cláusula 1ª — DO OBJETO DO CONTRATO ===
  sectionTitle(ctx, "DO OBJETO DO CONTRATO");
  clauseLabel(ctx, "1ª");
  paragraph(ctx,
    "É objeto do presente contrato, prestado ao CONTRATANTE, os seguintes serviços:",
    fontSerif, 11);
  gap(ctx, 4);
  if (items && items.length > 0) {
    for (const it of items) {
      const svc = (it.services as { name?: string } | null)?.name ?? it.description ?? "";
      paragraph(ctx, svc, fontSerif, 11, TEXT, ML + 10, TW - 10);
    }
  } else {
    paragraph(ctx, "Serviços conforme escopo acordado na proposta vinculada.", fontSerif, 11, TEXT, ML + 10, TW - 10);
  }

  // === Cláusulas 2ª e 3ª — DA EXECUÇÃO DOS SERVIÇOS ===
  sectionTitle(ctx, "DA EXECUÇÃO DOS SERVIÇOS");
  clauseLabel(ctx, "2ª");
  paragraph(ctx,
    "O CONTRATADO executará as atividades de forma EXCLUSIVAMENTE remota, nos dias e horários " +
    "de sua conveniência, porém sempre comprometido com o prazo de entrega acordado com o CONTRATANTE.",
    fontSerif, 11);

  clauseLabel(ctx, "3ª");
  paragraph(ctx,
    "Se a CONTRATANTE arcará com 100% do valor referente ao sistema online exclusivo adotado para " +
    "o trabalho da gestão financeira, esse valor com validade de um ano, a partir da data da implantação " +
    "do sistema, nos primeiros 6 meses de trabalho o sistema será ofertado pela CONTRATADA, após esse " +
    "período será de responsabilidade da CONTRATANTE.",
    fontSerif, 11);

  // === Cláusula 4ª — DAS OBRIGAÇÕES DO CONTRATADO ===
  sectionTitle(ctx, "DAS OBRIGAÇÕES DO CONTRATADO");
  clauseLabel(ctx, "4ª");
  paragraph(ctx,
    "Fica responsável o CONTRATADO por executar os serviços com qualidade, zelar pelas informações " +
    "cedidas pelo CONTRATANTE, fornece status dos serviços que estão sendo realizados.",
    fontSerif, 11);

  // === Cláusula 5ª — DAS OBRIGAÇÕES DO CONTRATANTE ===
  sectionTitle(ctx, "DAS OBRIGAÇÕES DO CONTRATANTE");
  clauseLabel(ctx, "5ª");
  paragraph(ctx,
    "O CONTRATANTE deverá fornecer ao CONTRATADO todas as informações e acessos necessários à " +
    "realização do serviço, devendo especificar os detalhes necessários à perfeita execução dele, " +
    "e a forma de como ele deve ser entregue.",
    fontSerif, 11);

  // === Cláusulas 6ª e 7ª — DO PAGAMENTO ===
  sectionTitle(ctx, "DO PAGAMENTO");
  clauseLabel(ctx, "6ª");
  let payText =
    `Pela prestação dos serviços acertados neste instrumento, a CONTRATANTE pagará ao CONTRATADO ` +
    `o valor mensal de ${brl(monthly)} ("Remuneração Mensal"), pela execução dos serviços descritos no escopo acima`;
  if (oneOff > 0) {
    payText += ` e ${brl(oneOff)} no ato deste, valor único de implantação`;
  }
  payText += ", conforme proposta.";
  paragraph(ctx, payText, fontSerif, 11);
  gap(ctx, 6);
  paragraph(ctx,
    "O pagamento da Remuneração Mensal é no formato PRÉ PAGO e deverá ser feito até o dia 05 de cada mês.",
    fontSerif, 11);
  gap(ctx, 6);
  paragraph(ctx,
    "O valor da Remuneração Mensal será reajustado anualmente, tendo como base, os índices previstos " +
    "e acumulados no período anual do IGPM, em caso de falta deste índice, o reajuste da mensalidade " +
    "terá por base a média da variação dos índices inflacionários do ano corrente ao da execução.",
    fontSerif, 11);
  gap(ctx, 6);
  paragraph(ctx,
    "Assim o valor dos serviços será reajustado logo que a empresa aumente a média de seu faturamento, " +
    "segundo a tabela de valores de cobrança do CONTRATADO.",
    fontSerif, 11);

  clauseLabel(ctx, "7ª");
  paragraph(ctx,
    "A falta de pagamento de qualquer das parcelas da Remuneração Mensal, devidas pelo CONTRATANTE " +
    "ao CONTRATADO, acarretará ao pagamento de multa moratória compensatória, de 2% (dois por cento) " +
    "sobre o valor em atraso, acrescido da taxa de juros de 1% (um por cento) ao mês calculados " +
    "pro-rata die incidentes sobre o valor corrigido pela aplicação de 100% (cem por cento) do CDI.",
    fontSerif, 11);

  // === Cláusulas 8ª e 9ª — DAS DESPESAS ===
  sectionTitle(ctx, "DAS DESPESAS");
  clauseLabel(ctx, "8ª");
  paragraph(ctx,
    "Despesas e custos que se fizerem necessários para a prestação do serviço, tais como fotocópias, " +
    "impressões, telefonemas, transporte, pedágio, hospedagem, taxas administrativas cobradas por " +
    "órgãos públicos, dentre outras, deverão ser arcados pela CONTRATANTE.",
    fontSerif, 11);

  clauseLabel(ctx, "9ª");
  paragraph(ctx,
    "Tais despesas previstas na cláusula 8ª deverão ser previamente submetidas à aprovação do " +
    "CONTRATANTE pelo CONTRATADO antes de qualquer pagamento. Para fins de controle financeiro " +
    "será enviado relatório com os gastos discriminados, bem como comprovantes dos respectivos.",
    fontSerif, 11);

  // === Cláusulas 10ª, 11ª, 12ª — DA RESCISÃO IMOTIVADA ===
  sectionTitle(ctx, "DA RESCISÃO IMOTIVADA");
  clauseLabel(ctx, "10ª");
  paragraph(ctx,
    `Poderá o presente instrumento ser rescindido por qualquer uma das partes, em qualquer momento, ` +
    `sem que haja qualquer tipo de motivo relevante, não obstante a outra parte deverá ser avisada ` +
    `previamente por escrito, no prazo de ${noticeDays} dias, a partir de ${startPtBR}.`,
    fontSerif, 11);

  clauseLabel(ctx, "11ª");
  paragraph(ctx,
    "Caso o CONTRATANTE já tenha realizado o pagamento pelo serviço, e mesmo assim, requisite a " +
    "rescisão imotivada do presente contrato, terá o valor da quantia paga devolvido, deduzindo-se " +
    "2% de taxas administrativas. O pagamento deverá ser proporcional aos dias trabalhados no mês da rescisão.",
    fontSerif, 11);

  clauseLabel(ctx, "12ª");
  paragraph(ctx,
    "Caso seja o CONTRATADO quem requeira a rescisão imotivada, deverá devolver a quantia que se " +
    "refere aos serviços por ele não prestados ao CONTRATANTE, acrescentado de 2% de taxas administrativas.",
    fontSerif, 11);

  // === Cláusula 13ª — DO PRAZO ===
  sectionTitle(ctx, "DO PRAZO");
  clauseLabel(ctx, "13ª");
  paragraph(ctx,
    `O presente contrato terá vigência de 12 (doze) meses até ${endDateStr}, sendo que a partir ` +
    "desta data, prorroga-se até que uma das partes manifeste interesse em rescindi-lo de acordo " +
    "com a Cláusula 10ª.",
    fontSerif, 11);

  // === Cláusula 14ª — DAS CONDIÇÕES GERAIS ===
  sectionTitle(ctx, "DAS CONDIÇÕES GERAIS");
  clauseLabel(ctx, "14ª");
  paragraph(ctx,
    "Fica compactuado entre as partes a total inexistência de vínculo trabalhista entre as partes " +
    "contratantes, excluindo as obrigações previdenciárias e os encargos sociais.",
    fontSerif, 11);

  // === Cláusulas 15ª e 16ª — DA CONFIDENCIALIDADE ===
  sectionTitle(ctx, "DA CONFIDENCIALIDADE");
  clauseLabel(ctx, "15ª");
  paragraph(ctx,
    "Todos os dados disponibilizados pelo CONTRATANTE ao CONTRATADO para a execução deste contrato " +
    "permanecerão em SIGILO.",
    fontSerif, 11);

  clauseLabel(ctx, "16ª");
  paragraph(ctx,
    "O CONTRATADO compromete-se a manter a confidencialidade de todas as informações a que tiver " +
    "acesso para realização dos serviços acordados. Se necessário o CONTRATADO fornecerá termo de " +
    "confidencialidade específico à CONTRATANTE.",
    fontSerif, 11);

  // === Cláusula 17ª — DO FORO ===
  sectionTitle(ctx, "DO FORO");
  clauseLabel(ctx, "17ª");
  paragraph(ctx,
    "Para dirimir quaisquer controvérsias oriundas do presente contrato, as partes elegem o foro " +
    "da comarca de Limeira – SP.",
    fontSerif, 11);

  // === ENCERRAMENTO E ASSINATURAS ===
  gap(ctx, 20);
  ensurePage(ctx, 160);
  paragraph(ctx, "Por estarem assim justos e contratados, firmam o presente instrumento.", fontSerif, 11, MUTED);
  gap(ctx, 14);
  paragraph(ctx, `${CM_CITY}, ${startPtBR}.`, fontSerif, 11, MUTED);
  gap(ctx, 52);

  const lineW = 200;
  const col2  = A4.width / 2 + 20;
  const sigY  = ctx.curY;

  ctx.curPage!.drawLine({ start: { x: ML,   y: sigY }, end: { x: ML   + lineW, y: sigY }, color: TEXT, thickness: 0.5 });
  ctx.curPage!.drawLine({ start: { x: col2, y: sigY }, end: { x: col2 + lineW, y: sigY }, color: TEXT, thickness: 0.5 });
  ctx.curY -= 16;

  ctx.curPage!.drawText("CLAUDIA DE MEO", { x: ML, y: ctx.curY, font: fontSansBold, size: 10, color: TEXT });
  ctx.curPage!.drawText(clientName.slice(0, 32).toUpperCase(), { x: col2, y: ctx.curY, font: fontSansBold, size: 10, color: TEXT });
  ctx.curY -= 14;

  ctx.curPage!.drawText(`CNPJ: ${CM_CNPJ}`, { x: ML, y: ctx.curY, font: fontSans, size: 9, color: MUTED });
  if (clientDoc) {
    ctx.curPage!.drawText(`CNPJ: ${clientDoc}`, { x: col2, y: ctx.curY, font: fontSans, size: 9, color: MUTED });
  }

  drawFooter(ctx.curPage!, ctx.number, fontSans);

  const pdfBytes = await pdf.save();

  // --- Storage ---
  const path = `${number}.pdf`;
  const { error: upErr } = await sb.storage
    .from("contracts")
    .upload(path, pdfBytes, { upsert: true, contentType: "application/pdf" });
  if (upErr) {
    console.error("[contract-generate] storage:", upErr);
    return jsonResponse({ error: "Falha ao salvar PDF" }, 500, origin);
  }

  const { data: signed } = await sb.storage
    .from("contracts")
    .createSignedUrl(path, 60 * 60 * 24 * 30);

  await sb.from("contracts").update({
    pdf_url: signed?.signedUrl ?? null,
  }).eq("id", body.contract_id);

  return jsonResponse(
    { pdf_url: signed?.signedUrl ?? null, number, client_email: clientEmail },
    200, origin,
  );
}
