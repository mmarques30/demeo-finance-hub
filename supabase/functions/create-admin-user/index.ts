// supabase/functions/create-admin-user/index.ts
// POST owner/admin. Cria usuário administrador no Auth e garante role em user_roles.
// Requer: { email, display_name, password }
// Retorna: { user_id, email }

import { z } from "https://esm.sh/zod@3.23.8";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { serviceClient, userFromAuthHeader, isAdmin } from "../_shared/supabase.ts";

const BodySchema = z.object({
  email:        z.string().email(),
  display_name: z.string().min(2).max(100),
  password:     z.string().min(8),
});

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  const origin = req.headers.get("origin") ?? "";
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405, origin);

  const caller = await userFromAuthHeader(req);
  if (!caller) return jsonResponse({ error: "Não autenticado" }, 401, origin);
  // Qualquer admin/owner do painel pode convidar colegas administradores
  if (!(await isAdmin(caller.id))) {
    return jsonResponse({ error: "Apenas administradores podem convidar outros admins" }, 403, origin);
  }

  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch (e) { return jsonResponse({ error: String(e) }, 400, origin); }

  const { email, display_name, password } = body;
  const sb = serviceClient();

  // Localiza por e-mail (listUsers página a página — evita falso negativo)
  let userId: string | null = null;
  let page = 1;
  while (!userId && page <= 10) {
    const { data: listed } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    const found = listed?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) userId = found.id;
    if (!listed?.users?.length || listed.users.length < 200) break;
    page++;
  }

  if (userId) {
    await sb.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
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

  // Papéis atuais do usuário (o trigger tg_handle_new_user pode ter semeado 'client')
  const { data: roles } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));

  if (roleSet.has("owner")) {
    // Nunca rebaixa owner → admin; só atualiza meta
    const { error } = await sb
      .from("user_roles")
      .update({ display_name, email })
      .eq("user_id", userId)
      .eq("role", "owner");
    if (error) return jsonResponse({ error: `Erro ao atualizar papel: ${error.message}` }, 500, origin);
  } else if (roleSet.has("admin")) {
    const { error } = await sb
      .from("user_roles")
      .update({ display_name, email })
      .eq("user_id", userId)
      .eq("role", "admin");
    if (error) return jsonResponse({ error: `Erro ao atualizar papel: ${error.message}` }, 500, origin);
  } else {
    // Garante role admin (mesmo se existir só 'client' do trigger)
    const { error: roleErr } = await sb
      .from("user_roles")
      .insert({ user_id: userId, role: "admin", display_name, email });
    if (roleErr) return jsonResponse({ error: `Erro ao definir papel: ${roleErr.message}` }, 500, origin);
  }

  // Remove seed 'client' residual do trigger — admin do painel não é usuário-portal
  await sb.from("user_roles").delete().eq("user_id", userId).eq("role", "client").catch(() => null);

  return jsonResponse({
    ok: true,
    user_id: userId,
    email,
    role: roleSet.has("owner") ? "owner" : "admin",
  }, 200, origin);
});
