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
    <div
      className="relative p-10 lg:p-16 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, var(--linen2) 100%)",
        border: "1px solid rgba(74,103,65,0.06)",
        borderRadius: 32,
        boxShadow: "0 1px 2px rgba(27,57,77,0.04), 0 24px 64px -32px rgba(74,103,65,0.22)",
      }}
    >
      <div
        aria-hidden
        className="aurora-blob aurora-blob--tan"
        style={{ width: 360, height: 360, right: -120, top: -120 }}
      />
      <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-12 items-end">
        <div>
          <span
            className="aurora-serif italic block"
            style={{ fontSize: 96, color: "var(--sage)", lineHeight: 0.6, marginBottom: 20 }}
          >
            "
          </span>
          <blockquote
            key={cur.quote}
            className="aurora-serif italic aurora-reveal-fade"
            style={{
              fontSize: "clamp(26px, 3.6vw, 44px)",
              lineHeight: 1.4,
              letterSpacing: "-0.5px",
              color: "var(--foreground)",
              maxWidth: 760,
            }}
          >
            {cur.quote}
          </blockquote>
          <div className="mt-9 flex items-center gap-4">
            <span
              className="rounded-full inline-flex items-center justify-center aurora-serif relative"
              style={{
                width: 52,
                height: 52,
                background: "linear-gradient(135deg, var(--linen) 0%, #fff 100%)",
                border: "1px solid rgba(74,103,65,0.12)",
                color: "var(--green)",
                fontSize: 22,
                fontStyle: "italic",
                boxShadow: "0 6px 16px -8px rgba(74,103,65,0.25)",
              }}
            >
              {cur.author.charAt(0)}
            </span>
            <div>
              <div className="text-[13px]" style={{ fontWeight: 500 }}>
                {cur.author}
              </div>
              <div className="aurora-cap mt-0.5">{cur.role}</div>
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
                width: idx === i ? 44 : 24,
                height: 3,
                background:
                  idx === i
                    ? "linear-gradient(90deg, var(--green), var(--green2))"
                    : "rgba(74,103,65,0.15)",
                borderRadius: 999,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
