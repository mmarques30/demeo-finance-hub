// Aurora · Edge Function: classify-batch (M02)
// 3 camadas de classificação por cliente:
// 1. Regras ativas (classification_rules WHERE is_active=true) — padrão mais longo ganha
// 2. Recorrência (view recurrence_patterns — aprovados nos últimos 90 dias)
// 3. Claude Haiku — categorias do banco + contexto de setor do cliente

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { z } from "npm:zod@3";
import { corsHeaders as getCorsHeaders, handlePreflight } from "../_shared/cors.ts";

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.error(`[classify-batch] attempt ${attempt} failed, retrying in ${2 ** (attempt - 1)}s:`, err);
      await new Promise(r => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    }
  }
  throw new Error("unreachable");
}

function normalizeDescription(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, "")
    .replace(/\b\d+\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildPattern(raw: string): string {
  const parts = normalizeDescription(raw).split(" ").filter(Boolean).slice(0, 3);
  return parts.join(" ");
}

interface TxRow {
  id: string;
  description: string;
  amount: number;
  client_id: string;
}

interface Rule {
  pattern: string;
  category: string;
  is_recurring: boolean;
}

interface RecurrencePattern {
  pattern: string;
  modal_category: string;
  occurrences: number;
}

const AIResultSchema = z.array(z.object({
  id: z.string(),
  cat: z.string(),
  rec: z.boolean(),
  conf: z.number().min(0).max(100),
}));

type AIResult = z.infer<typeof AIResultSchema>[number];

async function classifyWithAI(
  transactions: TxRow[],
  categories: string[],
  clientName: string,
  segment: string,
  topPatterns: RecurrencePattern[]
): Promise<AIResult[]> {
  const anthropic = new Anthropic();

  const contextPatterns = topPatterns
    .slice(0, 10)
    .map((p) => `  ${p.pattern} → ${p.modal_category} (${p.occurrences}x)`)
    .join("\n");

  const payload = transactions.map((t) => ({
    id: t.id,
    desc: t.description,
    valor: t.amount,
  }));

  const { content } = await withRetry(() =>
    anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Você é um classificador financeiro especialista em pequenas empresas brasileiras.
Cliente: ${clientName}
Setor: ${segment}
${contextPatterns ? `\nPadrões frequentes deste cliente:\n${contextPatterns}\n` : ""}
Categorias disponíveis: ${categories.join(", ")}

Classifique cada lançamento abaixo. Retorne APENAS um JSON array puro, sem markdown, sem texto extra.
Formato: [{"id":"...","cat":"Categoria · Subcategoria","rec":true/false,"conf":0-100}]
- cat: exatamente uma das categorias listadas
- rec: true se for despesa ou receita recorrente mensal
- conf: sua confiança de 0 a 100

Lançamentos:
${JSON.stringify(payload)}`,
        },
      ],
    })
  );

  const raw = content[0].type === "text" ? content[0].text.trim() : "[]";
  // DIAGNÓSTICO: ver o que o Haiku está retornando
  console.log("[classify-batch] AI raw response:", raw.substring(0, 500));
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn("[classify-batch] AI não retornou JSON array. Response:", raw);
    return [];
  }
  let parsed: unknown;
  try { parsed = JSON.parse(match[0]); } catch (e) {
    console.warn("[classify-batch] JSON parse falhou:", e);
    return [];
  }
  const validated = AIResultSchema.safeParse(parsed);
  if (!validated.success) {
    console.warn("[classify-batch] schema inválido na resposta da IA:", validated.error.message);
    return [];
  }
  return validated.data;
}

Deno.serve(async (req) => {
  const preflightRes = handlePreflight(req);
  if (preflightRes) return preflightRes;
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { upload_id } = await req.json();
    if (!upload_id) {
      return new Response(
        JSON.stringify({ error: "upload_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: upload, error: uploadErr } = await supabase
      .from("uploads")
      .select("id, client_id")
      .eq("id", upload_id)
      .single();

    if (uploadErr || !upload) {
      return new Response(
        JSON.stringify({ error: "Upload não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { client_id } = upload;

    const { data: client } = await supabase
      .from("clients")
      .select("name, segment")
      .eq("id", client_id)
      .single();

    const clientName = client?.name ?? "Cliente";
    const clientSegment = client?.segment ?? "Empresa";

    const { data: pending } = await supabase
      .from("transactions")
      .select("id, description, amount, client_id")
      .eq("upload_id", upload_id)
      .eq("status", "pending");

    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ classified: 0, approved: 0, pending_manual: 0, message: "Nenhuma transação pendente" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── CAMADA 1: Regras ativas ───────────────────────────────────────────────
    const { data: rulesRaw } = await supabase
      .from("classification_rules")
      .select("pattern, category, is_recurring")
      .eq("client_id", client_id)
      .eq("is_active", true);

    const rules: Rule[] = (rulesRaw ?? []).sort(
      (a, b) => b.pattern.length - a.pattern.length
    );

    const approvedByRule: string[] = [];
    const remainingAfterRules: TxRow[] = [];
    const ruleMatches: { tx: TxRow; match: Rule }[] = [];

    for (const tx of pending as TxRow[]) {
      const normalized = buildPattern(tx.description);
      const match = rules.find((r) =>
        normalized === r.pattern || normalized.startsWith(r.pattern + " ")
      );
      if (match) {
        ruleMatches.push({ tx, match });
        approvedByRule.push(tx.id);
      } else {
        remainingAfterRules.push(tx);
      }
    }

    if (ruleMatches.length > 0) {
      const txGroups = new Map<string, { ids: string[]; category: string; is_recurring: boolean }>();
      for (const { tx, match } of ruleMatches) {
        const key = `${match.category}||${match.is_recurring ?? false}`;
        if (!txGroups.has(key)) {
          txGroups.set(key, { ids: [], category: match.category, is_recurring: match.is_recurring ?? false });
        }
        txGroups.get(key)!.ids.push(tx.id);
      }
      for (const { ids, category, is_recurring } of txGroups.values()) {
        await supabase.from("transactions").update({
          category, is_recurring, status: "approved", confidence: 100,
        }).in("id", ids);
      }
      const usedPatterns = [...new Set(ruleMatches.map(({ match }) => match.pattern))];
      await supabase
        .from("classification_rules")
        .update({ last_used: new Date().toISOString() })
        .eq("client_id", client_id)
        .in("pattern", usedPatterns);
    }

    // ── CAMADA 2: Recorrência ─────────────────────────────────────────────────
    const approvedByRecurrence: string[] = [];
    const remainingForAI: TxRow[] = [];

    if (remainingAfterRules.length > 0) {
      const { data: recurrences } = await supabase
        .from("recurrence_patterns")
        .select("pattern, modal_category, occurrences")
        .eq("client_id", client_id);

      const recurrenceMap = new Map<string, string>();
      for (const r of recurrences ?? []) {
        if (r.modal_category) recurrenceMap.set(r.pattern, r.modal_category);
      }

      const recurrenceMatches = new Map<string, string[]>();
      for (const tx of remainingAfterRules) {
        const pattern = buildPattern(tx.description);
        const category = recurrenceMap.get(pattern);
        if (category) {
          if (!recurrenceMatches.has(category)) recurrenceMatches.set(category, []);
          recurrenceMatches.get(category)!.push(tx.id);
          approvedByRecurrence.push(tx.id);
        } else {
          remainingForAI.push(tx);
        }
      }

      for (const [category, ids] of recurrenceMatches.entries()) {
        await supabase.from("transactions").update({
          category, is_recurring: true, status: "approved", confidence: 90,
        }).in("id", ids);
      }
    }

    // ── CAMADA 3: Claude Haiku ────────────────────────────────────────────────
    const { data: categoriesRaw } = await supabase
      .from("categories")
      .select("name")
      .eq("client_id", client_id)
      .eq("is_active", true)
      .order("sort_order");

    const categoryNames = (categoriesRaw ?? []).map((c) => c.name);
    // DIAGNÓSTICO: confirmar categorias carregadas
    console.log("[classify-batch] categorias ativas:", categoryNames.length, JSON.stringify(categoryNames));

    const { data: topPatterns } = await supabase
      .from("recurrence_patterns")
      .select("pattern, modal_category, occurrences")
      .eq("client_id", client_id)
      .order("occurrences", { ascending: false })
      .limit(10);

    if (categoryNames.length === 0 && remainingForAI.length > 0) {
      console.warn("[classify-batch] cliente sem categorias ativas — pulando camada 3, todas ficam pending");
    }

    const BATCH_SIZE = 50;
    let aiApproved = 0;
    let aiPending = 0;

    if (categoryNames.length > 0) {
      for (let i = 0; i < remainingForAI.length; i += BATCH_SIZE) {
        const batch = remainingForAI.slice(i, i + BATCH_SIZE);
        let results: AIResult[] = [];
        try {
          results = await classifyWithAI(batch, categoryNames, clientName, clientSegment, topPatterns ?? []);
        } catch (aiErr) {
          console.error("[classify-batch] AI batch failed after 3 retries, marking as pending:", aiErr);
          aiPending += batch.length;
          continue;
        }

        const resultIds = new Set(results.map((r) => r.id));
        const approvedGroups = new Map<string, { ids: string[]; category: string | null; is_recurring: boolean; confidence: number }>();

        for (const r of results) {
          const isKnownCategory = categoryNames.includes(r.cat);
          if (!isKnownCategory) {
            console.error(`[classify-batch] AI hallucinated category "${r.cat}" for tx ${r.id} — saving null`);
         const category = isKnownCategory ? r.cat : null;
          const key = `${category}||${r.rec ?? false}||${r.conf ?? 0}`;
          if (!approvedGroups.has(key)) {
            approvedGroups.set(key, { ids: [], category, is_recurring: r.rec ?? false, confidence: r.conf ?? 0 });
          }
          approvedGroups.get(key)!.ids.push(r.id);
          aiApproved++;
        }

        for (const { ids, category, is_recurring, confidence } of approvedGroups.values()) {
          await supabase.from("transactions").update({
            category, is_recurring, confidence, status: "approved",
          }).in("id", ids);
        }

        for (const tx of batch) {
          if (!resultIds.has(tx.id)) aiPending++;
        }
      }
    } else {
      aiPending = remainingForAI.length;
    }

    const totalApproved = approvedByRule.length + approvedByRecurrence.length + aiApproved;
    await supabase.from("uploads").update({
      status: "done",
      tx_classified: totalApproved,
      tx_pending: aiPending,
    }).eq("id", upload_id);

    console.log("[classify-batch]", {
      upload_id, client_id,
      byRule: approvedByRule.length,
      byRecurrence: approvedByRecurrence.length,
      aiApproved, aiPending, totalApproved,
    });

    return new Response(
      JSON.stringify({ success: true, approved: totalApproved, classified: totalApproved, pending_manual: aiPending
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("classify-batch error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});