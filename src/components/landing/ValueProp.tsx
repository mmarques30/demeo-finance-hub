// Seção de proposta de valor — body copy grande sobre fundo branco,
// como Podcast Coach faz após o hero.
export function ValueProp() {
  return (
    <section
      className="px-6 lg:px-14 py-28 lg:py-36"
      style={{ background: "#FFFFFF" }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="reveal grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-start">
          <div>
            <div
              className="text-[10px] uppercase mb-4"
              style={{ letterSpacing: "3px", color: "var(--sage)", fontWeight: 600 }}
            >
              [ 01 — Posicionamento ]
            </div>
            <h2
              className="aurora-serif"
              style={{
                fontSize: "clamp(36px, 4vw, 56px)",
                fontWeight: 300,
                lineHeight: 1.05,
                letterSpacing: "-1.5px",
                color: "var(--foreground)",
              }}
            >
              Para quem leva o
              <br />
              próprio negócio a{" "}
              <em className="italic" style={{ color: "var(--green)" }}>
                sério
              </em>
              .
            </h2>
          </div>

          <div
            style={{
              fontSize: 19,
              fontWeight: 300,
              lineHeight: 1.65,
              color: "var(--foreground)",
            }}
          >
            <p>
              A Aurora não é software de prateleira. É <strong style={{ fontWeight: 500 }}>sócia estratégica</strong>{" "}
              do empresário que sabe vender mas perde dinheiro no caminho —
              porque não tem tempo (nem fôlego) para olhar planilha de noite.
            </p>
            <p className="mt-6">
              A gente entra na conta corrente, organiza tudo, fecha o mês e te
              entrega a leitura. <em className="italic">Você decide com a foto inteira na frente</em>.
              Sem termo técnico. Sem reunião longa.
            </p>

            <div
              className="mt-10 pt-8 grid sm:grid-cols-3 gap-6"
              style={{ borderTop: "1px solid var(--line)" }}
            >
              {[
                { n: "5 dias", l: "para o primeiro DFC" },
                { n: "94%", l: "ficam ano após ano" },
                { n: "1 dia útil", l: "tempo de resposta" },
              ].map((s) => (
                <div key={s.l}>
                  <div
                    className="aurora-serif"
                    style={{
                      fontSize: 40,
                      fontWeight: 300,
                      color: "var(--green)",
                      letterSpacing: "-1px",
                      lineHeight: 1,
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    className="mt-2 text-[11px] uppercase"
                    style={{ letterSpacing: "2px", color: "var(--muted-foreground)", lineHeight: 1.5 }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
