// supabase/functions/create-client-user/index.ts
// POST admin-only. Cria usuário no Supabase Auth e vincula ao client_id com portal_role.
// Aceita: { client_id, email, display_name, portal_role }
// Retorna: { user_id, email }

import { z } from "https://esm.sh/zod@3.23.8";
import { handlePreflight, jsonResponse } from "../_shared/cors.ts";
import { serviceClient, userFromAuthHeader, isAdmin } from "../_shared/supabase.ts";

const BodySchema = z.object({
  client_id:    z.string().uuid(),
  email:        z.string().email(),
  display_name: z.string().min(2).max(100),
  portal_role:  z.enum(["owner", "financeiro"]).default("owner"),
});

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  const origin = req.headers.get("origin") ?? "";
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405, origin);

  // Somente admins podem criar usuários de portal
  const caller = await userFromAuthHeader(req);
  if (!caller) return jsonResponse({ error: "Não autenticado" }, 401, origin);
  if (!(await isAdmin(caller.id))) return jsonResponse({ error: "Acesso restrito a administradores" }, 403, origin);

  let body: z.infer<typeof BodySchema>;
  try { body = BodySchema.parse(await req.json()); }
  catch (e) { return jsonResponse({ error: String(e) }, 400, origin); }

  const { client_id, email, display_name, portal_role } = body;
  const sb = serviceClient();

  // Verificar se o client existe
  const { data: client } = await sb.from("clients").select("id, name").eq("id", client_id).single();
  if (!client) return jsonResponse({ error: "Cliente não encontrado" }, 404, origin);

  // Verificar se email já está mapeado para este cliente
  const { data: existing } = await sb
    .from("user_client_mapping")
    .select("id")
    .eq("client_id", client_id)
    .eq("email", email)
    .maybeSingle();
  if (existing) return jsonResponse({ error: "Este e-mail já está vinculado a este cliente" }, 409, origin);

  // Criar usuário no Supabase Auth (ou reutilizar se já existe no Auth)
  // sendEmail: true envia o e-mail de confirmação/convite automaticamente
  let userId: string;
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    email_confirm: false,         // força envio do confirmation email
    user_metadata: {
      display_name,
      client_id,                  // JWT claim usado pelo portal
    },
  });

  if (createErr) {
    // Se o usuário já existe no Auth, buscar pelo e-mail
    if (createErr.message?.toLowerCase().includes("already") || createErr.status === 422) {
      const { data: users } = await sb.auth.admin.listUsers();
      const found = users?.users?.find((u) => u.email === email);
      if (!found) return jsonResponse({ error: `Erro ao criar usuário: ${createErr.message}` }, 500, origin);
      userId = found.id;
    } else {
      return jsonResponse({ error: `Erro ao criar usuário: ${createErr.message}` }, 500, origin);
    }
  } else {
    userId = created.user.id;
    // Enviar invite (password reset email para definir senha)
    await sb.auth.admin.inviteUserByEmail(email).catch(() => null);
  }

  // Vincular ao cliente
  const { error: mapErr } = await sb.from("user_client_mapping").upsert({
    user_id:      userId,
    client_id,
    portal_role,
    email,
    display_name,
  }, { onConflict: "user_id,client_id" });

  if (mapErr) return jsonResponse({ error: `Erro ao vincular usuário: ${mapErr.message}` }, 500, origin);

  // Atualizar user_metadata com client_id (necessário para o JWT claim)
  await sb.auth.admin.updateUserById(userId, {
    user_metadata: { display_name, client_id },
  }).catch(() => null);

  return jsonResponse({ user_id: userId, email, portal_role }, 200, origin);
});
