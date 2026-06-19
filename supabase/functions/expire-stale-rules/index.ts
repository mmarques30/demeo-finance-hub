// Aurora · Edge Function: expire-stale-rules
// Desativa regras de classificação ociosas criadas por aprovação:
//   source='approval', hits<3, sem uso há 180+ dias.
// Chamada pelo workflow n8n semanal (segunda-feira 09h BRT).
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
    const { error } = await supabase.rpc("expire_stale_rules");

    if (error) return jsonResponse({ error: error.message }, 500, origin);

    return jsonResponse({ ok: true }, 200, origin);
  } catch (err) {
    console.error("[expire-stale-rules]", err);
    return jsonResponse({ error: String(err) }, 500, origin);
  }
});
