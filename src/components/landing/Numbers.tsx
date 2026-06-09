// Numbers — seção dark, contraste forte + WhatsApp CTA (3ª dobra).
import { Counter } from "./motion/Counter";
import { LogoMark } from "@/components/Logo";
import { AURORA_WHATSAPP } from "@/lib/supabase";

const INK = "#1C2D45";
const SAGE = "#99A989";
const STEEL = "#6D92A6";

export function Numbers() {
  return (
    <section
      className="px-6 lg:px-14 py-24 lg:py-32 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${INK} 0%, #0F1E30 100%)`,
        color: "#fff",
      }}
    >
      {/* Logo gigante decorativa */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          right: "-4%",
          top: "12%",
          color: SAGE,
          opacity: 0.05,
          transform: "scale(9) rotate(-8deg)",
          transformOrigin: "top right",
        }}
      >
        <LogoMark size={60} />
      </div>

      {/* Glows decorativos */}
      <div
        aria-hidden
        className="absolute"
        style={{
          right: "-15%",
          top: "-20%",
          width: 600,
          height: 600,
          background: `radial-gradient(circle, rgba(109,146,166,0.35) 0%, transparent 60%)`,
          filter: "blur(80px)",
          borderRadius: "50%",
          animation: "ambient-drift-2 32s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute"
        style={{
          left: "-10%",
          bottom: "-25%",
          width: 700,
          height: 700,
          background: `radial-gradient(circle, rgba(40,76,43,0.4) 0%, transparent 60%)`,
          filter: "blur(80px)",
          borderRadius: "50%",
          animation: "ambient-drift-1 36s ease-in-out infinite reverse",
        }}
      />

      <div className="max-w-[1280px] mx-auto relative z-10">
        <div className="reveal max-w-2xl mb-16">
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "1.5px",
              color: SAGE,
              marginBottom: 16,
            }}
          >
            EVIDÊNCIA
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(40px, 5vw, 64px)",
              fontWeight: 300,
              lineHeight: 1.0,
              letterSpacing: "-2px",
              color: "#fff",
            }}
          >
            Números que falam pela{" "}
            <em className="italic" style={{ color: SAGE }}>
              gente
            </em>
            .
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
          {[
            { val: 5, suf: " dias", l: "Tempo médio para o primeiro DFC fechado" },
            { val: 94, suf: "%", l: "Dos clientes seguem com a Aurora ano após ano" },
            { val: 24, pre: "< ", suf: "h", l: "Tempo médio de resposta da Claudia" },
            { val: 0, l: "Contratos com fidelidade — relação por confiança" },
          ].map((n, i) => (
            <div
              key={n.l}
              className="reveal relative px-0 lg:px-6 py-6"
              style={{
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.12)" : undefined,
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(56px, 6vw, 88px)",
                  fontWeight: 300,
                  letterSpacing: "-3px",
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                <Counter value={n.val} prefix={n.pre} suffix={n.suf} />
              </div>
              <p
                className="mt-4"
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.72)",
                  lineHeight: 1.6,
                  maxWidth: 220,
                }}
              >
                {n.l}
              </p>
            </div>
          ))}
        </div>

        {/* WhatsApp aparece a partir desta dobra (3ª) */}
        <div
          className="reveal mt-16 pt-10 flex flex-wrap items-center justify-between gap-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
        >
          <div
            className="max-w-md"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 24,
              fontWeight: 300,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.4,
              letterSpacing: "-0.4px",
            }}
          >
            Já está convencido? Chama a Claudia diretamente.
          </div>
          <a
            href={AURORA_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-3"
            style={{
              background: "#25D366",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              padding: "16px 28px",
              borderRadius: 999,
              boxShadow: "0 12px 32px -12px rgba(37,211,102,0.6)",
              letterSpacing: "0.2px",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 18px 40px -12px rgba(37,211,102,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "0 12px 32px -12px rgba(37,211,102,0.6)";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
            Chamar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
