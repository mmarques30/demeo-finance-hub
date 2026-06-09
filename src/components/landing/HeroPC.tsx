// Aurora — Hero moderno com text reveal, magnetic CTAs, product preview com tilt 3D,
// background ambient e curva fluida pra próxima seção.
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { MagneticButton } from "./motion/MagneticButton";
import { TiltCard } from "./motion/TiltCard";
import { RevealText } from "./motion/RevealText";
import { Counter } from "./motion/Counter";

const INK = "#1C2D45";
const STEEL = "#6D92A6";
const SAGE = "#99A989";
const FOREST = "#284C2B";

export function HeroPC() {
  // Parallax leve no produto
  const productRef = useRef<HTMLDivElement>(null);
  const [py, setPy] = useState(0);
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      setPy(Math.min(y * 0.08, 30));
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <section
      id="hero"
      className="relative"
      style={{
        minHeight: "100vh",
        paddingTop: 96,
        paddingBottom: 0,
      }}
    >
      <div className="max-w-[1320px] mx-auto px-6 lg:px-14 pt-16 pb-24 lg:pt-20 lg:pb-32 relative z-10">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center">
          {/* Coluna copy */}
          <div>
            {/* Pill animada */}
            <div
              className="inline-flex items-center gap-2 mb-8 reveal-pill"
              style={{
                background:
                  "linear-gradient(135deg, rgba(40,76,43,0.08) 0%, rgba(153,169,137,0.16) 100%)",
                color: FOREST,
                padding: "8px 18px",
                borderRadius: 999,
                border: "1px solid rgba(40,76,43,0.15)",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: FOREST,
                  animation: "pulse-dot 2s ease-in-out infinite",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.3px" }}>
                Atendendo PMEs desde 2018
              </span>
            </div>

            {/* H1 com reveal palavra por palavra */}
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
                color: "rgba(28,45,69,0.7)",
              }}
            >
              A Aurora cuida do financeiro da sua empresa de ponta a ponta —
              importa extratos, fecha o DFC, projeta o caixa e te entrega leitura
              clara para a próxima decisão.
            </p>

            {/* CTAs magnéticos */}
            <div className="mt-10 flex flex-wrap items-center gap-4 reveal-ctas">
              <MagneticButton href="#contato" variant="solid">
                Agendar conversa
                <ArrowAnimated />
              </MagneticButton>
              <MagneticButton href="#metodo" variant="outline">
                Ver como funciona
              </MagneticButton>
            </div>

            {/* Trust row */}
            <div
              className="mt-12 flex items-center gap-3 reveal-trust"
              style={{ fontSize: 13, color: "rgba(28,45,69,0.55)" }}
            >
              <div className="flex -space-x-2">
                {[FOREST, STEEL, SAGE, "#B8956A"].map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: c,
                      border: "2.5px solid #FFF",
                      boxShadow: "0 2px 6px rgba(28,45,69,0.12)",
                    }}
                    aria-hidden
                  />
                ))}
              </div>
              <span>
                <strong style={{ color: INK, fontWeight: 600 }}>
                  <Counter value={120} suffix="+" /> empresários
                </strong>{" "}
                já decidem com Aurora
              </span>
            </div>
          </div>

          {/* Coluna produto com tilt + parallax */}
          <div
            ref={productRef}
            style={{
              transform: `translateY(${-py}px)`,
              transition: "transform 0.2s linear",
            }}
          >
            <TiltCard intensity={6}>
              <ProductPreview />
            </TiltCard>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.3); opacity: 0.5; }
        }
        .reveal-pill   { animation: hero-fade-up 0.7s cubic-bezier(.22,.61,.36,1) both; }
        .reveal-sub    { animation: hero-fade-up 0.8s 0.5s cubic-bezier(.22,.61,.36,1) both; }
        .reveal-ctas   { animation: hero-fade-up 0.8s 0.65s cubic-bezier(.22,.61,.36,1) both; }
        .reveal-trust  { animation: hero-fade-up 0.8s 0.8s cubic-bezier(.22,.61,.36,1) both; }
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal-pill, .reveal-sub, .reveal-ctas, .reveal-trust {
            animation: none; opacity: 1; transform: none;
          }
        }
      `}</style>
    </section>
  );
}

function ArrowAnimated() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: "transform 0.3s cubic-bezier(.22,.61,.36,1)",
      }}
      className="arrow-animated"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ProductPreview() {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(28,45,69,0.08)",
        borderRadius: 16,
        boxShadow:
          "0 40px 80px -30px rgba(28,45,69,0.35), 0 24px 40px -20px rgba(40,76,43,0.18), inset 0 1px 0 rgba(255,255,255,0.6)",
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{
          background: `linear-gradient(135deg, ${INK} 0%, #16263b 100%)`,
          color: "#fff",
        }}
      >
        <div className="flex items-center gap-2.5" style={{ color: SAGE }}>
          <LogoMark size={14} />
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 16,
              color: "#fff",
              fontWeight: 400,
            }}
          >
            Aurora
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          <span>Abril · 2026</span>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              background: `linear-gradient(135deg, ${FOREST}, #1f3a22)`,
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            CD
          </span>
        </div>
      </div>

      <div
        className="px-5 py-3"
        style={{
          background: "#FAFAF8",
          borderBottom: "1px solid rgba(28,45,69,0.06)",
          fontSize: 11,
          fontWeight: 500,
          color: "rgba(28,45,69,0.55)",
          letterSpacing: "1px",
        }}
      >
        FECHAMENTOS · ABRIL 2026
      </div>

      <div className="px-5 py-4 grid grid-cols-3 gap-3">
        {[
          { label: "Clientes", val: 12, color: FOREST },
          { label: "Pendentes", val: 4, color: "#B8956A" },
          { label: "Revisar", val: 23, color: STEEL },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(28,45,69,0.06)",
              borderLeft: `3px solid ${k.color}`,
              padding: "12px 14px",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(28,45,69,0.55)", marginBottom: 4, letterSpacing: "1px" }}>
              {k.label.toUpperCase()}
            </div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                fontWeight: 300,
                color: k.color,
                lineHeight: 1,
                letterSpacing: "-0.8px",
              }}
            >
              <Counter value={k.val} />
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(28,45,69,0.55)", letterSpacing: "1px" }}>
              RECEITA POR CLIENTE
            </div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
                color: INK,
                fontWeight: 400,
                marginTop: 4,
                letterSpacing: "-0.4px",
              }}
            >
              R$ 372.000
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#fff",
              background: `linear-gradient(135deg, ${FOREST}, #1f3a22)`,
              padding: "5px 10px",
              borderRadius: 999,
              letterSpacing: "0.3px",
            }}
          >
            ↑ 12% vs mar
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 items-end" style={{ height: 90 }}>
          {[
            { h: 60, l: "Padaria" },
            { h: 100, l: "Restaurante" },
            { h: 46, l: "Consultório" },
            { h: 55, l: "Escritório" },
          ].map((b, i) => (
            <div key={i} className="flex flex-col gap-1.5 h-full items-stretch justify-end">
              <div
                style={{
                  height: `${b.h}%`,
                  background:
                    i === 1
                      ? `linear-gradient(180deg, ${FOREST} 0%, #1f3a22 100%)`
                      : SAGE,
                  opacity: i === 1 ? 1 : 0.55,
                  borderRadius: "4px 4px 0 0",
                  animation: `bar-rise 0.9s ${i * 0.1 + 0.4}s cubic-bezier(.22,.61,.36,1) both`,
                  transformOrigin: "bottom",
                }}
                aria-hidden
              />
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(28,45,69,0.55)",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                {b.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bar-rise {
          from { transform: scaleY(0); opacity: 0; }
          to   { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
