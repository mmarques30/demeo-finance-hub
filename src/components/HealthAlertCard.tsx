import { HealthLevel, SEGMENT_BENCHMARKS } from "@/lib/healthScore";

export function HealthAlertCard({
  health,
  margem,
  segment,
  period,
}: {
  health: HealthLevel;
  margem: number;
  segment: string | null;
  period: string;
}) {
  const bench = SEGMENT_BENCHMARKS[segment ?? ""] ?? SEGMENT_BENCHMARKS["default"];
  const segLabel = segment ?? "geral";

  const config = {
    saudavel: {
      borderColor: "var(--green)",
      bg: "rgba(74,103,65,0.05)",
      color: "var(--green)",
      icon: "◉",
      label: "Saúde Financeira · Saudável",
      message: `Margem líquida de ${margem.toFixed(1)}% está acima do referencial para ${segLabel} (≥ ${bench.healthy}%). Boa performance no período.`,
    },
    atencao: {
      borderColor: "var(--tan)",
      bg: "rgba(184,149,106,0.07)",
      color: "var(--tan)",
      icon: "◎",
      label: "Saúde Financeira · Atenção",
      message: `Margem líquida de ${margem.toFixed(1)}% está abaixo do referencial saudável para ${segLabel} (${bench.caution}%–${bench.healthy}%). Avalie redução de custos ou reajuste de preços.`,
    },
    critico: {
      borderColor: "#C0392B",
      bg: "rgba(192,57,43,0.05)",
      color: "#C0392B",
      icon: "◈",
      label: "Saúde Financeira · Crítico",
      message: `Margem líquida de ${margem.toFixed(1)}% está abaixo do mínimo recomendado para ${segLabel} (≥ ${bench.caution}%). Ação imediata: revise despesas e receitas deste período.`,
    },
    sem_dados: {
      borderColor: "var(--line)",
      bg: "#FAFAF8",
      color: "var(--muted-foreground)",
      icon: "◌",
      label: "Saúde Financeira · Sem dados no período",
      message: `Nenhuma movimentação aprovada em ${period}. Selecione um período com lançamentos para ver a análise de saúde financeira.`,
    },
  }[health];

  return (
    <div
      className="flex items-start gap-4 px-6 py-5"
      style={{
        background: config.bg,
        border: `1px solid ${config.borderColor}`,
        borderLeft: `4px solid ${config.borderColor}`,
        borderRadius: "var(--radius-lg, 8px)",
      }}
    >
      <span style={{ fontSize: 20, color: config.color, lineHeight: 1.4, flexShrink: 0 }}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase mb-1" style={{ letterSpacing: "2px", fontWeight: 600, color: config.color }}>
          {config.label}
        </div>
        <div className="text-[13px]" style={{ color: "var(--foreground)", lineHeight: 1.6 }}>
          {config.message}
        </div>
        <div className="mt-2 text-[10px] uppercase" style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)" }}>
          Período: {period} · Ref. {segLabel}: saudável ≥ {bench.healthy}% · atenção ≥ {bench.caution}%
        </div>
      </div>
    </div>
  );
}
