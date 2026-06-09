import { useReveal, useCountUp } from "@/hooks/useReveal";

type Stat = {
  end: number;
  label: string;
  prefix?: string;
  suffix?: string;
  fractional?: number;
};

const STATS: Stat[] = [
  { end: 42, label: "Empresas sob gestão", suffix: "+" },
  { end: 12, label: "Milhões em fluxo organizado", prefix: "R$ ", suffix: "M" },
  { end: 96, label: "Fechamentos no prazo", suffix: "%" },
  { end: 5, label: "Anos cuidando do caixa de PMEs", suffix: "+" },
];

export function StatsBand() {
  const { ref, visible } = useReveal<HTMLDivElement>({ threshold: 0.3 });
  return (
    <div
      ref={ref}
      className="grid grid-cols-2 md:grid-cols-4 gap-px"
      style={{ background: "var(--line)" }}
    >
      {STATS.map((s, i) => (
        <StatCell key={s.label} s={s} delay={i * 120} animate={visible} />
      ))}
    </div>
  );
}

function StatCell({ s, delay, animate }: { s: Stat; delay: number; animate: boolean }) {
  const v = useCountUp(s.end, animate, 1600 + delay);
  const display =
    s.fractional !== undefined
      ? v.toFixed(s.fractional)
      : v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  return (
    <div
      className="p-7 lg:p-9 flex flex-col"
      style={{
        background: "var(--linen2)",
        transition: `opacity 0.6s ${delay}ms, transform 0.6s ${delay}ms`,
        opacity: animate ? 1 : 0,
        transform: animate ? "translateY(0)" : "translateY(16px)",
      }}
    >
      <div className="aurora-cap mb-3" style={{ color: "var(--sage)" }}>
        {s.label}
      </div>
      <div
        className="aurora-serif"
        style={{
          fontSize: "clamp(36px, 5vw, 56px)",
          color: "var(--green)",
          lineHeight: 1,
          letterSpacing: "-1.5px",
          fontFeatureSettings: "'tnum' 1",
        }}
      >
        {s.prefix ?? ""}
        {display}
        {s.suffix ?? ""}
      </div>
    </div>
  );
}
