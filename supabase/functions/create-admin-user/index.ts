// supabase/functions/create-admin-user/index.ts
// POST owner-only. Cria um novo usuário administrador no Supabase Auth e insere em user_roles.
// Requer: { email, display_name, password }
// Retorna: { user_id, email }

import { z } from "https://esm.sh/zod@3.23.8";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { serviceClient, userFromAuthHeader } from "../_shared/supabase.ts";

const BodySchema = z.object({
  email:        z.string().email(),
  display_name: z.string().min(2).max(100),
  password:     z.string().min(8),
});

async function isOwner(userId: string): Promise<boolean> {
  const sb = serviceClient();
  const { data } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle();
  return !!data;
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  const origin = req.headers.get("origin") ?? "";
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405, origin);

  const caller = await userFromAuthHeader(req);
  if (!caller) return jsonResponse({ error: "Não autenticado" }, 401, origin);
  if (!(await isOwner(caller.id))) return jsonResponse({ error: "Apenas o owner pode convidar administradores" }, 403, origin);

  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch (e) { return jsonResponse({ error: String(e) }, 400, origin); }

  const { email, display_name, password } = body;
  const sb = serviceClient();

  // Verificar se e-mail já é administrador
  const { data: users } = await sb.auth.admin.listUsers();
  const existing = users?.users?.find((u) => u.email === email);

  let userId: string;

  if (existing) {
    userId = existing.id;
    // Atualiza display_name e senha
    await sb.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { display_name },
    }).catch(() => null);
  } else {
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name },
    });
    if (createErr || !created?.user) {
      return jsonResponse({ error: `Erro ao criar usuário: ${createErr?.message ?? "desconhecido"}` }, 500, origin);
    }
    userId = created.user.id;
  }

  // Upsert em user_roles com role='admin' (não altera se já for 'owner')
  const { data: existingRole } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingRole) {
    const { error: roleErr } = await sb
      .from("user_roles")
      .insert({ user_id: userId, role: "admin", display_name, email });
    if (roleErr) return jsonResponse({ error: `Erro ao definir papel: ${roleErr.message}` }, 500, origin);
  } else {
    // Atualiza display_name e email se o registro já existe
    await sb.from("user_roles").update({ display_name, email }).eq("user_id", userId).catch(() => null);
  }

  return jsonResponse({ ok: true, user_id: userId, email }, 200, origin);
});
