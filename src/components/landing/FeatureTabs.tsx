import { useState } from "react";

type Feature = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
};

const FEATURES: Feature[] = [
  {
    id: "import",
    title: "Importação inteligente",
    description:
      "PDF do banco, CSV, imagem do extrato. A Aurora lê, identifica e classifica cada lançamento — você só revisa.",
    bullets: [
      "Itaú, Santander, Bradesco, BB, Inter, Nubank",
      "OCR para extratos em imagem",
      "Regras recorrentes aprendidas com 1 clique",
    ],
  },
  {
    id: "dfc",
    title: "DFC mensal & semanal",
    description:
      "Demonstrativo de fluxo de caixa pronto para a reunião do mês. Você abre, vê e entende — sem precisar montar planilha.",
    bullets: [
      "Comparativo automático mês vs mês",
      "Quebra por categoria, fornecedor e centro de custo",
      "Exportação em PDF Aurora ou Excel",
    ],
  },
  {
    id: "projecao",
    title: "Projeção de 90 dias",
    description:
      "Receitas e despesas recorrentes projetadas para os próximos 3 meses. Decida antes do mês começar.",
    bullets: [
      "Aprende com seu histórico real",
      "Alerta de risco de caixa em vermelho",
      "Cenários otimista, base e pessimista",
    ],
  },
  {
    id: "portal",
    title: "Portal do cliente",
    description:
      "Cada empresário acessa o próprio painel. Saldo, despesas, contas previstas — em tempo real, sem pedir planilha.",
    bullets: [
      "Acesso seguro, multi-cliente",
      "Conversa direta com a Claudia",
      "Histórico de fechamentos arquivado",
    ],
  },
];

export function FeatureTabs() {
  const [active, setActive] = useState(FEATURES[0].id);
  const current = FEATURES.find((f) => f.id === active) ?? FEATURES[0];

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-8">
      {/* Tabs */}
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-2 px-2 lg:mx-0 lg:px-0">
        {FEATURES.map((f) => {
          const a = f.id === active;
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className="text-left px-5 py-4 transition-all whitespace-nowrap lg:whitespace-normal"
              style={{
                background: a ? "var(--green)" : "#fff",
                color: a ? "#fff" : "var(--foreground)",
                border: `1px solid ${a ? "var(--green)" : "var(--line)"}`,
                letterSpacing: "0.3px",
              }}
            >
              <div
                className="text-[9px] uppercase mb-1.5"
                style={{
                  letterSpacing: "2.5px",
                  fontWeight: 500,
                  color: a ? "rgba(255,255,255,0.6)" : "var(--sage)",
                }}
              >
                {String(FEATURES.indexOf(f) + 1).padStart(2, "0")}
              </div>
              <div className="aurora-serif text-[18px]" style={{ lineHeight: 1.1 }}>
                {f.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Painel */}
      <div className="aurora-card p-10 flex flex-col gap-6 relative overflow-hidden" style={{ minHeight: 380 }}>
        <div
          aria-hidden
          className="absolute right-[-40px] bottom-[-40px] pointer-events-none select-none"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 220,
            color: "rgba(74,103,65,0.05)",
            lineHeight: 0.8,
            letterSpacing: "-6px",
          }}
        >
          {String(FEATURES.indexOf(current) + 1).padStart(2, "0")}
        </div>

        <div key={current.id} className="aurora-reveal-fade">
          <div className="aurora-cap" style={{ color: "var(--sage)" }}>
            {String(FEATURES.indexOf(current) + 1).padStart(2, "0")} · Feature
          </div>
          <h3
            className="aurora-serif mt-3"
            style={{ fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.05, letterSpacing: "-1.5px" }}
          >
            {current.title}
          </h3>
          <p
            className="mt-4 text-[15px] max-w-xl"
            style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}
          >
            {current.description}
          </p>
          <ul className="mt-7 grid sm:grid-cols-2 gap-3 max-w-2xl">
            {current.bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 text-[13px]"
                style={{ color: "var(--foreground)", lineHeight: 1.6 }}
              >
                <span
                  className="inline-block mt-1 shrink-0"
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: "var(--green)",
                  }}
                />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
