// Seção final estilo Podcast Coach — fundo escuro + tagline grande +
// formulário compacto à direita. Antes do footer.
import { LeadForm } from "@/components/LeadForm";

export function FinalCTA() {
  return (
    <section
      id="contato"
      className="px-6 lg:px-14 py-28 lg:py-36 relative overflow-hidden"
      style={{ background: "var(--green)" }}
    >
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-[1fr_540px] gap-12 lg:gap-20 items-start">
        {/* Esquerda — copy */}
        <div className="reveal">
          <div
            className="text-[11px] uppercase mb-5"
            style={{ letterSpacing: "3px", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}
          >
            Hora de conversar
          </div>
          <h2
            className="aurora-serif"
            style={{
              fontSize: "clamp(44px, 6vw, 84px)",
              fontWeight: 300,
              lineHeight: 1,
              letterSpacing: "-2.5px",
              color: "#fff",
            }}
          >
            Conta um pouco da
            <br />
            sua{" "}
            <em className="italic" style={{ color: "var(--linen)" }}>
              empresa
            </em>
            .
          </h2>
          <p
            className="mt-7 max-w-[440px]"
            style={{
              fontSize: 17,
              fontWeight: 300,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Responde em até 24h. Sem cobrança no primeiro papo — a gente decide junto
            se faz sentido seguir.
          </p>

          <ul className="mt-9 flex flex-col gap-3 text-[14px]" style={{ color: "rgba(255,255,255,0.95)" }}>
            {[
              "Diagnóstico financeiro gratuito",
              "Sem compromisso, sem pressão",
              "Atendimento pessoal — não é vendedor",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "#fff",
                    flexShrink: 0,
                  }}
                />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Direita — LeadForm */}
        <div className="reveal" style={{ transitionDelay: "120ms" }}>
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
