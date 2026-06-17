// Aurora · Edge Function: pending-count
// Retorna o total de transações pendentes agrupado por cliente.
// Usado pelo n8n para o digest agendado das 09:00.

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
    // Usa service_role internamente para acessar transactions sem RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: rows, error } = await supabase
      .from("transactions")
      .select("client_id, clients!inner(name)")
      .eq("status", "pending");

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Agrega por cliente
    const countMap = new Map<string, { name: string; count: number }>();
    for (const row of rows ?? []) {
      const clientName = (row.clients as { name: string } | null)?.name ?? "Desconhecido";
      const cur = countMap.get(row.client_id) ?? { name: clientName, count: 0 };
      countMap.set(row.client_id, { ...cur, count: cur.count + 1 });
    }

    const clients = Array.from(countMap.values()).sort((a, b) => b.count - a.count);
    const total = clients.reduce((s, c) => s + c.count, 0);

    return new Response(
      JSON.stringify({ total, clients }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("pending-count error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
