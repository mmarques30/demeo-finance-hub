// Faixa verde com 4 stats grandes. Números editáveis comentados.
const STATS = [
  { n: "120+", l: "empresários acompanhados" }, // {{N1}}
  { n: "R$ 2,3 mi", l: "em fluxo organizado/mês" }, // {{N2}}
  { n: "94%", l: "ficam ano após ano" }, // {{N3}}
  { n: "5 dias", l: "para o primeiro DFC" }, // {{N4}}
];

export function StatsStrip() {
  return (
    <section
      className="px-6 lg:px-14 py-24 lg:py-28"
      style={{ background: "var(--green)" }}
      aria-label="Aurora em números"
    >
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 md:gap-y-0">
          {STATS.map((s, i) => (
            <div
              key={s.l}
              className="reveal text-center md:text-left px-2 md:px-6 relative"
              style={{
                color: "#fff",
                transitionDelay: `${i * 80}ms`,
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.18)" : undefined,
              }}
            >
              <div
                className="aurora-serif"
                style={{
                  fontSize: "clamp(56px, 6vw, 88px)",
                  fontWeight: 300,
                  lineHeight: 1,
                  letterSpacing: "-2px",
                }}
              >
                {s.n}
              </div>
              <div
                className="mt-3 text-[10px] uppercase"
                style={{
                  letterSpacing: "2.5px",
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.6,
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
