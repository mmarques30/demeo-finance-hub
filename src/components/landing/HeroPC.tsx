// Hero comercial Aurora — inspirado em nextsense.io.
// Tagline punchy + sub + 2 CTAs à esquerda · Preview de produto (dashboard) à direita.
// Trust signal numérico embaixo. Branco predominante, forest #284C2B como acento de marca.
import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/Logo";
import { AURORA_WHATSAPP } from "@/lib/supabase";

const INK = "#1C2D45";
const STEEL = "#6D92A6";
const SAGE = "#99A989";
const FOREST = "#284C2B";

export function HeroPC() {
  return (
    <section
      id="hero"
      className="relative"
      style={{ background: "#FFFFFF", paddingTop: 80 }}
    >
      <div className="max-w-[1320px] mx-auto px-6 lg:px-14 pt-12 lg:pt-20 pb-16 lg:pb-24">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center">
          {/* Esquerda — copy */}
          <div className="reveal">
            <div
              className="inline-flex items-center gap-2 mb-7"
              style={{ background: "rgba(40,76,43,0.06)", color: FOREST, padding: "6px 14px", borderRadius: 999 }}
            >
              <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: FOREST }} />
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.3px" }}>
                Atendendo PMEs desde 2018
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(48px, 6.4vw, 92px)",
                fontWeight: 300,
                lineHeight: 1.02,
                letterSpacing: "-2.5px",
                color: INK,
              }}
            >
              Cada real da sua empresa,
              <br />
              <em className="italic" style={{ color: FOREST }}>
                visível
              </em>
              .
            </h1>

            <p
              className="mt-7 max-w-[520px]"
              style={{
                fontSize: 18,
                fontWeight: 400,
                lineHeight: 1.6,
                color: "rgba(28,45,69,0.7)",
              }}
            >
              A Aurora cuida do financeiro da sua empresa de ponta a ponta — importa
              extratos, fecha o DFC, projeta o caixa e te entrega leitura clara para a
              próxima decisão.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="#contato"
                className="focus-ring inline-flex items-center gap-2"
                style={{
                  background: FOREST,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "16px 26px",
                  borderRadius: 4,
                  transition: "background 0.2s",
                }}
              >
                Agendar conversa <span aria-hidden>→</span>
              </a>
              <a
                href="#metodo"
                className="focus-ring inline-flex items-center gap-2"
                style={{
                  background: "transparent",
                  color: INK,
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "16px 22px",
                  border: `1px solid rgba(28,45,69,0.2)`,
                  borderRadius: 4,
                }}
              >
                Ver como funciona
              </a>
            </div>

            {/* Trust micro-row */}
            <div
              className="mt-10 flex items-center gap-3 text-[13px]"
              style={{ color: "rgba(28,45,69,0.55)" }}
            >
              <div className="flex -space-x-2">
                {[FOREST, STEEL, SAGE, "#B8956A"].map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      background: c,
                      border: "2px solid #fff",
                    }}
                    aria-hidden
                  />
                ))}
              </div>
              <span>
                <strong style={{ color: INK, fontWeight: 600 }}>120+ empresários</strong>{" "}
                já decidem com Aurora
              </span>
            </div>
          </div>

          {/* Direita — preview de produto (dashboard mock) */}
          <div className="reveal" style={{ transitionDelay: "120ms" }}>
            <ProductPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="relative">
      {/* Card principal — dashboard mockup */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(28,45,69,0.1)",
          borderRadius: 8,
          boxShadow: "0 30px 60px -30px rgba(28,45,69,0.25), 0 18px 36px -18px rgba(28,45,69,0.1)",
          overflow: "hidden",
        }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ background: INK, color: "#fff" }}
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
          <div className="flex items-center gap-3 text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            <span>Abril · 2026</span>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                background: FOREST,
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

        {/* Section title */}
        <div
          className="px-5 py-3"
          style={{ background: "#FAFAF8", borderBottom: "1px solid rgba(28,45,69,0.08)" }}
        >
          <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(28,45,69,0.55)" }}>
            FECHAMENTOS · ABRIL 2026
          </div>
        </div>

        {/* KPI cards */}
        <div className="px-5 py-4 grid grid-cols-3 gap-3">
          {[
            { label: "Clientes", val: "12", color: FOREST },
            { label: "Pendentes", val: "4", color: "#B8956A" },
            { label: "Revisar", val: "23", color: STEEL },
          ].map((k) => (
            <div
              key={k.label}
              style={{
                border: "1px solid rgba(28,45,69,0.08)",
                borderLeft: `2px solid ${k.color}`,
                padding: "10px 12px",
                borderRadius: 3,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 500, color: "rgba(28,45,69,0.55)", marginBottom: 4 }}>
                {k.label}
              </div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 24,
                  fontWeight: 300,
                  color: k.color,
                  lineHeight: 1,
                }}
              >
                {k.val}
              </div>
            </div>
          ))}
        </div>

        {/* Mini chart */}
        <div className="px-5 pb-5">
          <div
            className="flex items-end justify-between mb-3"
            style={{ fontSize: 11 }}
          >
            <div>
              <div style={{ color: "rgba(28,45,69,0.55)", fontWeight: 500 }}>RECEITA POR CLIENTE</div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 16,
                  color: INK,
                  fontWeight: 400,
                  marginTop: 2,
                }}
              >
                R$ 372.000
              </div>
            </div>
            <span
              style={{
                fontSize: 10,
                color: FOREST,
                background: "rgba(40,76,43,0.08)",
                padding: "3px 8px",
                borderRadius: 2,
                fontWeight: 500,
              }}
            >
              ↑ 12% vs mar
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 items-end" style={{ height: 88 }}>
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
                    background: i === 1 ? FOREST : SAGE,
                    opacity: i === 1 ? 1 : 0.6,
                  }}
                  aria-hidden
                />
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(28,45,69,0.5)",
                    textAlign: "center",
                  }}
                >
                  {b.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div
        className="absolute hidden lg:flex items-center gap-2.5"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(28,45,69,0.1)",
          padding: "10px 16px",
          borderRadius: 6,
          boxShadow: "0 12px 24px -12px rgba(28,45,69,0.25)",
          bottom: -20,
          right: -18,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "rgba(40,76,43,0.1)",
            color: FOREST,
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✓
        </span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: INK }}>DFC fechado</div>
          <div style={{ fontSize: 10, color: "rgba(28,45,69,0.55)" }}>em 5 dias úteis</div>
        </div>
      </div>
    </div>
  );
}

// Compatibility: nav etc. usam essa export
export const _hero_brand = { INK, STEEL, SAGE, FOREST, AURORA_WHATSAPP, Link };
