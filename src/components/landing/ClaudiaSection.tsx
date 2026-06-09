// Seção dedicada à fundadora — inspirada na "team photography section"
// do Podcast Coach. Foto grande à esquerda, texto longo à direita.
import { AURORA_WHATSAPP } from "@/lib/supabase";

export function ClaudiaSection() {
  return (
    <section
      id="quem"
      className="px-6 lg:px-14 py-28 lg:py-36"
      style={{ background: "var(--linen2)" }}
    >
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">
        <div className="reveal">
          <figure
            style={{
              aspectRatio: "4 / 5",
              maxWidth: 520,
              margin: "0 auto",
              background: "var(--navy)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <img
              src="/claudia.jpg"
              alt="Claudia Lima, fundadora da Aurora Gestão Financeira"
              loading="lazy"
              decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = "none";
              }}
            />
            {/* Fallback caligráfico se imagem 404 */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                color: "rgba(255,255,255,0.08)",
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: 140,
                letterSpacing: "-4px",
                zIndex: 0,
              }}
            >
              Claudia
            </div>
            {/* Etiqueta inferior */}
            <figcaption
              className="absolute bottom-4 left-4 right-4 p-4"
              style={{
                background: "rgba(253,249,244,0.92)",
                backdropFilter: "blur(10px)",
                color: "var(--foreground)",
                borderLeft: "3px solid var(--green)",
              }}
            >
              <div
                className="text-[9px] uppercase mb-0.5"
                style={{ letterSpacing: "2.5px", color: "var(--green)", fontWeight: 600 }}
              >
                Fundadora · Aurora
              </div>
              <div
                className="aurora-serif"
                style={{ fontSize: 20, fontWeight: 300, letterSpacing: "-0.3px" }}
              >
                Claudia Lima
              </div>
            </figcaption>
          </figure>
        </div>

        <div className="reveal" style={{ transitionDelay: "120ms" }}>
          <div
            className="text-[10px] uppercase mb-4"
            style={{ letterSpacing: "3px", color: "var(--sage)", fontWeight: 600 }}
          >
            [ 03 — Por trás da Aurora ]
          </div>
          <h2
            className="aurora-serif"
            style={{
              fontSize: "clamp(36px, 4.5vw, 56px)",
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: "-1.5px",
            }}
          >
            Eu cuido do seu financeiro
            <br />
            como se fosse{" "}
            <em className="italic" style={{ color: "var(--green)" }}>
              meu
            </em>
            .
          </h2>

          <div
            className="mt-7 space-y-5"
            style={{
              fontSize: 16,
              fontWeight: 300,
              lineHeight: 1.7,
              color: "var(--foreground)",
            }}
          >
            <p>
              Sou Claudia, gestora financeira boutique. Oito anos atrás eu trabalhava
              dentro de um escritório de contabilidade vendo pequenos empresários
              brilhantes perdendo dinheiro porque ninguém olhava para o caixa do jeito
              certo.
            </p>
            <p>
              Em 2020, criei a Aurora para fazer o que faltava: <strong style={{ fontWeight: 500 }}>caminhar junto</strong>{" "}
              com o empresário. Não como software impessoal, não como contador. Como
              alguém que entra na conta, organiza, fecha, lê e te entrega a próxima
              decisão pronta — pelo WhatsApp, com calma e sem termo técnico.
            </p>
            <p>
              Hoje somos <strong style={{ fontWeight: 500 }}>uma equipe pequena</strong> que cuida de uma carteira pequena
              por escolha. Aurora é boutique: só atendo quem eu consigo cuidar bem.
            </p>
          </div>

          <div
            className="mt-10 pt-7 grid grid-cols-2 gap-5"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            {[
              { l: "Carteira atual", v: "120+ empresários" },
              { l: "Formação", v: "Gestão Financeira · USP" },
              { l: "Canal direto", v: "WhatsApp pessoal" },
              { l: "Cidade base", v: "São Paulo · 100% remoto" },
            ].map((s) => (
              <div key={s.l}>
                <div
                  className="text-[9px] uppercase mb-1"
                  style={{ letterSpacing: "2.5px", color: "var(--sage)", fontWeight: 600 }}
                >
                  {s.l}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>

          <a
            href={AURORA_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-10 inline-flex items-center gap-3 text-[11px] uppercase"
            style={{
              background: "var(--foreground)",
              color: "#fff",
              letterSpacing: "2.5px",
              fontWeight: 500,
              padding: "16px 26px",
            }}
          >
            Chamar a Claudia →
          </a>
        </div>
      </div>
    </section>
  );
}
