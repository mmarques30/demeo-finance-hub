// Aurora — Features section nextsense-style.
// 4 features intercalando direção (img esq/dir alternada), com mock visual.
const INK = "#1C2D45";
const STEEL = "#6D92A6";
const SAGE = "#99A989";
const FOREST = "#284C2B";

const FEATURES = [
  {
    cap: "01 · Importação",
    title: "Seu extrato, decifrado",
    body:
      "PDF, CSV, imagem — qualquer formato de qualquer banco. A Aurora lê, identifica recorrências e classifica os lançamentos. Você só revisa.",
    bullets: ["Itaú, Bradesco, Inter, Nubank, BB, Santander", "OCR para imagem", "Regras aprendidas em 1 clique"],
    visual: "import",
  },
  {
    cap: "02 · Fechamento",
    title: "DFC em até 5 dias úteis",
    body:
      "Demonstrativo de fluxo de caixa pronto antes do quinto dia útil. Comparativo mês a mês, quebra por categoria, exportação em PDF Aurora.",
    bullets: ["DFC + DRE consolidados", "Drill-down por categoria", "PDF Aurora ou Excel"],
    visual: "dfc",
  },
  {
    cap: "03 · Projeção",
    title: "Decisão antes do problema",
    body:
      "Projeção rolante 30/60/90 dias, alerta antes do aperto, cenários para você decidir contratação ou investimento com a foto na frente.",
    bullets: ["Cenários: base, otimista, pessimista", "Alerta de risco em vermelho", "Aprende com histórico real"],
    visual: "projection",
  },
  {
    cap: "04 · Portal do cliente",
    title: "Seu sócio também vê",
    body:
      "Cada empresário recebe um painel próprio. Saldo, despesas, contas previstas — em tempo real. Sem precisar ligar para pedir planilha.",
    bullets: ["Acesso por convite", "Atualizado pela equipe Aurora", "Conversa direta no WhatsApp"],
    visual: "portal",
  },
];

