// supabase/functions/proposal-send/index.ts
// POST autenticado. Envia a proposta por e-mail via Resend e atualiza status para 'sent'.

import { z } from "https://esm.sh/zod@3.23.8";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { serviceClient, userFromAuthHeader, isAdmin } from "../_shared/supabase.ts";

const BodySchema = z.object({ proposal_id: z.string().uuid() });

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  const origin = req.headers.get("origin");

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

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return jsonResponse({ error: "RESEND_API_KEY não configurada" }, 503, origin);

  const sb = serviceClient();

  const { data: proposal } = await sb
    .from("proposals")
    .select("id, number, status, client_name, client_email, public_token, pdf_url, total_monthly")
    .eq("id", body.proposal_id)
    .single();

  if (!proposal) return jsonResponse({ error: "Proposta não encontrada" }, 404, origin);
  if (!proposal.client_email) return jsonResponse({ error: "Proposta sem e-mail do cliente" }, 422, origin);
  if (proposal.status === "accepted") return jsonResponse({ error: "Proposta já aceita" }, 409, origin);

  const appUrl    = Deno.env.get("AURORA_APP_URL") ?? "https://aurora.demeo.com.br";
  const from      = Deno.env.get("AURORA_NOTIFY_FROM") ?? "Aurora <noreply@aurora.demeo.com.br>";
  const publicUrl = `${appUrl}/p/proposta/${proposal.public_token}`;

  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const html = `
    <div style="font-family:'Georgia',serif;font-size:15px;color:#1C1C19;line-height:1.7;max-width:600px;margin:0 auto">
      <div style="border-bottom:2px solid #E2D8CC;padding-bottom:24px;margin-bottom:32px">
        <span style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7A7260">
          Aurora · Gestão Financeira
        </span>
        <h1 style="font-weight:400;font-size:28px;margin:8px 0 0;letter-spacing:-0.5px;color:#1C1C19">
          Proposta para <em style="color:#4A6741">${proposal.client_name}</em>
        </h1>
      </div>

      <p>Olá, ${proposal.client_name.split(" ")[0]}.</p>
      <p>Segue a proposta <strong>${proposal.number}</strong> — valor mensal de <strong>${brl(Number(proposal.total_monthly))}</strong>.</p>
      <p style="margin-top:24px">
        <a href="${publicUrl}"
           style="background:#4A6741;color:#fff;text-decoration:none;padding:14px 28px;
                  letter-spacing:2px;text-transform:uppercase;font-size:11px;
                  font-family:Arial,sans-serif;display:inline-block;border-radius:2px">
          Ver proposta →
        </a>
      </p>
      ${proposal.pdf_url ? `<p style="margin-top:12px"><a href="${proposal.pdf_url}" style="color:#4A6741;font-size:13px">Baixar PDF</a></p>` : ""}
      <p style="margin-top:32px;font-size:13px;color:#7A7260">
        Qualquer dúvida, é só responder a este e-mail.<br>
        O link é válido por ${14} dias.
      </p>
      <div style="border-top:1px solid #E2D8CC;margin-top:40px;padding-top:16px;font-size:11px;color:#7A7260;font-family:Arial,sans-serif">
        Aurora · Clareza que envolve. Resultado que permanece.
      </div>
    </div>
  `;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: proposal.client_email,
        subject: `Proposta ${proposal.number} · Aurora`,
        html,
      }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      console.error("Resend error:", j);
      return jsonResponse({ error: "Falha ao enviar e-mail" }, 502, origin);
    }
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: "Falha ao enviar e-mail" }, 502, origin);
  }

  await sb
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", proposal.id);

  return jsonResponse({ ok: true, sent_to: proposal.client_email }, 200, origin);
});
