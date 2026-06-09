// Aurora — Features sucintas, visuais. Bento grid 2x2 com ícones grandes,
// título curto, 1 linha de descrição. Sem mockups pesados.
const INK = "#1C2D45";
const STEEL = "#6D92A6";
const SAGE = "#99A989";
const FOREST = "#284C2B";

const FEATURES = [
  {
    cap: "01",
    title: "Importação inteligente",
    line: "Extratos de qualquer banco, em qualquer formato.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
        <rect x="14" y="8" width="36" height="44" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M22 18h20M22 26h20M22 34h20M22 42h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="46" cy="52" r="10" fill="#fff" stroke="currentColor" strokeWidth="1.6" />
        <path d="M42 52h8M46 48v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    accent: FOREST,
  },
  {
    cap: "02",
    title: "DFC em 5 dias úteis",
    line: "Fechamento mensal pronto antes do quinto dia.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
        <path d="M8 50h48M8 50V18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="14" y="34" width="6" height="16" fill="currentColor" opacity="0.3" />
        <rect x="24" y="26" width="6" height="24" fill="currentColor" opacity="0.5" />
        <rect x="34" y="20" width="6" height="30" fill="currentColor" opacity="0.7" />
        <rect x="44" y="12" width="6" height="38" fill="currentColor" />
      </svg>
    ),
    accent: STEEL,
  },
  {
    cap: "03",
    title: "Projeção 30/60/90",
    line: "Veja o caixa três meses à frente.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
        <path d="M8 48 C 18 36, 28 32, 40 22 L 56 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M8 48 C 18 36, 28 32, 40 22 L 56 12 L 56 56 L 8 56 Z" fill="currentColor" opacity="0.12" />
        <circle cx="20" cy="38" r="3" fill="#fff" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="36" cy="26" r="3" fill="#fff" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="52" cy="14" r="3" fill="#fff" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
    accent: SAGE,
  },
  {
    cap: "04",
    title: "Portal do cliente",
    line: "Seu sócio também olha o caixa.",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
        <rect x="20" y="6" width="24" height="52" rx="4" stroke="currentColor" strokeWidth="1.6" />
        <rect x="24" y="14" width="16" height="32" rx="2" fill="currentColor" opacity="0.08" />
        <circle cx="32" cy="52" r="2" fill="currentColor" />
        <path d="M28 22h8M28 28h8M28 34h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    accent: "#B8956A",
  },
];

export function Features() {
  return (
    <section
      id="metodo"
      className="px-6 lg:px-14 py-20 lg:py-28"
      style={{ background: "transparent" }}
    >
      <div className="max-w-[1280px] mx-auto">
        <div className="reveal mb-14 max-w-2xl">
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.5px",
              color: SAGE,
              marginBottom: 14,
            }}
          >
            COMO FUNCIONA
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(40px, 5vw, 64px)",
              fontWeight: 300,
              lineHeight: 1.0,
              letterSpacing: "-2px",
              color: INK,
            }}
          >
            Quatro entregas. Uma{" "}
            <em className="italic" style={{ color: FOREST }}>
              clareza
            </em>{" "}
            só.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
          {FEATURES.map((f, idx) => (
            <article
              key={f.cap}
              className="reveal feature-card relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.85) 0%, rgba(250,250,248,0.85) 100%)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(28,45,69,0.06)",
                borderRadius: 24,
                padding: "36px 32px",
                transitionDelay: `${idx * 70}ms`,
                cursor: "pointer",
              }}
            >
              {/* Glow do hover */}
              <div
                aria-hidden
                className="feature-glow"
                style={{
                  position: "absolute",
                  right: -80,
                  top: -80,
                  width: 240,
                  height: 240,
                  background: `radial-gradient(circle, ${f.accent}26 0%, transparent 70%)`,
                  filter: "blur(40px)",
                  borderRadius: "50%",
                  opacity: 0,
                  transition: "opacity 0.4s",
                  pointerEvents: "none",
                }}
              />

              <div className="relative flex items-start justify-between gap-4 mb-7">
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    fontSize: 24,
                    color: f.accent,
                    fontWeight: 300,
                    lineHeight: 1,
                  }}
                >
                  {f.cap}
                </span>
                <div style={{ color: f.accent }}>{f.icon}</div>
              </div>

              <h3
                className="relative"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 28,
                  fontWeight: 300,
                  letterSpacing: "-0.8px",
                  lineHeight: 1.15,
                  color: INK,
                }}
              >
                {f.title}
              </h3>
              <p
                className="relative mt-3"
                style={{
                  fontSize: 15,
                  color: "rgba(28,45,69,0.6)",
                  lineHeight: 1.5,
                }}
              >
                {f.line}
              </p>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .feature-card {
          transition: transform 0.45s cubic-bezier(.22,.61,.36,1), border-color 0.3s, box-shadow 0.3s;
        }
        .feature-card:hover {
          transform: translateY(-6px);
          border-color: rgba(28,45,69,0.16);
          box-shadow: 0 28px 56px -28px rgba(28,45,69,0.22);
        }
        .feature-card:hover .feature-glow {
          opacity: 1;
        }
        @media (prefers-reduced-motion: reduce) {
          .feature-card:hover { transform: none; }
        }
      `}</style>
    </section>
  );
}
