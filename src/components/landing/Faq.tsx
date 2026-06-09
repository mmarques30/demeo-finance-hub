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
    <div className="max-w-[900px] mx-auto flex flex-col gap-3">
      {ITEMS.map((it, i) => {
        const isOpen = open === i;
        return (
          <div
            key={it.q}
            className="overflow-hidden transition-all"
            style={{
              background: isOpen
                ? "linear-gradient(135deg, #FFFFFF 0%, var(--linen2) 100%)"
                : "rgba(255,255,255,0.7)",
              backdropFilter: !isOpen ? "blur(8px)" : "none",
              border: `1px solid ${isOpen ? "rgba(74,103,65,0.18)" : "rgba(74,103,65,0.06)"}`,
              borderRadius: 22,
              boxShadow: isOpen
                ? "0 14px 40px -20px rgba(74,103,65,0.22), 0 4px 12px rgba(74,103,65,0.06)"
                : "0 1px 2px rgba(27,57,77,0.03), 0 6px 18px -12px rgba(74,103,65,0.08)",
            }}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-6 px-7 py-6 text-left transition-colors"
              aria-expanded={isOpen}
            >
              <span
                className="aurora-serif"
                style={{
                  fontSize: "clamp(20px, 2.4vw, 28px)",
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
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: isOpen
                    ? "linear-gradient(135deg, var(--green), var(--green2))"
                    : "rgba(74,103,65,0.06)",
                  color: isOpen ? "#fff" : "var(--green)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  transition: "transform 0.35s cubic-bezier(.22,.61,.36,1), background 0.3s",
                  transform: isOpen ? "rotate(45deg)" : "rotate(0)",
                  flexShrink: 0,
                  boxShadow: isOpen ? "0 6px 16px -6px rgba(74,103,65,0.4)" : "none",
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
                transition: "max-height 0.4s ease, opacity 0.3s ease",
              }}
            >
              <p
                className="px-7 pb-7 text-[14px]"
                style={{ color: "var(--muted-foreground)", lineHeight: 1.9, maxWidth: 720 }}
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
