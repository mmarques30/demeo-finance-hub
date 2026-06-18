import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const bench = SEGMENT_BENCHMARKS[segment ?? ""] ?? SEGMENT_BENCHMARKS["default"];
  const segLabel = segment ?? "geral";

  const config = {
    saudavel: {
      borderColor: "var(--green)",
      bg: "rgba(74,103,65,0.04)",
      color: "var(--green)",
      icon: "◉",
      label: "Saúde Financeira · Saudável",
      badge: `${margem.toFixed(1)}%`,
      message: `Margem líquida de ${margem.toFixed(1)}% está acima do referencial para ${segLabel} (≥ ${bench.healthy}%). Boa performance no período.`,
    },
    atencao: {
      borderColor: "var(--tan)",
      bg: "rgba(184,149,106,0.06)",
      color: "var(--tan)",
      icon: "◎",
      label: "Saúde Financeira · Atenção",
      badge: `${margem.toFixed(1)}%`,
      message: `Margem líquida de ${margem.toFixed(1)}% está abaixo do referencial saudável para ${segLabel} (${bench.caution}%–${bench.healthy}%). Avalie redução de custos ou reajuste de preços.`,
    },
    critico: {
      borderColor: "#C0392B",
      bg: "rgba(192,57,43,0.04)",
      color: "#C0392B",
      icon: "◈",
      label: "Saúde Financeira · Crítico",
      badge: `${margem.toFixed(1)}%`,
      message: `Margem líquida de ${margem.toFixed(1)}% está abaixo do mínimo recomendado para ${segLabel} (≥ ${bench.caution}%). Ação imediata: revise despesas e receitas deste período.`,
    },
    sem_dados: {
      borderColor: "var(--line)",
      bg: "#FAFAF8",
      color: "var(--muted-foreground)",
      icon: "◌",
      label: "Saúde Financeira · Sem dados",
      badge: null,
      message: `Nenhuma movimentação aprovada em ${period}. Selecione um período com lançamentos para ver a análise de saúde financeira.`,
    },
  }[health];

  return (
    <div
      style={{
        border: `1px solid ${config.borderColor}`,
        borderLeft: `3px solid ${config.borderColor}`,
        borderRadius: "var(--radius-lg, 8px)",
        overflow: "hidden",
      }}
    >
      {/* Header — sempre visível, clicável */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
        style={{ background: config.bg, border: "none", cursor: "pointer" }}
      >
        <span style={{ fontSize: 14, color: config.color, flexShrink: 0 }}>{config.icon}</span>
        <span
          className="text-[11px] uppercase flex-1"
          style={{ letterSpacing: "2px", fontWeight: 600, color: config.color }}
        >
          {config.label}
        </span>
        {config.badge && (
          <span
            className="text-[11px] px-2 py-0.5"
            style={{
              background: config.color,
              color: "#fff",
              borderRadius: "999px",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            {config.badge}
          </span>
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            color: config.color,
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <path d="M2 4.5L7 9.5L12 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Detalhe expansível */}
      {open && (
        <div
          className="px-4 py-3"
          style={{
            borderTop: `1px solid ${config.borderColor}`,
            background: config.bg,
          }}
        >
          <p className="text-[12px]" style={{ color: "var(--foreground)", lineHeight: 1.6 }}>
            {config.message}
          </p>
          <p className="mt-2 text-[10px] uppercase" style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)" }}>
            Período: {period} · Ref. {segLabel}: saudável ≥ {bench.healthy}% · atenção ≥ {bench.caution}%
          </p>
        </div>
      )}
    </div>
  );
}
