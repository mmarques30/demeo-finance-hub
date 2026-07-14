// supabase/functions/_shared/supabase.ts
// Cliente Supabase com service role (server-side bypass de RLS).

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Cliente autenticado para validar o user atual a partir do bearer token.
export async function userFromAuthHeader(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const sb = serviceClient();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const sb = serviceClient();
  // 'owner' é superconjunto de 'admin' — ambos podem executar ações de administrador.
  // limit(1) em vez de maybeSingle: usuário pode ter múltiplas rows em user_roles.
  const { data } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "owner"])
    .limit(1);
  return (data?.length ?? 0) > 0;
}
