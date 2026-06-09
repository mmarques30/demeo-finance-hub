// supabase/functions/proposal-view/index.ts
// POST público. Marca viewed_at na primeira visualização da proposta.

import { z } from "https://esm.sh/zod@3.23.8";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

const BodySchema = z.object({ token: z.string().min(8) });

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  const origin = req.headers.get("origin");

  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, origin);

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return jsonResponse({ error: "Token inválido" }, 422, origin);
  }

  const sb = serviceClient();
  const { data: proposal } = await sb
    .from("proposals")
    .select("id, status, viewed_at")
    .eq("public_token", body.token)
    .maybeSingle();
  if (!proposal) return jsonResponse({ ok: false }, 404, origin);

  if (!proposal.viewed_at) {
    await sb
      .from("proposals")
      .update({
        viewed_at: new Date().toISOString(),
        status: proposal.status === "sent" ? "viewed" : proposal.status,
      })
      .eq("id", proposal.id);
  }
  return jsonResponse({ ok: true }, 200, origin);
});
