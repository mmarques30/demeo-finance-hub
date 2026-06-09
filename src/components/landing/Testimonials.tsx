import { useState } from "react";

type Item = { author: string; role: string; quote: string };

const ITEMS: Item[] = [
  {
    author: "Marcos Pereira",
    role: "Padaria São Jorge · São Paulo",
    quote: "Pela primeira vez eu olho pro caixa sem medo. A Claudia me devolveu o controle do meu próprio negócio.",
  },
  {
    author: "Helena Souza",
    role: "Restaurante Pernambuco",
    quote: "Era planilha que ninguém entendia. Hoje abro o portal e em 30 segundos sei se vou ter dinheiro pra folha.",
  },
  {
    author: "Dra. Ana Ribeiro",
    role: "Consultório Dra. Ana",
    quote: "A clareza que ela traz é envolvente. Eu confio na leitura e tomo decisão na mesma semana.",
  },
];

export function Testimonials() {
  const [i, setI] = useState(0);
  const cur = ITEMS[i];
  return (
    <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-end">
      <div>
        <span
          className="aurora-serif italic block"
          style={{ fontSize: 80, color: "var(--sage)", lineHeight: 0.6, marginBottom: 16 }}
        >
          "
        </span>
        <blockquote
          key={cur.quote}
          className="aurora-serif italic aurora-reveal-fade"
          style={{
            fontSize: "clamp(26px, 3.4vw, 42px)",
            lineHeight: 1.4,
            letterSpacing: "-0.5px",
            color: "var(--foreground)",
            maxWidth: 720,
          }}
        >
          {cur.quote}
        </blockquote>
        <div className="mt-7 flex items-center gap-3">
          <span
            className="rounded-full inline-flex items-center justify-center aurora-serif"
            style={{
              width: 44,
              height: 44,
              background: "var(--linen)",
              border: "1px solid var(--line)",
              color: "var(--green)",
              fontSize: 18,
              fontStyle: "italic",
            }}
          >
            {cur.author.charAt(0)}
          </span>
          <div>
            <div className="text-[13px]" style={{ fontWeight: 500 }}>
              {cur.author}
            </div>
            <div className="aurora-cap">{cur.role}</div>
          </div>
        </div>
      </div>

      {/* Pager */}
      <div className="flex lg:flex-col items-center gap-3">
        {ITEMS.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Depoimento ${idx + 1}`}
            onClick={() => setI(idx)}
            className="transition-all"
            style={{
              width: idx === i ? 36 : 20,
              height: 2,
              background: idx === i ? "var(--green)" : "var(--line)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
