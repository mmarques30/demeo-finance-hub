// Aurora · Edge Function: classify-batch (M02)
// 3 camadas de classificação por cliente:
// 1. Regras ativas (classification_rules WHERE is_active=true) — padrão mais longo ganha
// 2. Recorrência (view recurrence_patterns — aprovados nos últimos 90 dias)
// 3. Claude Haiku — categorias do banco + contexto de setor do cliente

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Replica normalize_description do banco em TypeScript
function normalizeDescription(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, "")  // remove datas
    .replace(/\b\d+\b/g, "")                     // remove números isolados
    .replace(/\s{2,}/g, " ")                     // remove espaços duplos
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

interface AIResult {
  id: string;
  cat: string;
  rec: boolean;
  conf: number;
}

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

  const { content } = await anthropic.messages.create({
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

Classifique cada lançamento abaixo. Retorne SOMENTE um JSON array, sem texto extra.
Formato: [{"id":"...","cat":"Categoria · Subcategoria","rec":true/false,"conf":0-100}]
- cat: exatamente uma das categorias listadas
- rec: true se for despesa ou receita recorrente mensal
- conf: sua confiança de 0 a 100

Lançamentos:
${JSON.stringify(payload)}`,
      },
    ],
  });

  const raw = content[0].type === "text" ? content[0].text.trim() : "[]";
  const match = raw.match(/\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : [];
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
      return new Response(
        JSON.stringify({ error: "upload_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Busca upload + client_id
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

    // Busca dados do cliente (nome + setor para contexto do Haiku)
    const { data: client } = await supabase
      .from("clients")
      .select("name, segment")
      .eq("id", client_id)
      .single();

    const clientName = client?.name ?? "Cliente";
    const clientSegment = client?.segment ?? "Empresa";

    // Busca transações pendentes do upload
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

    // ── CAMADA 1: Regras ativas ────────────────────────────────────────────────
    // Filtra is_active=true; padrões mais longos têm prioridade (mais específicos)
    const { data: rulesRaw } = await supabase
      .from("classification_rules")
      .select("pattern, category, is_recurring")
      .eq("client_id", client_id)
      .eq("is_active", true);

    // Ordena por comprimento decrescente (padrão mais específico ganha no desempate)
    const rules: Rule[] = (rulesRaw ?? []).sort(
      (a, b) => b.pattern.length - a.pattern.length
    );

    const approvedByRule: string[] = [];
    const remainingAfterRules: TxRow[] = [];

    for (const tx of pending as TxRow[]) {
      const normalized = buildPattern(tx.description);
      const match = rules.find((r) => normalized.startsWith(r.pattern));

      if (match) {
        await supabase.from("transactions").update({
          category: match.category,
          is_recurring: match.is_recurring ?? false,
          status: "approved",
          confidence: 100,
        }).eq("id", tx.id);

        // Atualiza hits e last_used da regra
        await supabase
          .from("classification_rules")
          .update({ last_used: new Date().toISOString() })
          .eq("client_id", client_id)
          .eq("pattern", match.pattern);

        approvedByRule.push(tx.id);
      } else {
        remainingAfterRules.push(tx);
      }
    }

    // ── CAMADA 2: Recorrência (view recurrence_patterns) ──────────────────────
    const approvedByRecurrence: string[] = [];
    const remainingForAI: TxRow[] = [];

    if (remainingAfterRules.length > 0) {
      const { data: recurrences } = await supabase
        .from("recurrence_patterns")
        .select("pattern, modal_category, occurrences")
        .eq("client_id", client_id);

      const recurrenceMap = new Map<string, string>();
      for (const r of recurrences ?? []) {
        recurrenceMap.set(r.pattern, r.modal_category);
      }

      for (const tx of remainingAfterRules) {
        const pattern = buildPattern(tx.description);
        const category = recurrenceMap.get(pattern);

        if (category) {
          await supabase.from("transactions").update({
            category,
            is_recurring: true,
            status: "approved",
            confidence: 90,
          }).eq("id", tx.id);
          approvedByRecurrence.push(tx.id);
        } else {
          remainingForAI.push(tx);
        }
      }
    }

    // ── CAMADA 3: Claude Haiku ─────────────────────────────────────────────────
    // Categorias do banco (não hardcoded)
    const { data: categoriesRaw } = await supabase
      .from("categories")
      .select("name")
      .eq("client_id", client_id)
      .eq("is_active", true)
      .order("sort_order");

    const categoryNames = (categoriesRaw ?? []).map((c) => c.name);

    // Top padrões recorrentes para contexto do prompt
    const { data: topPatterns } = await supabase
      .from("recurrence_patterns")
      .select("pattern, modal_category, occurrences")
      .eq("client_id", client_id)
      .order("occurrences", { ascending: false })
      .limit(10);

    const BATCH_SIZE = 50;
    let aiPending = 0;

    for (let i = 0; i < remainingForAI.length; i += BATCH_SIZE) {
      const batch = remainingForAI.slice(i, i + BATCH_SIZE);

      let results: AIResult[] = [];
      try {
        results = await classifyWithAI(
          batch,
          categoryNames,
          clientName,
          clientSegment,
          topPatterns ?? []
        );
      } catch (aiErr) {
        // Falha de IA (timeout, API fora do ar, etc.): todas as transações do batch ficam
        // como pending para revisão manual. O upload continua sem abortar.
        console.error("[classify-batch] AI batch error, marking batch as pending:", aiErr);
        aiPending += batch.length;
        continue;
      }

      for (const r of results) {
        const isKnownCategory = categoryNames.includes(r.cat);
        // Camada 3 (AI) apenas sugere categoria — status sempre "pending" para revisão manual
        await supabase.from("transactions").update({
          category: isKnownCategory ? r.cat : null,
          is_recurring: r.rec ?? false,
          confidence: r.conf ?? 0,
          status: "pending",
        }).eq("id", r.id);

        aiPending++;
      }

      // Transações sem resultado da IA ficam como pending
      const resultIds = new Set(results.map((r) => r.id));
      for (const tx of batch) {
        if (!resultIds.has(tx.id)) aiPending++;
      }
    }

    // Atualiza contadores do upload
    const totalApproved = approvedByRule.length + approvedByRecurrence.length;
    await supabase.from("uploads").update({
      status: "done",
      tx_classified: totalApproved,
      tx_pending: aiPending,
    }).eq("id", upload_id);

    console.log("[classify-batch]", {
      upload_id,
      client_id,
      byRule: approvedByRule.length,
      byRecurrence: approvedByRecurrence.length,
      aiPending,
      totalApproved,
    });

    return new Response(
      JSON.stringify({
        success: true,
        approved: totalApproved,
        classified: totalApproved,
        pending_manual: aiPending,
      }),
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
