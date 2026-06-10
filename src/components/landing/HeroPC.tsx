// Hero — foco em agendar diagnóstico (form no lado direito).
// CTA secundária outline. SEM WhatsApp aqui (só a partir da 3ª dobra).
import { HeroLeadForm } from "./HeroLeadForm";
import { MagneticButton } from "./motion/MagneticButton";
import { RevealText } from "./motion/RevealText";
import { Counter } from "./motion/Counter";

const INK = "#1C2D45";
const STEEL = "#6D92A6";
const SAGE = "#99A989";
const FOREST = "#284C2B";

export function HeroPC() {
  return (
    <section
      id="hero"
      className="relative"
      style={{ minHeight: "100vh", paddingTop: 96 }}
    >
      {/* Dobra de transição abaixo do nav flutuante */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: 88,
          left: 0,
          right: 0,
          height: 64,
          zIndex: 1,
        }}
      >
        <svg
          viewBox="0 0 1440 64"
          preserveAspectRatio="none"
          width="100%"
          height="64"
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient id="hero-fold-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(40,76,43,0.06)" />
              <stop offset="100%" stopColor="rgba(40,76,43,0)" />
            </linearGradient>
            <linearGradient id="hero-fold-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(40,76,43,0)" />
              <stop offset="35%" stopColor="rgba(40,76,43,0.22)" />
              <stop offset="65%" stopColor="rgba(109,146,166,0.22)" />
              <stop offset="100%" stopColor="rgba(40,76,43,0)" />
            </linearGradient>
          </defs>
          <path
            d="M0,32 C360,0 720,56 1080,18 C1260,0 1380,12 1440,28 L1440,64 L0,64 Z"
            fill="url(#hero-fold-fill)"
          />
          <path
            d="M0,32 C360,0 720,56 1080,18 C1260,0 1380,12 1440,28"
            fill="none"
            stroke="url(#hero-fold-stroke)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="max-w-[1320px] mx-auto px-6 lg:px-14 pt-16 pb-24 lg:pt-20 lg:pb-32 relative z-10">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Coluna copy */}
          <div>
            <RevealText
              as="h1"
              text="Cada real da sua empresa, visível."
              highlight={{ word: "visível", color: FOREST }}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(52px, 7vw, 102px)",
                fontWeight: 300,
                lineHeight: 1.0,
                letterSpacing: "-3px",
                color: INK,
              }}
            />

            <p
              className="mt-7 max-w-[520px] reveal-sub"
              style={{
                fontSize: 18,
                fontWeight: 400,
                lineHeight: 1.6,
                color: "rgba(28,45,69,0.78)",
              }}
            >
              A Aurora cuida do financeiro da sua empresa de ponta a ponta —
              importa extratos, fecha o DFC, projeta o caixa e te entrega leitura
              clara para a próxima decisão.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4 reveal-ctas">
              <MagneticButton href="#metodo" variant="outline">
                Ver como funciona
              </MagneticButton>
            </div>

            <div
              className="mt-12 flex items-center gap-3 reveal-trust"
              style={{ fontSize: 14, color: "rgba(28,45,69,0.7)" }}
            >
              <div className="flex -space-x-2">
                {[FOREST, STEEL, SAGE, "#B8956A"].map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      background: c,
                      border: "3px solid #FFF",
                      boxShadow: "0 3px 8px rgba(28,45,69,0.18)",
                    }}
                    aria-hidden
                  />
                ))}
              </div>
              <span>
                <strong style={{ color: INK, fontWeight: 700 }}>
                  <Counter value={120} suffix="+" /> empresários
                </strong>{" "}
                já decidem com Aurora
              </span>
            </div>
          </div>

          {/* Form — id #diagnostico para CTA "Agendar diagnóstico" do hero */}
          <div className="reveal-form" id="diagnostico">
            <HeroLeadForm />
          </div>
        </div>
      </div>

      <style>{`
        .reveal-sub    { animation: hero-fade-up 0.8s 0.5s cubic-bezier(.22,.61,.36,1) both; }
        .reveal-ctas   { animation: hero-fade-up 0.8s 0.65s cubic-bezier(.22,.61,.36,1) both; }
        .reveal-trust  { animation: hero-fade-up 0.8s 0.8s cubic-bezier(.22,.61,.36,1) both; }
        .reveal-form   { animation: hero-fade-up 0.9s 0.3s cubic-bezier(.22,.61,.36,1) both; }
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal-sub, .reveal-ctas, .reveal-trust, .reveal-form {
            animation: none; opacity: 1; transform: none;
          }
        }
      `}</style>
    </section>
  );
}
