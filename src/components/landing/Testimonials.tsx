import { useState } from "react";

// {{DEPOIMENTOS}} — placeholders editáveis. Quando real, substituir o array.
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
      "Era planilha e improviso. Agora eu abro o portal de manhã, leio meus números e decido a semana. Mudou minha relação com o caixa.",
    name: "Helena Souza",
    company: "Restaurante Pernambuco",
    city: "Belo Horizonte · MG",
    initial: "H",
  },
  {
    quote:
      "A Claudia me devolveu a paz de saber. Saber quanto sobra, quanto eu posso reinvestir, quando vou apertar. É isso que ela entrega.",
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
      className="px-6 lg:px-14 py-24 lg:py-32"
      style={{ background: "var(--linen2)" }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="reveal mb-12">
          <div
            className="text-[10px] uppercase mb-3"
            style={{ letterSpacing: "3px", color: "var(--sage)", fontWeight: 500 }}
          >
            Quem já está com a Aurora
          </div>
          <h2
            className="aurora-serif"
            style={{ fontSize: "clamp(40px, 5.5vw, 64px)", fontWeight: 300, lineHeight: 1, letterSpacing: "-2px" }}
          >
            Em <em className="italic" style={{ color: "var(--green)" }}>nome</em> deles.
          </h2>
        </div>

        <article
          key={cur.name}
          className="relative p-10 lg:p-14"
          style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}
        >
          {/* Aspa gigante */}
          <span
            aria-hidden
            className="aurora-serif"
            style={{
              position: "absolute",
              top: 8,
              left: 24,
              fontSize: 120,
              fontWeight: 300,
              color: "var(--green)",
              opacity: 0.18,
              lineHeight: 0.7,
              pointerEvents: "none",
            }}
          >
            "
          </span>

          <blockquote className="relative">
            <p
              className="aurora-serif italic"
              style={{
                fontSize: "clamp(20px, 2vw, 24px)",
                fontWeight: 300,
                lineHeight: 1.5,
                color: "var(--foreground)",
                letterSpacing: "-0.3px",
                maxWidth: 760,
              }}
            >
              {cur.quote}
            </p>

            <footer className="mt-8 flex items-center gap-4">
              <span
                className="rounded-full inline-flex items-center justify-center aurora-serif italic"
                style={{
                  width: 48,
                  height: 48,
                  background: "var(--linen)",
                  border: "1px solid var(--line)",
                  color: "var(--green)",
                  fontSize: 22,
                  flexShrink: 0,
                }}
                aria-hidden
              >
                {cur.initial}
              </span>
              <div className="text-[13px]" style={{ lineHeight: 1.5 }}>
                <div style={{ fontWeight: 500 }}>{cur.name}</div>
                <div style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
                  {cur.company} · {cur.city}
                </div>
              </div>
            </footer>
          </blockquote>

          {/* Controles */}
          <nav
            className="absolute right-6 bottom-6 lg:right-10 lg:bottom-10 flex items-center gap-2"
            aria-label="Navegar depoimentos"
          >
            <button
              onClick={() => setI((p) => (p - 1 + ITEMS.length) % ITEMS.length)}
              className="focus-ring"
              aria-label="Depoimento anterior"
              style={{
                width: 36,
                height: 36,
                border: "1px solid var(--line)",
                background: "transparent",
                color: "var(--green)",
                fontSize: 14,
              }}
            >
              ←
            </button>
            <button
              onClick={() => setI((p) => (p + 1) % ITEMS.length)}
              className="focus-ring"
              aria-label="Próximo depoimento"
              style={{
                width: 36,
                height: 36,
                background: "var(--green)",
                color: "#fff",
                fontSize: 14,
              }}
            >
              →
            </button>
          </nav>

          {/* Indicador */}
          <div className="absolute left-10 bottom-8 flex gap-2" aria-hidden>
            {ITEMS.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: idx === i ? 28 : 14,
                  height: 2,
                  background: idx === i ? "var(--green)" : "var(--line)",
                  transition: "width 0.2s",
                }}
              />
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
