// Funções puras de parsing de extratos bancários.
// Extraídas de supabase/functions/parse-extract/index.ts para serem
// testáveis em Node.js (sem dependências Deno).

export interface ParsedTransaction {
  date: string;
  description: string;
  raw_description: string;
  amount: number;
  bank: string;
}

export interface BankConfig {
  separator: string;
  dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";
  colDate: number;
  colDesc: number;
  colAmount: number;
  skipRows: number;
  skipKeywords: string[];
  negateAmount?: boolean;
}

export const BANK_CONFIGS: Record<string, BankConfig> = {
  nubank: {
    separator: ",",
    dateFormat: "YYYY-MM-DD",
    colDate: 0,
    colDesc: 2,
    colAmount: 3,
    skipRows: 1,
    skipKeywords: [],
  },
  itaú: {
    separator: ";",
    dateFormat: "DD/MM/YYYY",
    colDate: 0,
    colDesc: 1,
    colAmount: 2,
    skipRows: 3,
    skipKeywords: ["Saldo", "SALDO", "Total", "TOTAL"],
  },
  bradesco: {
    separator: ";",
    dateFormat: "DD/MM/YYYY",
    colDate: 0,
    colDesc: 3,
    colAmount: 4,
    skipRows: 4,
    skipKeywords: ["Saldo", "SALDO", "Total"],
  },
  inter: {
    separator: ",",
    dateFormat: "DD/MM/YYYY",
    colDate: 0,
    colDesc: 1,
    colAmount: 3,
    skipRows: 1,
    skipKeywords: ["Saldo"],
  },
  "banco do brasil": {
    separator: "\t",
    dateFormat: "DD/MM/YYYY",
    colDate: 0,
    colDesc: 2,
    colAmount: 3,
    skipRows: 2,
    skipKeywords: ["Saldo", "S A L D O"],
  },
  santander: {
    separator: ";",
    dateFormat: "DD/MM/YYYY",
    colDate: 0,
    colDesc: 1,
    colAmount: 3,
    skipRows: 2,
    skipKeywords: ["Saldo", "Total"],
  },
};

export function parseDate(raw: string, format: BankConfig["dateFormat"]): string {
  const clean = raw.trim().split(" ")[0];
  if (format === "YYYY-MM-DD") return clean;
  if (format === "DD/MM/YYYY") {
    const [d, m, y] = clean.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (format === "MM/DD/YYYY") {
    const [m, d, y] = clean.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return clean;
}

export function parseAmount(raw: string): number {
  const cleaned = raw
    .trim()
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.\-]/g, "");
  return parseFloat(cleaned) || 0;
}

export function cleanDescription(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

export function parseCSV(text: string, bankName: string): ParsedTransaction[] {
  const key = bankName.toLowerCase().trim();
  const config = BANK_CONFIGS[key];

  if (!config) {
    throw new Error(
      `Banco "${bankName}" não configurado. Bancos suportados: ${Object.keys(BANK_CONFIGS).join(", ")}`
    );
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const transactions: ParsedTransaction[] = [];

  for (let i = config.skipRows; i < lines.length; i++) {
    const line = lines[i];

    if (config.skipKeywords.some((kw) => line.includes(kw))) continue;

    const cols = line.split(config.separator).map((c) => c.replace(/^"|"$/g, "").trim());

    const maxCol = Math.max(config.colDate, config.colDesc, config.colAmount);
    if (cols.length < maxCol + 1) continue;

    const rawDate = cols[config.colDate];
    const rawDesc = cols[config.colDesc];
    const rawAmount = cols[config.colAmount];

    if (!rawDate || !rawDesc || !rawAmount) continue;

    let amount = parseAmount(rawAmount);
    if (config.negateAmount) amount = -amount;
    if (amount === 0) continue;

    transactions.push({
      date: parseDate(rawDate, config.dateFormat),
      description: cleanDescription(rawDesc),
      raw_description: rawDesc.trim(),
      amount,
      bank: bankName,
    });
  }

  return transactions;
}
