// supabase/functions/_shared/rate-limit.ts
// Rate limit por IP usando uma tabela leve no Postgres (lazy created).
// Fallback: se a tabela não existir, não limita (degrada aberto).

import { serviceClient } from "./supabase.ts";

export async function checkRateLimit(
  ip: string,
  bucket: string,
  limit: number,
  windowMinutes: number,
): Promise<{ ok: boolean; remaining: number }> {
  if (!ip || ip === "unknown") return { ok: true, remaining: limit };
  const sb = serviceClient();
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count } = await sb
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("bucket", bucket)
    .gte("hit_at", since);

  const used = count ?? 0;
  if (used >= limit) return { ok: false, remaining: 0 };

  await sb.from("rate_limit_hits").insert({ ip, bucket });
  return { ok: true, remaining: limit - used - 1 };
}

// Stub para Turnstile (Cloudflare). Implementado quando TURNSTILE_SECRET estiver setado.
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET");
  if (!secret) return true; // sem secret, não valida
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const json = (await res.json()) as { success?: boolean };
    return !!json.success;
  } catch {
    return false;
  }
}
