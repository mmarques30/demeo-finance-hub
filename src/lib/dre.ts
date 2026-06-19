// Funções puras para DRE — compartilhadas entre admin.dfc e admin.relatorios

export interface CatInfo { group_name: string; type: string }

export interface DREGroup {
  name: string;
  lines: { cat: string; total: number }[];
  subtotal: number;
  isExpense: boolean;
}

export interface DREData {
  groups: DREGroup[];
  receitaBruta: number;
  despFixas: number;
  despVar: number;
  ebitda: number;
  investimentos: number;
  resultadoLiquido: number;
}

export const DRE_GROUP_ORDER = ["Receita", "Despesa Fixa", "Despesa Variável", "Investimento", "Outros"];
/** Grupo após o qual o EBITDA é calculado na DRE */
export const DRE_EBITDA_PIVOT = "Despesa Variável";

export function computeDRE(
  txs: { amount: number; category: string | null }[],
  catMap: Map<string, CatInfo>
): DREData {
  const groupMap = new Map<string, Map<string, number>>();
  for (const tx of txs) {
    const info = catMap.get(tx.category ?? "");
    const groupName = info?.group_name ?? "Outros";
    if (!groupMap.has(groupName)) groupMap.set(groupName, new Map());
    const cats = groupMap.get(groupName)!;
    const cat = tx.category ?? "Sem categoria";
    // Sempre valor absoluto — sinal vem do grupo (receita vs despesa)
    cats.set(cat, (cats.get(cat) ?? 0) + Math.abs(tx.amount));
  }

  const groups: DREGroup[] = [];
  for (const groupName of DRE_GROUP_ORDER) {
    const cats = groupMap.get(groupName);
    if (!cats) continue;
    const isExpense = groupName !== "Receita";
    const lines = Array.from(cats.entries())
      .map(([cat, total]) => ({ cat, total }))
      .sort((a, b) => b.total - a.total);
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    groups.push({ name: groupName, lines, subtotal, isExpense });
  }

  const receitaBruta   = groups.find((g) => g.name === "Receita")?.subtotal ?? 0;
  const despFixas      = groups.find((g) => g.name === "Despesa Fixa")?.subtotal ?? 0;
  const despVar        = groups.find((g) => g.name === "Despesa Variável")?.subtotal ?? 0;
  const investimentos  = groups.find((g) => g.name === "Investimento")?.subtotal ?? 0;
  const ebitda         = receitaBruta - despFixas - despVar;
  const resultadoLiquido = ebitda - investimentos;

  return { groups, receitaBruta, despFixas, despVar, ebitda, investimentos, resultadoLiquido };
}
