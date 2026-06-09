// Aurora v3 — Final CTA. Fundo forest #284C2B com tagline grande.
import { LeadForm } from "@/components/LeadForm";

export function FinalCTA() {
  return (
    <section
      id="contato"
      className="px-6 lg:px-16 py-28 lg:py-36 relative overflow-hidden"
      style={{ background: "#284C2B" }}
    >
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-[1fr_540px] gap-12 lg:gap-20 items-start">
        <div className="reveal">
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "rgba(255,255,255,0.55)",
              marginBottom: 12,
            }}
          >
            Vamos conversar
          </div>
          <h2
            className="aurora-serif"
            style={{
              fontSize: "clamp(44px, 6vw, 84px)",
              fontWeight: 200,
              lineHeight: 0.95,
              letterSpacing: "-2.5px",
              color: "#fff",
            }}
          >
            Você merece ver seus
            <br />
            <em className="italic" style={{ color: "#99A989" }}>
              números com clareza
            </em>
            .
          </h2>
          <p
            className="mt-7 max-w-[440px]"
            style={{
              fontSize: 16,
              fontWeight: 300,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Responde em até 24h. Sem cobrança no primeiro papo — a gente decide junto se faz
            sentido seguir.
          </p>

          <ul className="mt-9 flex flex-col gap-3" style={{ color: "rgba(255,255,255,0.92)" }}>
            {[
              "Diagnóstico financeiro gratuito",
              "Sem compromisso, sem pressão",
              "Atendimento pessoal — não é vendedor",
            ].map((t) => (
              <li
                key={t}
                className="flex items-center gap-3"
                style={{ fontSize: 14 }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    background: "#99A989",
                    flexShrink: 0,
                  }}
                />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal" style={{ transitionDelay: "120ms" }}>
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
