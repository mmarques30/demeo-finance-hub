-- Garante que o role authenticated pode executar is_admin() e tg_handle_new_user()
-- Sem este GRANT o Postgres nega a chamada quando as RLS policies avaliam is_admin(),
-- resultando em "permission denied for function is_admin" ao fazer qualquer query
-- em tabelas protegidas por essas policies.

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
