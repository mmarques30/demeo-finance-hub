// Aurora v3 — Hero clínico-minimalista, inspirado em nextsense.io.
// Grid: lado esquerdo dark (#1C2D45 ink) com headline gigante,
// lado direito mist com showcase do logo + 2 stats numéricos.
import { LogoMark } from "@/components/Logo";
import { AURORA_WHATSAPP } from "@/lib/supabase";

export function HeroPC() {
  return (
    <section id="hero" className="relative" style={{ minHeight: "100vh" }}>
      <div className="grid lg:grid-cols-2" style={{ minHeight: "100vh", paddingTop: 64 }}>
        {/* ============ ESQUERDA — DARK ============ */}
        <div
          className="relative overflow-hidden flex flex-col justify-end px-7 lg:px-16 py-20 lg:py-24"
          style={{ background: "#1C2D45", minHeight: "calc(100vh - 64px)" }}
        >
          {/* Mesh radial */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(109,146,166,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 20% 80%, rgba(40,76,43,0.22) 0%, transparent 60%)",
            }}
          />
          {/* Letra A gigante */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: 40,
              right: 40,
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 260,
              fontWeight: 200,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.03)",
              lineHeight: 1,
              letterSpacing: "-10px",
              userSelect: "none",
            }}
          >
            A
          </div>

          <div className="relative z-10 reveal">
            <div className="inline-flex items-center gap-2.5 mb-6" style={{ color: "#6D92A6" }}>
              <span aria-hidden style={{ width: 28, height: 1, background: "#6D92A6" }} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>
                Gestora Financeira · Paleta AICMA · 2026
              </span>
            </div>

            <h1
              className="aurora-serif"
              style={{
                fontSize: "clamp(72px, 12vw, 148px)",
                fontWeight: 200,
                letterSpacing: "-6px",
                lineHeight: 0.85,
                color: "#fff",
              }}
            >
              Au<em className="italic" style={{ color: "#6D92A6" }}>rora</em>
            </h1>

            <div className="mt-10 flex items-end justify-between flex-wrap gap-6">
              <p
                className="aurora-serif italic"
                style={{
                  fontSize: 16,
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.5,
                  maxWidth: 320,
                }}
              >
                Gestão financeira para empresas que querem enxergar o próprio crescimento.
              </p>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                v3 · Claudia De Meo
              </span>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-3">
              <a
                href="#contato"
                className="focus-ring inline-flex items-center gap-2.5"
                style={{
                  background: "#284C2B",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "16px 26px",
                  borderRadius: 4,
                  transition: "background 0.2s, transform 0.2s",
                }}
              >
                Quero clareza financeira <span aria-hidden>→</span>
              </a>
              <a
                href="#metodo"
                className="focus-ring inline-flex items-center gap-2.5"
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.78)",
                  fontSize: 12,
                  fontWeight: 400,
                  padding: "16px 22px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 4,
                }}
              >
                Ver como funciona
              </a>
            </div>
          </div>
        </div>

        {/* ============ DIREITA — MIST ============ */}
        <div
          className="hidden lg:flex flex-col"
          style={{
            background: "#FFFFFF",
            borderLeft: "1px solid rgba(28,45,69,0.1)",
          }}
        >
          <div
            className="flex-1 flex items-center justify-center px-16 py-12 relative overflow-hidden"
            style={{ minHeight: 320 }}
          >
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(40,76,43,0.05) 0%, transparent 70%)",
              }}
            />
            <div className="relative z-10 reveal" style={{ transitionDelay: "100ms" }}>
              <div className="flex items-center gap-5" style={{ color: "#284C2B" }}>
                <LogoMark size={86} />
                <div>
                  <div
                    className="aurora-serif"
                    style={{
                      fontSize: 72,
                      fontWeight: 300,
                      letterSpacing: "-3px",
                      lineHeight: 1,
                      color: "#1C2D45",
                    }}
                  >
                    Aurora
                  </div>
                  <div
                    className="mt-2"
                    style={{
                      fontSize: 10,
                      fontWeight: 300,
                      letterSpacing: "3px",
                      color: "#6B7A6A",
                    }}
                  >
                    GESTORA FINANCEIRA
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="grid grid-cols-2"
            style={{ borderTop: "1px solid rgba(28,45,69,0.1)" }}
          >
            <div
              className="py-6 px-7 flex flex-col gap-1.5"
              style={{ borderRight: "1px solid rgba(28,45,69,0.1)" }}
            >
              <div
                className="aurora-serif"
                style={{
                  fontSize: 36,
                  fontWeight: 300,
                  letterSpacing: "-1px",
                  color: "#284C2B",
                  lineHeight: 1,
                }}
              >
                120+
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(28,45,69,0.6)" }}>
                Empresas atendidas
              </div>
            </div>
            <div className="py-6 px-7 flex flex-col gap-1.5">
              <div
                className="aurora-serif"
                style={{
                  fontSize: 36,
                  fontWeight: 300,
                  letterSpacing: "-1px",
                  color: "#284C2B",
                  lineHeight: 1,
                }}
              >
                R$ 2,3mi
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(28,45,69,0.6)" }}>
                Em fluxo organizado/mês
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker forest */}
      <div className="overflow-hidden py-3" style={{ background: "#284C2B" }}>
        <div
          className="flex gap-12 whitespace-nowrap"
          style={{ animation: "marquee 30s linear infinite" }}
        >
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="flex gap-12">
              {["AURORA", "GESTÃO FINANCEIRA", "CLAREZA", "CRESCIMENTO", "CLAUDIA DE MEO", "PMEs", "PALETA AICMA"].map((t, j) => (
                <span key={j} className="flex items-center gap-12">
                  <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>{t}</span>
                  <span aria-hidden style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Strip trust signals */}
      <div
        className="px-6 lg:px-14 py-5 flex items-center justify-center gap-x-8 gap-y-2 flex-wrap"
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid rgba(28,45,69,0.08)",
          fontSize: 11,
          fontWeight: 400,
          color: "rgba(28,45,69,0.55)",
        }}
      >
        <span>Atende de São Paulo a Porto Alegre</span>
        <span aria-hidden style={{ color: "rgba(28,45,69,0.25)" }}>·</span>
        <span>8 anos no mercado</span>
        <span aria-hidden style={{ color: "rgba(28,45,69,0.25)" }}>·</span>
        <span>Indicada por contadores</span>
        <span aria-hidden style={{ color: "rgba(28,45,69,0.25)" }}>·</span>
        <a href={AURORA_WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ color: "#284C2B", fontWeight: 500 }}>
          WhatsApp direto
        </a>
      </div>
    </section>
  );
}
