// Numbers — seção dark com 4 counters animados.
import { Counter } from "./motion/Counter";

const INK = "#1C2D45";
const SAGE = "#99A989";
const STEEL = "#6D92A6";

export function Numbers() {
  return (
    <section
      className="px-6 lg:px-14 py-24 lg:py-32 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${INK} 0%, #16263b 100%)`,
        color: "#fff",
      }}
    >
      {/* Glow decorativo */}
      <div
        aria-hidden
        className="absolute"
        style={{
          right: "-15%",
          top: "-20%",
          width: 600,
          height: 600,
          background: `radial-gradient(circle, rgba(109,146,166,0.25) 0%, transparent 60%)`,
          filter: "blur(80px)",
          borderRadius: "50%",
          animation: "ambient-drift-2 32s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute"
        style={{
          left: "-10%",
          bottom: "-25%",
          width: 700,
          height: 700,
          background: `radial-gradient(circle, rgba(40,76,43,0.3) 0%, transparent 60%)`,
          filter: "blur(80px)",
          borderRadius: "50%",
          animation: "ambient-drift-1 36s ease-in-out infinite reverse",
        }}
      />

      <div className="max-w-[1280px] mx-auto relative z-10">
        <div className="reveal max-w-2xl mb-16">
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.5px",
              color: STEEL,
              marginBottom: 16,
            }}
          >
            EVIDÊNCIA
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(40px, 5vw, 64px)",
              fontWeight: 300,
              lineHeight: 1.0,
              letterSpacing: "-2px",
              color: "#fff",
            }}
          >
            Números que falam pela{" "}
            <em className="italic" style={{ color: SAGE }}>
              gente
            </em>
            .
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
          {[
            { val: 5, suf: " dias", l: "Tempo médio para o primeiro DFC fechado" },
            { val: 94, suf: "%", l: "Dos clientes seguem com a Aurora ano após ano" },
            { val: 24, pre: "< ", suf: "h", l: "Tempo médio de resposta da Claudia" },
            { val: 0, l: "Contratos com fidelidade — relação por confiança" },
          ].map((n, i) => (
            <div
              key={n.l}
              className="reveal relative px-0 lg:px-6 py-6"
              style={{
                borderLeft:
                  i > 0
                    ? "1px solid rgba(255,255,255,0.1)"
                    : undefined,
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(56px, 6vw, 88px)",
                  fontWeight: 200,
                  letterSpacing: "-3px",
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                <Counter
                  value={n.val}
                  prefix={n.pre}
                  suffix={n.suf}
                />
              </div>
              <p
                className="mt-4"
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.6,
                  maxWidth: 220,
                }}
              >
                {n.l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
