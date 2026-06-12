-- Garante role 'admin' para o usuário gestora (claudia@aurora.com.br).
-- O trigger tg_handle_new_user cria role='client' por padrão para novos usuários.
-- Usuários criados antes da migração 202606b_user_roles (ou via SQL direto)
-- podem não ter a linha 'admin' em user_roles, o que faz is_admin() retornar false
-- e bloqueia INSERT em transactions via RLS.

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'claudia@aurora.com.br'
ON CONFLICT (user_id, role) DO NOTHING;
