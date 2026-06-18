// Aurora · Edge Function: send-push
// SCAFFOLD — não ativo ainda. Ativar após configurar VAPID keys como Supabase Secrets.
//
// Para ativar:
//   1. Gerar VAPID keys: npx web-push generate-vapid-keys
//   2. Registrar como secrets do Supabase:
//      supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:tech@iaplicada.com
//   3. Conectar este endpoint ao workflow n8n como step paralelo ao e-mail

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders as getCorsHeaders, handlePreflight } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflightRes = handlePreflight(req);
  if (preflightRes) return preflightRes;
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT");

  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "VAPID keys não configuradas. Veja os comentários deste arquivo para ativar.",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { title, body, url } = await req.json();

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth");

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, message: "Nenhuma subscription registrada." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TODO: importar web-push via esm.sh e enviar para cada subscription
    // Exemplo:
    // import webpush from "https://esm.sh/web-push@3.6.7";
    // webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    // for (const sub of subscriptions) {
    //   await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    //     JSON.stringify({ title, body, url })
    //   );
    // }

    return new Response(
      JSON.stringify({ ok: true, sent: subscriptions.length, message: "Scaffold — ativar após configurar VAPID." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
