// Aurora · Edge Function: classify-batch
// Classifica as transações de um upload em 3 camadas:
// 1. Regras salvas (classification_rules) → status=approved
// 2. Recorrentes do mês anterior → status=approved
// 3. Desconhecidas → Claude Haiku em batches de 50 → classified/pending

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORIAS = [
  "Receita · Vendas",
  "Receita · Serviços",
  "Receita · Delivery",
  "Despesa Fixa · Aluguel",
  "Despesa Fixa · Salários",
  "Despesa Fixa · Utilidades",
  "Despesa Variável · Insumos",
  "Despesa Variável · Marketing",
  "Investimento · Equipamentos",
];

interface TxRow {
  id: string;
  description: string;
  amount: number;
  client_id: string;
}

interface ClassifyResult {
  id: string;
  cat: string;
  rec: boolean;
  conf: number;
}

async function classifyWithAI(transactions: TxRow[]): Promise<ClassifyResult[]> {
  const client = new Anthropic();
  const payload = transactions.map((t) => ({
    id: t.id,
    desc: t.description,
    valor: t.amount,
  }));

  const { content } = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Classifique cada lançamento financeiro. SOMENTE JSON array de retorno, sem texto extra.

Categorias disponíveis: ${CATEGORIAS.join(", ")}

Lançamentos:
${JSON.stringify(payload)}

Retorne: [{"id":"...","cat":"Categoria · Subcategoria","rec":true/false,"conf":0-100}]
- rec: true se parecer despesa/receita recorrente mensal
- conf: sua confiança de 0 a 100`,
      },
    ],
  });

  const raw = content[0].type === "text" ? content[0].text.trim() : "[]";
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
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

    // Camada 1: Regras salvas (classification_rules)
    const { data: rules } = await supabase
      .from("classification_rules")
      .select("pattern, category, is_recurring, hit_count")
      .eq("client_id", client_id);

    const approvedByRule: string[] = [];
    const remainingAfterRules: TxRow[] = [];

    for (const tx of pending as TxRow[]) {
      const match = rules?.find((r) =>
        tx.description.toLowerCase().includes(r.pattern.toLowerCase())
      );
      if (match) {
        await supabase.from("transactions").update({
          category: match.category,
          is_recurring: match.is_recurring ?? false,
          status: "approved",
          confidence: 100,
        }).eq("id", tx.id);

        // Incrementa hit_count da regra
        await supabase.from("classification_rules")
          .update({ hit_count: (match.hit_count ?? 0) + 1 })
          .eq("client_id", client_id)
          .eq("pattern", match.pattern);

        approvedByRule.push(tx.id);
      } else {
        remainingAfterRules.push(tx);
      }
    }

    // Camada 2: Recorrentes do mês anterior (mesma descrição + client_id + status=approved)
    const approvedByRecurrence: string[] = [];
    const remainingForAI: TxRow[] = [];

    for (const tx of remainingAfterRules) {
      const { data: prev } = await supabase
        .from("transactions")
        .select("category, is_recurring")
        .eq("client_id", client_id)
        .eq("description", tx.description)
        .eq("status", "approved")
        .eq("is_recurring", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prev) {
        await supabase.from("transactions").update({
          category: prev.category,
          is_recurring: true,
          status: "approved",
          confidence: 95,
        }).eq("id", tx.id);
        approvedByRecurrence.push(tx.id);
      } else {
        remainingForAI.push(tx);
      }
    }

    // Camada 3: Claude Haiku em batches de 50
    const BATCH_SIZE = 50;
    let aiClassified = 0;
    let aiPending = 0;

    for (let i = 0; i < remainingForAI.length; i += BATCH_SIZE) {
      const batch = remainingForAI.slice(i, i + BATCH_SIZE);
      const results = await classifyWithAI(batch);

      for (const r of results) {
        const isKnownCategory = CATEGORIAS.includes(r.cat);
        const status = isKnownCategory && r.conf >= 70 ? "classified" : "pending";

        await supabase.from("transactions").update({
          category: isKnownCategory ? r.cat : null,
          is_recurring: r.rec ?? false,
          confidence: r.conf ?? 0,
          status,
        }).eq("id", r.id);

        if (status === "classified") aiClassified++;
        else aiPending++;
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
      tx_classified: aiClassified,
      tx_pending: aiPending,
    }).eq("id", upload_id);

    return new Response(
      JSON.stringify({
        success: true,
        approved: totalApproved,
        classified: aiClassified,
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
