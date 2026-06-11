// Aurora · Edge Function: create-upload
// Recebe arquivo em base64 + metadados, faz upload para Storage,
// insere em uploads, aciona parse-extract e retorna as transações.
// Opera com service_role para contornar RLS — chamado via anon key pelo frontend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { file_base64, filename, client_id, bank_name, period } = await req.json();

    if (!file_base64 || !filename || !client_id || !bank_name) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: file_base64, filename, client_id, bank_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Upload para Storage
    const fileBytes = Uint8Array.from(atob(file_base64), (c) => c.charCodeAt(0));
    const ext = filename.toLowerCase().split(".").pop();
    const contentType =
      ext === "csv" ? "text/csv" :
      ext === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :
      ext === "xls" ? "application/vnd.ms-excel" :
      "application/octet-stream";

    // Valida existência do cliente antes de processar
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", client_id)
      .maybeSingle();

    if (!client) {
      return new Response(
        JSON.stringify({ error: "Cliente não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const storagePath = `${client_id}/${Date.now()}-${filename}`;

    const { error: storageError } = await supabase.storage
      .from("extratos")
      .upload(storagePath, fileBytes, { contentType, upsert: false });

    if (storageError) {
      return new Response(
        JSON.stringify({ error: `Erro no Storage: ${storageError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. INSERT em uploads
    const uploadPeriod =
      period ||
      new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });

    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .insert({
        client_id,
        bank_name,
        filename,
        storage_path: storagePath,
        period: uploadPeriod,
        status: "processing",
      })
      .select()
      .single();

    if (uploadError || !upload) {
      return new Response(
        JSON.stringify({ error: `Erro ao registrar upload: ${uploadError?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Aciona parse-extract
    const parseRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/parse-extract`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        },
        body: JSON.stringify({ upload_id: upload.id }),
      }
    );

    const parseResult = await parseRes.json();

    if (!parseRes.ok) {
      return new Response(
        JSON.stringify({ error: `parse-extract falhou: ${parseResult.error}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Aciona classify-batch
    const classifyRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/classify-batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        },
        body: JSON.stringify({ upload_id: upload.id }),
      }
    );

    const classifyData = await classifyRes.json().catch(() => ({ classified: 0, pending_manual: 0 }));
    if (!classifyRes.ok) {
      await supabase
        .from("uploads")
        .update({ error_message: `classify-batch: ${classifyData.error ?? "unknown"}` })
        .eq("id", upload.id);
    }

    // 5. Busca transações já classificadas
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, date, description, amount, category, status, is_recurring, confidence")
      .eq("upload_id", upload.id)
      .order("date");

    // 6. Notifica n8n (fire and forget)
    fetch("https://mariaiaplicada.app.n8n.cloud/webhook/aurora-extrato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upload_id: upload.id,
        client_id,
        tx_count: parseResult.tx_count ?? 0,
        classified: classifyData.classified ?? 0,
        pending_manual: classifyData.pending_manual ?? 0,
      }),
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        success: true,
        upload_id: upload.id,
        tx_count: parseResult.tx_count,
        transactions: transactions || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("create-upload error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