export function Features() {
  return (
    <section
      id="metodo"
      className="px-6 lg:px-14 py-20 lg:py-28"
      style={{ background: "#FAFAF8" }}
    >
      <div className="max-w-[1280px] mx-auto">
        <div className="reveal mb-16 max-w-2xl">
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.5px",
              color: SAGE,
              marginBottom: 14,
            }}
          >
            COMO FUNCIONA
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
            Quatro entregas. Uma{" "}
            <em className="italic" style={{ color: FOREST }}>
              clareza
            </em>{" "}
            só.
          </h2>
        </div>

        <div className="flex flex-col gap-12 lg:gap-20">
          {FEATURES.map((f, idx) => {
            const reverse = idx % 2 === 1;
            return (
              <article
                key={f.cap}
                className={`reveal grid lg:grid-cols-2 gap-10 lg:gap-16 items-center`}
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <div className={reverse ? "lg:order-2" : ""}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "1.5px",
                      color: STEEL,
                      marginBottom: 14,
                    }}
                  >
                    {f.cap}
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "clamp(32px, 3.5vw, 44px)",
                      fontWeight: 300,
                      lineHeight: 1.1,
                      letterSpacing: "-1px",
                      color: INK,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="mt-5 max-w-[480px]"
                    style={{
                      fontSize: 16,
                      fontWeight: 400,
                      lineHeight: 1.6,
                      color: "rgba(28,45,69,0.7)",
                    }}
                  >
                    {f.body}
                  </p>
                  <ul className="mt-7 flex flex-col gap-3">
                    {f.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-3"
                        style={{ fontSize: 14, color: INK, lineHeight: 1.5 }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: 20,
                            height: 20,
                            background: "rgba(40,76,43,0.1)",
                            color: FOREST,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          ✓
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={reverse ? "lg:order-1" : ""}>
                  <FeatureVisual variant={f.visual as "import" | "dfc" | "projection" | "portal"} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureVisual({ variant }: { variant: "import" | "dfc" | "projection" | "portal" }) {
  const common = {
    background: "#FFFFFF",
    border: "1px solid rgba(28,45,69,0.1)",
    borderRadius: 8,
    padding: 24,
    boxShadow: "0 20px 40px -20px rgba(28,45,69,0.18)",
  } as React.CSSProperties;

  if (variant === "import") {
    return (
      <div style={common}>
        <div style={{ fontSize: 11, fontWeight: 600, color: SAGE, marginBottom: 14 }}>
          EXTRATO PROCESSADO
        </div>
        <div className="flex flex-col gap-2">
          {[
            { d: "02/04", desc: "iFood Brasil", v: "+ R$ 4.820", cat: "Receita · Delivery", tag: "auto" },
            { d: "03/04", desc: "Aluguel Galeria", v: "− R$ 6.800", cat: "Custo Fixo · Aluguel", tag: "auto" },
            { d: "04/04", desc: "Folha funcionários", v: "− R$ 18.400", cat: "Custo Fixo · Salários", tag: "regra" },
            { d: "05/04", desc: "Compra farinha", v: "− R$ 3.120", cat: "Custo Variável · Insumos", tag: "auto" },
          ].map((l, i) => (
            <div
              key={i}
              className="grid grid-cols-[44px_1fr_auto_auto] gap-3 items-center px-3 py-2.5"
              style={{
                background: "#FAFAF8",
                border: "1px solid rgba(28,45,69,0.06)",
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              <span style={{ color: "rgba(28,45,69,0.55)", fontWeight: 500 }}>{l.d}</span>
              <div>
                <div style={{ fontWeight: 500, color: INK }}>{l.desc}</div>
                <div style={{ fontSize: 10, color: "rgba(28,45,69,0.55)" }}>{l.cat}</div>
              </div>
              <span style={{ fontWeight: 500, color: l.v.startsWith("+") ? FOREST : INK }}>{l.v}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  background: "rgba(40,76,43,0.08)",
                  color: FOREST,
                  padding: "3px 7px",
                  borderRadius: 2,
                  textTransform: "uppercase",
                }}
              >
                {l.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "dfc") {
    const bars = [
      { w: "Sem 1", in: 48, out: 32 },
      { w: "Sem 2", in: 72, out: 38 },
      { w: "Sem 3", in: 56, out: 64 },
      { w: "Sem 4", in: 88, out: 44 },
    ];
    const max = Math.max(...bars.flatMap((b) => [b.in, b.out]));
    return (
      <div style={common}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: SAGE, marginBottom: 4 }}>DFC · ABRIL 2026</div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 22,
                fontWeight: 400,
                color: INK,
                lineHeight: 1,
              }}
            >
              Padaria São Jorge
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.5px",
              color: FOREST,
              background: "rgba(40,76,43,0.08)",
              padding: "4px 10px",
              borderRadius: 2,
              textTransform: "uppercase",
            }}
          >
            ● Em dia
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4 items-end mb-4" style={{ height: 120 }}>
          {bars.map((b) => (
            <div key={b.w} className="flex flex-col gap-2 items-stretch h-full">
              <div className="flex-1 flex items-end gap-1">
                <div style={{ flex: 1, height: `${(b.in / max) * 100}%`, background: FOREST }} aria-hidden />
                <div style={{ flex: 1, height: `${(b.out / max) * 100}%`, background: STEEL, opacity: 0.75 }} aria-hidden />
              </div>
              <div style={{ fontSize: 10, color: "rgba(28,45,69,0.55)", textAlign: "center", fontWeight: 500 }}>
                {b.w}
              </div>
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-3 gap-3 pt-4"
          style={{ borderTop: "1px solid rgba(28,45,69,0.08)" }}
        >
          {[
            { l: "Receitas", v: "R$ 92.4k", c: FOREST },
            { l: "Despesas", v: "R$ 71.8k", c: STEEL },
            { l: "Resultado", v: "R$ 20.6k", c: INK },
          ].map((s) => (
            <div key={s.l}>
              <div style={{ fontSize: 10, fontWeight: 500, color: "rgba(28,45,69,0.55)", marginBottom: 4 }}>
                {s.l}
              </div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 20,
                  fontWeight: 300,
                  color: s.c,
                  lineHeight: 1,
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "projection") {
    return (
      <div style={common}>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: SAGE, marginBottom: 4 }}>PROJEÇÃO 90 DIAS</div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 22,
                fontWeight: 400,
                color: INK,
                lineHeight: 1,
              }}
            >
              Cenário base
            </div>
          </div>
          <span style={{ fontSize: 11, color: "rgba(28,45,69,0.55)" }}>Mai · Jun · Jul</span>
        </div>

        <svg viewBox="0 0 320 140" width="100%" height="140" aria-hidden>
          <defs>
            <linearGradient id="proj-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FOREST} stopOpacity="0.25" />
              <stop offset="100%" stopColor={FOREST} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Eixos */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1="0"
              x2="320"
              y1={28 + i * 32}
              y2={28 + i * 32}
              stroke="rgba(28,45,69,0.06)"
              strokeWidth="1"
            />
          ))}
          {/* Área */}
          <path d="M0,90 Q60,75 110,68 T220,40 L320,28 L320,140 L0,140 Z" fill="url(#proj-fill)" />
          {/* Curva */}
          <path
            d="M0,90 Q60,75 110,68 T220,40 L320,28"
            fill="none"
            stroke={FOREST}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Pontos */}
          {[
            [40, 86],
            [120, 66],
            [200, 50],
            [280, 34],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke={FOREST} strokeWidth="2" />
          ))}
        </svg>

        <div
          className="mt-4 pt-4 grid grid-cols-3 gap-3"
          style={{ borderTop: "1px solid rgba(28,45,69,0.08)" }}
        >
          {[
            { l: "+30d", v: "R$ 24k" },
            { l: "+60d", v: "R$ 51k" },
            { l: "+90d", v: "R$ 83k" },
          ].map((s) => (
            <div key={s.l}>
              <div style={{ fontSize: 10, fontWeight: 500, color: "rgba(28,45,69,0.55)" }}>{s.l}</div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 20,
                  fontWeight: 300,
                  color: FOREST,
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // portal
  return (
    <div className="flex items-center justify-center" style={{ padding: 12 }}>
      <div
        style={{
          width: 220,
          background: INK,
          borderRadius: 26,
          padding: 8,
          boxShadow: "0 30px 60px -30px rgba(28,45,69,0.45), 0 18px 36px -18px rgba(28,45,69,0.2)",
        }}
      >
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", padding: 18 }}>
          <div
            className="flex items-center justify-between mb-4"
            style={{ fontSize: 10, color: "rgba(28,45,69,0.55)" }}
          >
            <span>Portal</span>
            <span>09:14</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: SAGE, marginBottom: 4 }}>SALDO HOJE</div>
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 32,
              fontWeight: 300,
              color: INK,
              letterSpacing: "-1px",
              lineHeight: 1,
            }}
          >
            R$ 48.230
          </div>
          <div
            style={{
              fontSize: 9,
              color: FOREST,
              background: "rgba(40,76,43,0.08)",
              padding: "3px 7px",
              borderRadius: 2,
              display: "inline-block",
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            ↑ 12% abril
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {[
              { d: "Aluguel ponto", v: "− R$ 6.8k" },
              { d: "Folha equipe", v: "− R$ 18.4k" },
              { d: "iFood semana", v: "+ R$ 9.1k" },
            ].map((l, i) => (
              <div
                key={i}
                className="flex justify-between items-center"
                style={{
                  fontSize: 11,
                  padding: "8px 10px",
                  background: "#FAFAF8",
                  borderRadius: 4,
                  color: INK,
                }}
              >
                <span>{l.d}</span>
                <span style={{ fontWeight: 500, color: l.v.startsWith("+") ? FOREST : INK }}>{l.v}</span>
              </div>
            ))}
          </div>

          <a
            href="#"
            className="block text-center mt-4 focus-ring"
            style={{
              fontSize: 11,
              fontWeight: 500,
              background: FOREST,
              color: "#fff",
              padding: "10px",
              borderRadius: 4,
              letterSpacing: "0.5px",
            }}
          >
            Ver DFC completo →
          </a>
        </div>
      </div>
    </div>
  );
}
