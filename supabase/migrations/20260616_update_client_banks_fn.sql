-- Atualiza cliente e bancos atomicamente (evita janela DELETE-sem-INSERT)
CREATE OR REPLACE FUNCTION update_client_with_banks(
  p_client_id  uuid,
  p_name       text,
  p_owner_name text,
  p_cnpj       text,
  p_status     text,
  p_banks      text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE clients
     SET name        = p_name,
         owner_name  = p_owner_name,
         cnpj        = p_cnpj,
         status      = p_status
   WHERE id = p_client_id;

  DELETE FROM client_banks WHERE client_id = p_client_id;

  IF array_length(p_banks, 1) IS NOT NULL THEN
    INSERT INTO client_banks (client_id, bank_name)
    SELECT p_client_id, bank FROM unnest(p_banks) AS bank;
  END IF;
END;
$$;
