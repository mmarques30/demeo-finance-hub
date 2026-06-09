import { useState } from "react";

const ITEMS = [
  {
    q: "Em quanto tempo a Aurora começa a entregar valor?",
    a: "Na primeira semana já organizamos seu extrato e devolvemos uma leitura do mês. Em até 30 dias você tem o primeiro fechamento mensal completo com DFC e projeção.",
  },
  {
    q: "Vocês substituem o contador?",
    a: "Não. A Aurora cuida da gestão financeira — fluxo de caixa, projeção, decisão. O contador continua cuidando da parte fiscal. A gente conversa com ele diretamente.",
  },
  {
    q: "Como funciona o portal do cliente?",
    a: "Cada empresa acessa um painel próprio com saldo consolidado, evolução, despesas por categoria e contas previstas. Atualizado pela equipe Aurora em tempo real.",
  },
  {
    q: "Posso começar com 1 conta bancária só?",
    a: "Sim. A maioria dos clientes começa com 1 ou 2 contas e a gente vai expandindo conforme você sente segurança no processo.",
  },
  {
    q: "Vocês trabalham com qual porte de empresa?",
    a: "Pequenas e médias empresas com faturamento mensal entre R$ 50 mil e R$ 1 milhão. Se você está abaixo, vamos conversar mesmo assim — pode fazer sentido.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="max-w-[860px] mx-auto flex flex-col">
      {ITEMS.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q} style={{ borderTop: i === 0 ? "1px solid var(--line)" : undefined, borderBottom: "1px solid var(--line)" }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-6 py-6 text-left transition-colors"
              aria-expanded={isOpen}
            >
              <span
                className="aurora-serif"
                style={{
                  fontSize: "clamp(20px, 2.4vw, 26px)",
                  color: isOpen ? "var(--green)" : "var(--foreground)",
                  letterSpacing: "-0.5px",
                  lineHeight: 1.25,
                }}
              >
                {it.q}
              </span>
              <span
                aria-hidden
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: isOpen ? "var(--green)" : "transparent",
                  color: isOpen ? "#fff" : "var(--muted-foreground)",
                  border: `1px solid ${isOpen ? "var(--green)" : "var(--line)"}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  transition: "transform 0.2s",
                  transform: isOpen ? "rotate(45deg)" : "rotate(0)",
                  flexShrink: 0,
                }}
              >
                +
              </span>
            </button>
            <div
              style={{
                maxHeight: isOpen ? 400 : 0,
                opacity: isOpen ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.35s ease, opacity 0.25s ease",
              }}
            >
              <p
                className="pb-7 text-[14px]"
                style={{ color: "var(--muted-foreground)", lineHeight: 1.85, maxWidth: 700 }}
              >
                {it.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
