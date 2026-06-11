// Testes de integração — chamadas reais às Edge Functions e ao banco Supabase.
// Requer .env.test preenchido com credenciais de um projeto de testes.
//
// Executar: npm run test:integration
//
// ATENÇÃO: estes testes criam dados reais no projeto de teste.
// Certifique-se de usar um projeto Supabase separado do de produção.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const fixtureBase64 = (name: string) => {
  const buf = readFileSync(join(__dirname, "../unit/parsers/__fixtures__", name));
  return buf.toString("base64");
};

// ID de cliente de testes (deve existir no banco de testes)
const TEST_CLIENT_ID = process.env.TEST_CLIENT_ID || "00000000-0000-0000-0000-000000000001";

describe("create-upload Edge Function", () => {
  let uploadId: string;

  it("processa CSV Itaú válido e retorna transações", async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({
        file_base64: fixtureBase64("itau.csv"),
        filename: "itau.csv",
        client_id: TEST_CLIENT_ID,
        bank_name: "Itaú",
        period: "05/2026",
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.tx_count).toBeGreaterThan(0);
    expect(data.transactions).toBeInstanceOf(Array);
    uploadId = data.upload_id;
  });

  it("upload ficou com status done no banco", async () => {
    if (!uploadId) return;
    const { data } = await supabase
      .from("uploads")
      .select("status")
      .eq("id", uploadId)
      .single();
    expect(data?.status).toBe("done");
  });

  it("retorna 404 para client_id inválido", async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({
        file_base64: fixtureBase64("itau.csv"),
        filename: "itau.csv",
        client_id: "00000000-0000-0000-0000-000000000000",
        bank_name: "Itaú",
      }),
    });
    expect(res.status).toBe(404);
  });
});
