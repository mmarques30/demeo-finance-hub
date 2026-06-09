// Aurora v3 — value prop / posicionamento. Padrão clínico-minimalista.
export function ValueProp() {
  return (
    <section
      id="metodo"
      className="px-6 lg:px-16 py-24 lg:py-32"
      style={{ background: "#FFFFFF" }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="reveal grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-start">
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#99A989",
                marginBottom: 8,
              }}
            >
              [ 01 ] Posicionamento
            </div>
            <h2
              className="aurora-serif"
              style={{
                fontSize: "clamp(40px, 5vw, 64px)",
                fontWeight: 200,
                letterSpacing: "-2.5px",
                lineHeight: 0.95,
                color: "#1C2D45",
              }}
            >
              Para quem leva o
              <br />
              próprio negócio a{" "}
              <em className="italic" style={{ color: "#284C2B" }}>
                sério
              </em>
              .
            </h2>
          </div>

          <div
            style={{
              fontSize: 17,
              fontWeight: 300,
              lineHeight: 1.7,
              color: "rgba(28,45,69,0.75)",
            }}
          >
            <p>
              A Aurora não é software de prateleira. É{" "}
              <strong style={{ color: "#1C2D45", fontWeight: 500 }}>
                gestora financeira
              </strong>{" "}
              do empresário que sabe vender mas perde dinheiro no caminho — porque não tem
              tempo (nem fôlego) para olhar planilha de noite.
            </p>
            <p className="mt-6">
              A gente entra na conta corrente, organiza tudo, fecha o mês e te entrega a
              leitura.{" "}
              <em className="italic" style={{ color: "#1C2D45" }}>
                Você decide com a foto inteira na frente
              </em>
              . Sem termo técnico. Sem reunião longa.
            </p>

            <div
              className="mt-10 pt-8 grid sm:grid-cols-3 gap-6"
              style={{ borderTop: "1px solid rgba(28,45,69,0.1)" }}
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
                      color: "#284C2B",
                      letterSpacing: "-1px",
                      lineHeight: 1,
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    className="mt-2"
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "rgba(28,45,69,0.55)",
                      lineHeight: 1.5,
                    }}
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
