import { test, expect } from "@playwright/test";
import { join } from "path";

const FIXTURE_PATH = join(__dirname, "../unit/parsers/__fixtures__/itau.csv");

test.describe("Importar Extratos — fluxo completo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/importar");
  });

  test("upload de CSV Itaú exibe transações na tabela", async ({ page }) => {
    // Simula upload via input de arquivo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_PATH);

    // Aguarda os 3 estágios do spinner desaparecerem
    await expect(page.getByText("Lendo arquivo...")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Classificando com IA...")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Classificando com IA...")).not.toBeVisible({ timeout: 30000 });

    // Verifica que a tabela de resultados apareceu
    await expect(page.getByText("Resultado")).toBeVisible();
    await expect(page.getByText("lançamentos")).toBeVisible();
  });

  test("PIX 4521 aparece como pendente de classificação", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_PATH);

    // Aguarda o processamento terminar
    await expect(page.getByText("Classificando com IA...")).not.toBeVisible({ timeout: 30000 });

    // PIX 4521 deve estar presente e pendente
    await expect(page.getByText("PIX 4521")).toBeVisible();
    await expect(page.getByText("Pendente de classificação")).toBeVisible();
  });

  test("exibe erro para arquivo com formato inválido", async ({ page }) => {
    // Cria um arquivo txt inválido in-memory usando Buffer
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "extrato.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("arquivo invalido"),
    });

    // Aguarda mensagem de erro aparecer
    await expect(page.locator(".aurora-card").filter({ hasText: "!" })).toBeVisible({
      timeout: 15000,
    });
  });
});
