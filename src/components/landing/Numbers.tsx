// Aurora — "A ciência por trás" estilo nextsense.
// 4 números específicos sobre fundo escuro ink, com pequeno contexto sob cada.
const INK = "#1C2D45";
const SAGE = "#99A989";
const STEEL = "#6D92A6";

const NUMS = [
  { v: "5 dias", l: "Tempo médio para o primeiro DFC fechado" },
  { v: "94%", l: "Dos clientes seguem com a Aurora ano após ano" },
  { v: "< 24h", l: "Tempo médio de resposta da Claudia" },
  { v: "0", l: "Contratos com fidelidade — relação por confiança" },
];

export function Numbers() {
  return (
    <section
      className="px-6 lg:px-14 py-20 lg:py-28"
      style={{ background: INK, color: "#fff" }}
    >
      <div className="max-w-[1280px] mx-auto">
        <div className="reveal max-w-2xl mb-14">
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.5px",
              color: STEEL,
              marginBottom: 14,
            }}
          >
            EVIDÊNCIA
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(36px, 4.4vw, 56px)",
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: "-1.5px",
              color: "#fff",
            }}
          >
            Números que falam pela{" "}
            <em className="italic" style={{ color: SAGE }}>
              gente
            </em>
            .
          </h2>
          <p
            className="mt-5 max-w-[480px]"
            style={{
              fontSize: 16,
              fontWeight: 400,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Não somos uma plataforma genérica. Cada número aqui vem da carteira atual da Aurora.
          </p>
        </div>

        <div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          {NUMS.map((n, i) => (
            <div
              key={n.l}
              className="reveal py-8 px-6"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                borderRight:
                  i < NUMS.length - 1 ? "1px solid rgba(255,255,255,0.1)" : undefined,
                transitionDelay: `${i * 70}ms`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(48px, 5vw, 72px)",
                  fontWeight: 300,
                  letterSpacing: "-2px",
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                {n.v}
              </div>
              <p
                className="mt-3"
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.5,
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
