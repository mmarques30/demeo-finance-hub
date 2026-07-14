// Aurora — Testimonials limpos com avatar quadrado, nome, empresa, cidade.
import { useState } from "react";

const INK = "#1C2D45";
const STEEL = "#6D92A6";
const SAGE = "#99A989";
const FOREST = "#284C2B";

const ITEMS = [
  {
    quote:
      "Em três meses, ela me mostrou que eu vendia bem mas perdia dinheiro no caminho. Hoje eu sei exatamente onde corrigir antes de o mês fechar.",
    name: "Marcos Pereira",
    company: "Padaria São Jorge",
    city: "São Paulo · SP",
    initial: "M",
  },
  {
    quote:
      "Era planilha que ninguém entendia. Hoje eu abro o portal de manhã e em 30 segundos sei se vou ter dinheiro pra folha.",
    name: "Helena Souza",
    company: "Restaurante Pernambuco",
    city: "Belo Horizonte · MG",
    initial: "H",
  },
  {
    quote:
      "A Claudia me devolveu a paz de saber. Saber quanto sobra, quanto eu posso reinvestir, quando vou apertar. É isso.",
    name: "Ana Ribeiro",
    company: "Consultório Dra. Ana",
    city: "Porto Alegre · RS",
    initial: "A",
  },
];

export function Testimonials() {
  const [i, setI] = useState(0);
  const cur = ITEMS[i];

  return (
    <section
      id="resultados"
      className="px-6 lg:px-14 py-20 lg:py-28"
      style={{ background: "#FFFFFF" }}
    >
      <div className="max-w-[1100px] mx-auto">
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
            EM NOME DELES
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(36px, 4.4vw, 56px)",
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: "-1.5px",
              color: INK,
            }}
          >
            O que dizem nossos{" "}
            <em className="italic" style={{ color: FOREST }}>
              clientes
            </em>
            .
          </h2>
        </div>

        <article
          className="reveal grid lg:grid-cols-[1fr_auto] gap-12 items-end"
          style={{
            background: "#FAFBFA",
            border: "1px solid rgba(28,45,69,0.08)",
            borderRadius: 4,
            padding: "40px 36px",
          }}
        >
          <div>
            <span
              aria-hidden
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 80,
                fontWeight: 300,
                color: FOREST,
                opacity: 0.18,
                lineHeight: 0.5,
                display: "block",
                marginBottom: 8,
              }}
            >
              "
            </span>
            <blockquote
              key={cur.quote}
              className="aurora-reveal-fade"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(22px, 2.4vw, 30px)",
                fontWeight: 300,
                lineHeight: 1.4,
                letterSpacing: "-0.3px",
                color: INK,
                maxWidth: 720,
              }}
            >
              {cur.quote}
            </blockquote>
            <footer
              className="mt-7 flex items-center gap-4"
              style={{ borderTop: "1px solid rgba(28,45,69,0.08)", paddingTop: 16 }}
            >
              <span
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  background: STEEL,
                  color: "#fff",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 22,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 4,
                }}
              >
                {cur.initial}
              </span>
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 600, color: INK }}>{cur.name}</div>
                <div style={{ color: "rgba(28,45,69,0.55)" }}>
                  {cur.company} · {cur.city}
                </div>
              </div>
            </footer>
          </div>

          <nav aria-label="Navegar depoimentos" className="flex items-center gap-2">
            <button
              onClick={() => setI((p) => (p - 1 + ITEMS.length) % ITEMS.length)}
              className="focus-ring"
              aria-label="Anterior"
              style={{
                width: 38,
                height: 38,
                border: "1px solid rgba(28,45,69,0.2)",
                background: "transparent",
                color: INK,
                fontSize: 14,
                borderRadius: 4,
              }}
            >
              ←
            </button>
            <button
              onClick={() => setI((p) => (p + 1) % ITEMS.length)}
              className="focus-ring"
              aria-label="Próximo"
              style={{
                width: 38,
                height: 38,
                background: FOREST,
                color: "#fff",
                fontSize: 14,
                border: "none",
                borderRadius: 4,
              }}
            >
              →
            </button>
          </nav>
        </article>

        <div className="mt-5 flex gap-2 justify-center">
          {ITEMS.map((_, idx) => (
            <span
              key={idx}
              aria-hidden
              style={{
                width: idx === i ? 28 : 14,
                height: 2,
                background: idx === i ? FOREST : "rgba(28,45,69,0.18)",
                transition: "width 0.25s",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
