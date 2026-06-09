// Hero unificado — fundo linho contínuo, sem split vertical abrupto.
// Conteúdo centralizado-esquerda, com elementos decorativos sutis integrados
// no background em vez de ocupar uma coluna inteira.
import { LogoMark } from "@/components/Logo";
import { AURORA_WHATSAPP } from "@/lib/supabase";

export function HeroPC() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      style={{
        background: "var(--linen)",
        minHeight: "94vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* ============ Camadas decorativas no background ============ */}
      {/* Blob orgânico sage no canto inferior direito */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          right: "-20%",
          bottom: "-30%",
          width: 900,
          height: 900,
          background:
            "radial-gradient(circle, rgba(143,166,136,0.32) 0%, rgba(143,166,136,0.10) 40%, transparent 70%)",
          filter: "blur(40px)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />
      {/* Blob sutil tan no canto superior direito */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          right: "5%",
          top: "-15%",
          width: 480,
          height: 480,
          background:
            "radial-gradient(circle, rgba(212,184,150,0.28) 0%, transparent 70%)",
          filter: "blur(60px)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />

      {/* Símbolo Aurora gigante atrás (marca-d'água editorial) */}
      <div
        aria-hidden
        className="absolute pointer-events-none hidden lg:flex"
        style={{
          right: "-8%",
          top: "50%",
          transform: "translateY(-50%)",
          color: "rgba(74,103,65,0.05)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <div style={{ transform: "scale(11)" }}>
          <LogoMark size={80} />
        </div>
      </div>

      {/* ============ Conteúdo ============ */}
      <div className="relative z-10 px-6 lg:px-14 pt-[140px] pb-20 lg:py-32 w-full">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 items-end">
            {/* Coluna principal — copy */}
            <div>
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
                  fontSize: "clamp(48px, 7vw, 104px)",
                  fontWeight: 300,
                  lineHeight: 0.95,
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
                className="mt-8 max-w-[560px]"
                style={{
                  fontSize: 18,
                  fontWeight: 300,
                  lineHeight: 1.65,
                  color: "var(--muted-foreground)",
                }}
              >
                Sócia estratégica do financeiro de empresários ambiciosos. A Aurora cuida do
                extrato, fecha o DFC, projeta o caixa — e te entrega leitura clara para a
                próxima decisão.
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
            </div>

            {/* Coluna secundária — quote pessoal Claudia + stats */}
            <aside className="flex flex-col gap-7 lg:items-end">
              {/* Quote card pequeno e elegante */}
              <figure
                className="max-w-[400px]"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(74,103,65,0.12)",
                  padding: 28,
                  borderLeft: "3px solid var(--green)",
                }}
              >
                <div
                  className="text-[9px] uppercase mb-2"
                  style={{ letterSpacing: "3px", color: "var(--sage)", fontWeight: 600 }}
                >
                  Por trás da Aurora
                </div>
                <blockquote
                  className="aurora-serif italic"
                  style={{
                    fontSize: 19,
                    fontWeight: 300,
                    lineHeight: 1.45,
                    color: "var(--foreground)",
                    letterSpacing: "-0.3px",
                  }}
                >
                  "Não vendemos relatório. Vendemos a decisão informada."
                </blockquote>
                <figcaption
                  className="mt-4 text-[12px]"
                  style={{ color: "var(--muted-foreground)", letterSpacing: "0.2px" }}
                >
                  — Claudia Lima, fundadora
                </figcaption>
              </figure>

              {/* Stats grid 2x1 */}
              <div className="flex gap-8 lg:justify-end">
                <div>
                  <div
                    className="text-[10px] uppercase"
                    style={{
                      letterSpacing: "2.5px",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    Já atende
                  </div>
                  <div
                    className="aurora-serif mt-1"
                    style={{
                      fontSize: 30,
                      fontWeight: 300,
                      color: "var(--navy)",
                      letterSpacing: "-0.5px",
                      lineHeight: 1,
                    }}
                  >
                    120+ empresários
                  </div>
                </div>
                <div
                  aria-hidden
                  style={{ width: 1, background: "var(--line)" }}
                />
                <div>
                  <div
                    className="text-[10px] uppercase"
                    style={{
                      letterSpacing: "2.5px",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    Em fluxo
                  </div>
                  <div
                    className="aurora-serif mt-1"
                    style={{
                      fontSize: 30,
                      fontWeight: 300,
                      color: "var(--navy)",
                      letterSpacing: "-0.5px",
                      lineHeight: 1,
                    }}
                  >
                    R$ 2,3 mi/mês
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Strip social — base do hero, ainda dentro do mesmo bg linho */}
      <div
        className="relative z-10 px-6 lg:px-14 py-5 flex items-center justify-center gap-x-8 gap-y-2 flex-wrap text-[10px] uppercase"
        style={{
          letterSpacing: "2.5px",
          color: "var(--muted-foreground)",
          borderTop: "1px solid var(--line)",
          fontWeight: 500,
        }}
      >
        <span>Atende de São Paulo a Porto Alegre</span>
        <span aria-hidden style={{ color: "var(--tan)" }}>·</span>
        <span>8 anos no mercado</span>
        <span aria-hidden style={{ color: "var(--tan)" }}>·</span>
        <span>Indicada por contadores</span>
        <span aria-hidden style={{ color: "var(--tan)" }}>·</span>
        <a
          href={AURORA_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--green)" }}
        >
          WhatsApp direto
        </a>
      </div>
    </section>
  );
}
