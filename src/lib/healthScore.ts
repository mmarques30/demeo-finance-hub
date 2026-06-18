export const SEGMENT_BENCHMARKS: Record<string, { healthy: number; caution: number }> = {
  "Serviços":   { healthy: 30, caution: 15 },
  "Comércio":   { healthy: 20, caution: 8  },
  "Indústria":  { healthy: 18, caution: 7  },
  "Tecnologia": { healthy: 35, caution: 18 },
  "Saúde":      { healthy: 25, caution: 12 },
  "Educação":   { healthy: 22, caution: 10 },
  "default":    { healthy: 20, caution: 8  },
};

export type HealthLevel = "saudavel" | "atencao" | "critico" | "sem_dados";

export function computeHealthLevel(
  receitas: number,
  despesas: number,
  segment: string | null
): HealthLevel {
  if (receitas <= 0) return "sem_dados";
  const margem = ((receitas - despesas) / receitas) * 100;
  const bench = SEGMENT_BENCHMARKS[segment ?? ""] ?? SEGMENT_BENCHMARKS["default"];
  if (margem >= bench.healthy) return "saudavel";
  if (margem >= bench.caution) return "atencao";
  return "critico";
}

export function healthMargemPct(receitas: number, despesas: number): number {
  if (receitas <= 0) return 0;
  return ((receitas - despesas) / receitas) * 100;
}
