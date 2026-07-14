// supabase/functions/manage-admin-user/index.ts
// POST admin/owner. Atualiza ou remove um administrador do painel Aurora.
// body: { action: "update"|"delete", user_id, display_name?, email?, password? }

import { z } from "https://esm.sh/zod@3.23.8";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { serviceClient, userFromAuthHeader, isAdmin } from "../_shared/supabase.ts";

const BodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    user_id: z.string().uuid(),
    display_name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
  }),
  z.object({
    action: z.literal("delete"),
    user_id: z.string().uuid(),
  }),
]);

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  const origin = req.headers.get("origin") ?? "";
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405, origin);

  const caller = await userFromAuthHeader(req);
  if (!caller) return jsonResponse({ error: "Não autenticado" }, 401, origin);
  if (!(await isAdmin(caller.id))) {
    return jsonResponse({ error: "Apenas administradores podem gerenciar usuários do painel" }, 403, origin);
  }

  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch (e) { return jsonResponse({ error: String(e) }, 400, origin); }

  const sb = serviceClient();

  const { data: targetRole } = await sb
    .from("user_roles")
    .select("role, display_name, email")
    .eq("user_id", body.user_id)
    .in("role", ["admin", "owner"])
    .limit(1)
    .maybeSingle();

  if (!targetRole) {
    return jsonResponse({ error: "Usuário administrador não encontrado" }, 404, origin);
  }

  if (body.action === "update") {
    const { user_id, display_name, email, password } = body;
    if (!display_name && !email && !password) {
      return jsonResponse({ error: "Nada para atualizar" }, 400, origin);
    }

    const authPatch: Record<string, unknown> = {};
    if (password) authPatch.password = password;
    if (email) {
      authPatch.email = email;
      authPatch.email_confirm = true;
    }
    if (display_name) {
      authPatch.user_metadata = { display_name };
    }

    if (Object.keys(authPatch).length > 0) {
      const { error: authErr } = await sb.auth.admin.updateUserById(user_id, authPatch);
      if (authErr) return jsonResponse({ error: `Erro ao atualizar Auth: ${authErr.message}` }, 500, origin);
    }

    const rolePatch: Record<string, string> = {};
    if (display_name) rolePatch.display_name = display_name;
    if (email) rolePatch.email = email;
    if (Object.keys(rolePatch).length > 0) {
      const { error: roleErr } = await sb
        .from("user_roles")
        .update(rolePatch)
        .eq("user_id", user_id)
        .in("role", ["admin", "owner"]);
      if (roleErr) return jsonResponse({ error: `Erro ao atualizar papel: ${roleErr.message}` }, 500, origin);
    }

    // Mantém profiles.display_name alinhado quando existir
    if (display_name) {
      await sb.from("profiles").update({ display_name }).eq("user_id", user_id).catch(() => null);
    }

    return jsonResponse({ ok: true, user_id, action: "update" }, 200, origin);
  }

  // delete
  if (body.user_id === caller.id) {
    return jsonResponse({ error: "Você não pode remover o próprio acesso admin." }, 400, origin);
  }
  if (targetRole.role === "owner") {
    return jsonResponse({ error: "Não é possível remover o Owner da conta. Transfira o papel antes." }, 400, origin);
  }

  const { error: delErr } = await sb
    .from("user_roles")
    .delete()
    .eq("user_id", body.user_id)
    .eq("role", "admin");
  if (delErr) return jsonResponse({ error: `Erro ao remover admin: ${delErr.message}` }, 500, origin);

  // Opcional: se não restar nenhum papel de painel, remove seed client órfão
  // e não apaga o usuário Auth (pode ter acesso portal em outro client).
  return jsonResponse({ ok: true, user_id: body.user_id, action: "delete" }, 200, origin);
});
