import { useState } from "react";

// {{FAQ_RESPOSTA_x}} placeholders editáveis nas respostas. Mantidas curtas (~3 linhas).
const ITEMS = [
  {
    q: "Em quanto tempo eu vejo o primeiro relatório?",
    a: "Em até 5 dias úteis. A gente recebe seus extratos, organiza, classifica e te entrega o primeiro DFC fechado — junto com uma reunião para você ler junto comigo.",
  },
  {
    q: "Preciso ter sistema de gestão pra contratar?",
    a: "Não. A Aurora começa do zero. Se você tem planilha, ótimo — a gente importa. Se não tem nada, melhor ainda — montamos do jeito certo desde o início.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Mensalidade fixa por boleto ou Pix, no plano que cabe na sua empresa. Sem fidelidade, sem letra miúda. Você ajusta o plano se a empresa crescer ou mudar.",
  },
  {
    q: "Você atende empresas de qual porte?",
    a: "PMEs com faturamento mensal entre R$ 50 mil e R$ 1 milhão. Se você está fora dessa faixa, vamos conversar mesmo assim — às vezes faz sentido começar antes.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. 30 dias de aviso prévio para a gente fechar tudo do mês em curso. Sem multa, sem rancor. A Aurora trabalha com confiança, não com contrato amarrado.",
  },
  {
    q: "E se eu já tenho contador?",
    a: "Melhor ainda. A Aurora é gestora financeira, não contabilidade fiscal. A gente conversa direto com seu contador e divide tarefas — cada uma cuidando do que sabe.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section
      id="faq"
      className="px-6 lg:px-14 py-24 lg:py-32"
      style={{ background: "var(--linen)" }}
    >
      <div className="max-w-[920px] mx-auto">
        <div className="reveal mb-12">
          <div
            className="text-[10px] uppercase mb-3"
            style={{ letterSpacing: "3px", color: "var(--sage)", fontWeight: 500 }}
          >
            [ Perguntas ]
          </div>
          <h2
            className="aurora-serif"
            style={{ fontSize: "clamp(40px, 5.5vw, 64px)", fontWeight: 300, lineHeight: 1, letterSpacing: "-2px" }}
          >
            Antes da gente <em className="italic" style={{ color: "var(--green)" }}>conversar</em>.
          </h2>
        </div>

        <div className="flex flex-col">
          {ITEMS.map((it, idx) => {
            const isOpen = open === idx;
            return (
              <details
                key={it.q}
                open={isOpen}
                onToggle={(e) => {
                  const t = e.currentTarget as HTMLDetailsElement;
                  if (t.open) setOpen(idx);
                  else if (open === idx) setOpen(null);
                }}
                style={{
                  borderTop: idx === 0 ? "1px solid var(--line)" : undefined,
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <summary
                  className="flex items-center justify-between gap-6 py-6 cursor-pointer focus-ring list-none"
                  style={{
                    listStyle: "none",
                  }}
                >
                  <span
                    className="aurora-serif"
                    style={{
                      fontSize: "clamp(18px, 2vw, 24px)",
                      fontWeight: 300,
                      color: isOpen ? "var(--green)" : "var(--foreground)",
                      lineHeight: 1.3,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {it.q}
                  </span>
                  <span
                    aria-hidden
                    style={{
                      width: 28,
                      height: 28,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--green)",
                      fontSize: 16,
                      flexShrink: 0,
                      transition: "transform 0.25s",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                    }}
                  >
                    ⌄
                  </span>
                </summary>
                <p
                  className="pb-7"
                  style={{
                    fontSize: 14,
                    color: "var(--muted-foreground)",
                    lineHeight: 1.8,
                    maxWidth: 720,
                  }}
                >
                  {it.a}
                </p>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
