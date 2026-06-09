// Aurora — FAQ semântico (details/summary) com paleta v3.
import { useState } from "react";

const INK = "#1C2D45";
const SAGE = "#99A989";
const FOREST = "#284C2B";

const ITEMS = [
  {
    q: "Em quanto tempo eu vejo o primeiro relatório?",
    a: "Em até 5 dias úteis. Recebemos seus extratos, organizamos, classificamos e entregamos o primeiro DFC fechado junto com uma reunião para você ler comigo.",
  },
  {
    q: "Preciso ter sistema de gestão pra contratar?",
    a: "Não. A Aurora começa do zero. Se você tem planilha, importamos. Se não tem nada, melhor — montamos do jeito certo desde o início.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Mensalidade fixa por boleto ou Pix, no plano que cabe na sua empresa. Sem fidelidade, sem letra miúda. Você ajusta o plano se a empresa crescer.",
  },
  {
    q: "Você atende empresas de qual porte?",
    a: "PMEs com faturamento mensal entre R$ 50 mil e R$ 1 milhão. Se você está fora dessa faixa, vamos conversar mesmo assim — pode fazer sentido.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. 30 dias de aviso prévio para a gente fechar o mês em curso. Sem multa, sem rancor. Aurora trabalha com confiança, não contrato amarrado.",
  },
  {
    q: "E se eu já tenho contador?",
    a: "Melhor ainda. Aurora é gestora financeira, não contabilidade fiscal. A gente conversa direto com seu contador e divide tarefas — cada uma cuidando do que sabe.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section
      id="faq"
      className="px-6 lg:px-14 py-20 lg:py-28"
      style={{ background: "#FAFAF8" }}
    >
      <div className="max-w-[920px] mx-auto">
        <div className="reveal mb-12 max-w-2xl">
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.5px",
              color: SAGE,
              marginBottom: 14,
            }}
          >
            DÚVIDAS COMUNS
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
            Antes da gente{" "}
            <em className="italic" style={{ color: FOREST }}>
              conversar
            </em>
            .
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
                  borderTop: idx === 0 ? "1px solid rgba(28,45,69,0.1)" : undefined,
                  borderBottom: "1px solid rgba(28,45,69,0.1)",
                }}
              >
                <summary
                  className="flex items-center justify-between gap-6 py-6 cursor-pointer focus-ring"
                  style={{ listStyle: "none" }}
                >
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "clamp(20px, 2.2vw, 26px)",
                      fontWeight: 300,
                      color: isOpen ? FOREST : INK,
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
                      color: FOREST,
                      fontSize: 16,
                      flexShrink: 0,
                      transition: "transform 0.2s",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                    }}
                  >
                    ⌄
                  </span>
                </summary>
                <p
                  className="pb-6 pr-12"
                  style={{
                    fontSize: 15,
                    fontWeight: 400,
                    color: "rgba(28,45,69,0.65)",
                    lineHeight: 1.7,
                    maxWidth: 760,
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
