import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseCSV, parseDate, parseAmount } from "@/lib/parsers/csv";

const __dirname = dirname(fileURLToPath(import.meta.url));

const fixture = (name: string) =>
  readFileSync(join(__dirname, "__fixtures__", name), "utf-8");

// ────────────────────────────────────────────────
// parseDate
// ────────────────────────────────────────────────
describe("parseDate", () => {
  it("converte DD/MM/YYYY para ISO", () => {
    expect(parseDate("01/05/2026", "DD/MM/YYYY")).toBe("2026-05-01");
  });

  it("passa YYYY-MM-DD sem alterar", () => {
    expect(parseDate("2026-05-01", "YYYY-MM-DD")).toBe("2026-05-01");
  });

  it("ignora parte de hora", () => {
    expect(parseDate("01/05/2026 10:30", "DD/MM/YYYY")).toBe("2026-05-01");
  });
});

// ────────────────────────────────────────────────
// parseAmount
// ────────────────────────────────────────────────
describe("parseAmount", () => {
  it("converte valor com vírgula decimal", () => {
    expect(parseAmount("4820,00")).toBe(4820);
  });

  it("remove ponto de milhar", () => {
    expect(parseAmount("1.480,00")).toBe(1480);
  });

  it("mantém sinal negativo", () => {
    expect(parseAmount("-6800,00")).toBe(-6800);
  });

  it("retorna 0 para string vazia", () => {
    expect(parseAmount("")).toBe(0);
  });
});

// ────────────────────────────────────────────────
// parseCSV — Itaú
// ────────────────────────────────────────────────
describe("parseCSV — Itaú", () => {
  const csv = fixture("itau.csv");

  it("retorna 4 transações (valor 0 descartado)", () => {
    const result = parseCSV(csv, "Itaú");
    expect(result).toHaveLength(4);
  });

  it("ignora linha de Saldo", () => {
    const result = parseCSV(csv, "Itaú");
    const hasSaldo = result.some((t) => t.description.includes("SALDO"));
    expect(hasSaldo).toBe(false);
  });

  it("data em formato ISO", () => {
    const result = parseCSV(csv, "Itaú");
    expect(result[0].date).toBe("2026-05-01");
  });

  it("valor positivo (receita)", () => {
    const result = parseCSV(csv, "Itaú");
    const receita = result.find((t) => t.description.includes("VENDAS"));
    expect(receita?.amount).toBe(4820);
  });

  it("valor negativo (despesa)", () => {
    const result = parseCSV(csv, "Itaú");
    const aluguel = result.find((t) => t.description.includes("ALUGUEL"));
    expect(aluguel?.amount).toBe(-6800);
  });
});

// ────────────────────────────────────────────────
// parseCSV — Nubank
// ────────────────────────────────────────────────
describe("parseCSV — Nubank", () => {
  const csv = fixture("nubank.csv");

  it("retorna 3 transações", () => {
    const result = parseCSV(csv, "Nubank");
    expect(result).toHaveLength(3);
  });

  it("data YYYY-MM-DD mantida como ISO", () => {
    const result = parseCSV(csv, "Nubank");
    expect(result[0].date).toBe("2026-05-01");
  });
});

// ────────────────────────────────────────────────
// parseCSV — Bradesco
// ────────────────────────────────────────────────
describe("parseCSV — Bradesco", () => {
  const csv = fixture("bradesco.csv");

  it("retorna 2 transações (4 headers pulados, Saldo ignorado)", () => {
    const result = parseCSV(csv, "Bradesco");
    expect(result).toHaveLength(2);
  });

  it("ignora linha de Saldo", () => {
    const result = parseCSV(csv, "Bradesco");
    const hasSaldo = result.some((t) => t.description.includes("SALDO"));
    expect(hasSaldo).toBe(false);
  });
});

// ────────────────────────────────────────────────
// parseCSV — banco inválido
// ────────────────────────────────────────────────
describe("parseCSV — banco inválido", () => {
  it("lança erro com mensagem clara", () => {
    expect(() => parseCSV("data;desc;valor\n01/01/2026;TEST;100", "BancoX")).toThrow(
      'Banco "BancoX" não configurado'
    );
  });
});
