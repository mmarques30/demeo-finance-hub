// Aurora — Founder section. Foto da Claudia + texto pessoal + CTA WhatsApp.
import { AURORA_WHATSAPP } from "@/lib/supabase";

const INK = "#1C2D45";
const STEEL = "#6D92A6";
const SAGE = "#99A989";
const FOREST = "#284C2B";

export function ClaudiaSection() {
  return (
    <section
      id="quem"
      className="px-6 lg:px-14 py-20 lg:py-28"
      style={{ background: "#FFFFFF" }}
    >
      <div className="max-w-[1180px] mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center">
        <div className="reveal">
          <figure
            style={{
              aspectRatio: "4 / 5",
              maxWidth: 460,
              margin: "0 auto",
              background: INK,
              position: "relative",
              overflow: "hidden",
              borderRadius: 4,
            }}
          >
            <img
              src="/claudia.jpg"
              alt="Claudia De Meo, fundadora da Aurora"
              loading="lazy"
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = "none";
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.08)",
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: 130,
                letterSpacing: "-4px",
                zIndex: 0,
                pointerEvents: "none",
              }}
            >
              Claudia
            </div>
            <figcaption
              className="absolute bottom-4 left-4 right-4 p-4"
              style={{
                background: "rgba(255,255,255,0.95)",
                borderLeft: `3px solid ${FOREST}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  color: FOREST,
                  marginBottom: 4,
                }}
              >
                FUNDADORA · AURORA
              </div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 20,
                  fontWeight: 400,
                  color: INK,
                  letterSpacing: "-0.3px",
                }}
              >
                Claudia De Meo
              </div>
            </figcaption>
          </figure>
        </div>

        <div className="reveal" style={{ transitionDelay: "100ms" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.5px",
              color: SAGE,
              marginBottom: 14,
            }}
          >
            QUEM É
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(34px, 4vw, 52px)",
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-1.4px",
              color: INK,
            }}
          >
            Eu cuido do seu financeiro como se fosse{" "}
            <em className="italic" style={{ color: FOREST }}>
              meu
            </em>
            .
          </h2>

          <div
            className="mt-7 space-y-5"
            style={{
              fontSize: 16,
              fontWeight: 400,
              lineHeight: 1.7,
              color: "rgba(28,45,69,0.75)",
              maxWidth: 540,
            }}
          >
            <p>
              Oito anos atrás eu trabalhava dentro de um escritório de contabilidade vendo
              pequenos empresários brilhantes perdendo dinheiro porque ninguém olhava para
              o caixa do jeito certo.
            </p>
            <p>
              Em 2018, criei a Aurora para fazer o que faltava:{" "}
              <strong style={{ color: INK, fontWeight: 600 }}>caminhar junto</strong> com o
              empresário. Não como software impessoal. Como alguém que entra na conta,
              organiza, fecha o mês e te entrega a próxima decisão pronta — pelo WhatsApp.
            </p>
          </div>

          <div
            className="mt-9 pt-7 grid grid-cols-2 gap-6 max-w-md"
            style={{ borderTop: "1px solid rgba(28,45,69,0.1)" }}
          >
            {[
              { l: "Carteira atual", v: "120+ empresários" },
              { l: "Formação", v: "Gestão Financeira · USP" },
              { l: "Canal direto", v: "WhatsApp pessoal" },
              { l: "Base", v: "100% remoto" },
            ].map((s) => (
              <div key={s.l}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "1.5px",
                    color: STEEL,
                    marginBottom: 4,
                  }}
                >
                  {s.l.toUpperCase()}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: INK }}>{s.v}</div>
              </div>
            ))}
          </div>

          <a
            href={AURORA_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-10 inline-flex items-center gap-2.5"
            style={{
              background: INK,
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              padding: "14px 24px",
              borderRadius: 4,
            }}
          >
            Chamar a Claudia →
          </a>
        </div>
      </div>
    </section>
  );
}
