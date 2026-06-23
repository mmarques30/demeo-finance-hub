// Aurora · Edge Function: expire-proposals
// Expira propostas com validity_days vencidos e status sent/viewed.
// Chamada pelo workflow n8n diário (09h BRT).
// Auth: X-Aurora-Service-Key (n8n/cron) — não exposta ao frontend.

import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const origin = req.headers.get("origin");

  const serviceKey = Deno.env.get("AURORA_SERVICE_KEY");
  const incomingKey = req.headers.get("x-aurora-service-key");

  if (!serviceKey || incomingKey !== serviceKey) {
    return jsonResponse({ error: "Não autorizado" }, 401, origin);
  }

  try {
    const supabase = serviceClient();
    const { data, error } = await supabase.rpc("expire_proposals");

    if (error) return jsonResponse({ error: error.message }, 500, origin);

    return jsonResponse({ ok: true, ...data }, 200, origin);
  } catch (err) {
    console.error("[expire-proposals]", err);
    return jsonResponse({ error: String(err) }, 500, origin);
  }
});
