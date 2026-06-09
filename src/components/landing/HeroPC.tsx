// Hero inspirado em Podcast Coach: tagline forte + 2 CTAs + assinatura visual
// abstrata (GreenRefraction) à direita. Copy mais direta, results-focused.
import { GreenRefraction } from "./GreenRefraction";
import { AURORA_WHATSAPP } from "@/lib/supabase";

export function HeroPC() {
  return (
    <section
      id="hero"
      className="relative"
      style={{ background: "var(--linen2)" }}
    >
      <div className="grid lg:grid-cols-[55fr_45fr] min-h-[88vh]">
        {/* Coluna esquerda — copy */}
        <div className="px-6 lg:px-14 pt-[120px] pb-20 lg:py-32 flex flex-col justify-center">
          <div className="max-w-[640px]">
            <div
              className="text-[11px] uppercase mb-7 inline-flex items-center gap-2.5"
              style={{ letterSpacing: "3px", color: "var(--green)", fontWeight: 500 }}
            >
              <span
                aria-hidden
                style={{ width: 24, height: 1, background: "var(--green)" }}
              />
              Gestão financeira boutique
            </div>

            <h1
              className="aurora-serif"
              style={{
                fontSize: "clamp(48px, 6.5vw, 92px)",
                fontWeight: 300,
                lineHeight: 0.96,
                letterSpacing: "-2.5px",
                color: "var(--foreground)",
              }}
            >
              A clareza que faz sua{" "}
              <em className="italic" style={{ color: "var(--green)" }}>
                empresa crescer
              </em>
              .
            </h1>

            <p
              className="mt-7 max-w-[520px]"
              style={{
                fontSize: 18,
                fontWeight: 300,
                lineHeight: 1.65,
                color: "var(--muted-foreground)",
              }}
            >
              Sócia estratégica do financeiro de empresários ambiciosos. A Aurora cuida do
              extrato, fecha o DFC, projeta o caixa — e te entrega leitura clara para a próxima
              decisão.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="#contato"
                className="focus-ring inline-flex items-center gap-3 text-[11px] uppercase"
                style={{
                  background: "var(--green)",
                  color: "#fff",
                  letterSpacing: "2.5px",
                  fontWeight: 500,
                  padding: "18px 28px",
                }}
              >
                Agendar conversa →
              </a>
              <a
                href="#metodo"
                className="focus-ring inline-flex items-center gap-3 text-[11px] uppercase"
                style={{
                  background: "transparent",
                  color: "var(--foreground)",
                  border: "1px solid var(--foreground)",
                  letterSpacing: "2.5px",
                  fontWeight: 500,
                  padding: "18px 28px",
                }}
              >
                Nosso método
              </a>
            </div>

            <div className="mt-12 flex items-center gap-8 flex-wrap">
              <div>
                <div className="text-[10px] uppercase" style={{ letterSpacing: "2.5px", color: "var(--muted-foreground)" }}>
                  Já atende
                </div>
                <div className="aurora-serif mt-1" style={{ fontSize: 32, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.5px", lineHeight: 1 }}>
                  120+ empresários
                </div>
              </div>
              <div
                aria-hidden
                style={{ width: 1, height: 36, background: "var(--line)" }}
              />
              <div>
                <div className="text-[10px] uppercase" style={{ letterSpacing: "2.5px", color: "var(--muted-foreground)" }}>
                  Em fluxo
                </div>
                <div className="aurora-serif mt-1" style={{ fontSize: 32, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.5px", lineHeight: 1 }}>
                  R$ 2,3 mi/mês
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna direita — assinatura visual abstrata */}
        <div className="hidden lg:block relative" style={{ minHeight: "88vh" }}>
          <div className="absolute inset-0">
            <GreenRefraction className="w-full h-full" />
          </div>
          {/* Etiqueta no canto inferior esquerdo */}
          <div
            className="absolute bottom-8 left-8 right-8 p-5"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.6)",
            }}
          >
            <div
              className="text-[9px] uppercase mb-1.5"
              style={{ letterSpacing: "2.5px", color: "var(--sage)", fontWeight: 500 }}
            >
              Por trás
            </div>
            <p
              className="aurora-serif italic"
              style={{ fontSize: 18, fontWeight: 300, lineHeight: 1.5, color: "var(--foreground)" }}
            >
              "Não vendemos relatório. Vendemos a decisão informada."
            </p>
            <div
              className="mt-3 text-[10px]"
              style={{ color: "var(--muted-foreground)", letterSpacing: "0.3px" }}
            >
              — Claudia Lima, fundadora
            </div>
          </div>
        </div>
      </div>

      {/* Strip de prova social */}
      <div
        className="px-6 lg:px-14 py-5 flex items-center justify-center gap-x-8 gap-y-2 flex-wrap text-[10px] uppercase"
        style={{
          letterSpacing: "2.5px",
          color: "var(--muted-foreground)",
          background: "#FFFFFF",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          fontWeight: 500,
        }}
      >
        <span>Atende de São Paulo a Porto Alegre</span>
        <span aria-hidden style={{ color: "var(--tan)" }}>·</span>
        <span>8 anos no mercado</span>
        <span aria-hidden style={{ color: "var(--tan)" }}>·</span>
        <span>Indicada por contadores</span>
        <span aria-hidden style={{ color: "var(--tan)" }}>·</span>
        <a href={AURORA_WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>
          WhatsApp direto
        </a>
      </div>
    </section>
  );
}
