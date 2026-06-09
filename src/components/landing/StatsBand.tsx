import { useReveal, useCountUp } from "@/hooks/useReveal";

type Stat = {
  end: number;
  label: string;
  prefix?: string;
  suffix?: string;
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
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
      {STATS.map((s, i) => (
        <StatCell key={s.label} s={s} delay={i * 120} animate={visible} />
      ))}
    </div>
  );
}

function StatCell({ s, delay, animate }: { s: Stat; delay: number; animate: boolean }) {
  const v = useCountUp(s.end, animate, 1600 + delay);
  const display = v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  return (
    <div
      className="relative p-7 lg:p-9 overflow-hidden"
      style={{
        background: "#fff",
        border: "1px solid rgba(74,103,65,0.06)",
        borderRadius: 26,
        boxShadow: "0 1px 2px rgba(27,57,77,0.03), 0 12px 32px -20px rgba(74,103,65,0.18)",
        transition: `opacity 0.7s ${delay}ms, transform 0.7s ${delay}ms`,
        opacity: animate ? 1 : 0,
        transform: animate ? "translateY(0)" : "translateY(20px)",
      }}
    >
      {/* Blob decorativo no canto */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: -30,
          top: -30,
          width: 120,
          height: 120,
          background: "radial-gradient(circle, rgba(143,166,136,0.18), transparent 70%)",
          borderRadius: 999,
          filter: "blur(28px)",
          pointerEvents: "none",
        }}
      />
      <div className="aurora-cap mb-3 relative" style={{ color: "var(--sage)" }}>
        {s.label}
      </div>
      <div
        className="aurora-serif relative"
        style={{
          fontSize: "clamp(40px, 5.5vw, 64px)",
          color: "var(--green)",
          lineHeight: 1,
          letterSpacing: "-1.8px",
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
