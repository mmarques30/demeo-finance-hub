import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Aura · Gestora Financeira para PMEs" },
      { name: "description", content: "Clareza financeira. Crescimento real. Plataforma multi-cliente da Aura para gestão financeira inteligente de pequenas e médias empresas." },
      { property: "og:title", content: "Aura · Clareza financeira. Crescimento real." },
      { property: "og:description", content: "Importação inteligente de extratos, classificação automática, DFC e portal do cliente." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen" style={{ background: "var(--linen2)" }}>
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 lg:px-14 py-4"
        style={{
          background: "rgba(253,249,244,0.92)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Link to="/" className="inline-flex items-center gap-2.5" style={{ color: "var(--green)" }}>
          <LogoMark size={22} />
          <span className="aura-serif text-[17px]" style={{ color: "var(--foreground)", fontWeight: 500 }}>
            Aura
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-7">
          <a href="#solucao" className="aura-link">Solução</a>
          <a href="#modulos" className="aura-link">Módulos</a>
          <a href="#sobre" className="aura-link">Sobre</a>
          <Link to="/login" className="aura-link">Entrar</Link>
        </div>
        <Link
          to="/login"
          className="text-[10px] uppercase px-4 py-2.5"
          style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
        >
          Acessar plataforma →
        </Link>
      </nav>

      {/* Hero */}
      <section
        className="relative pt-[160px] pb-24 px-8 lg:px-14 overflow-hidden"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <div
          className="absolute pointer-events-none select-none"
          style={{
            right: "-30px",
            bottom: "-90px",
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(200px, 30vw, 360px)",
            letterSpacing: "-10px",
            color: "transparent",
            WebkitTextStroke: "1px rgba(74,103,65,0.07)",
            lineHeight: 0.9,
          }}
        >
          Aura
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-end relative z-10 max-w-[1280px] mx-auto">
          <div>
            <div className="aura-cap mb-6 flex items-center gap-3">
              <span className="block w-8 h-px" style={{ background: "var(--sage)" }} />
              Manual da gestora · 2026
            </div>
            <h1 className="aura-serif" style={{ fontSize: "clamp(56px, 8vw, 112px)", lineHeight: 0.95, letterSpacing: "-3px" }}>
              Clareza<br />
              <em className="italic" style={{ color: "var(--green)" }}>financeira.</em>
            </h1>
          </div>
          <div className="pb-2">
            <p
              className="aura-serif italic mb-7 pl-5"
              style={{ fontSize: "22px", color: "var(--muted-foreground)", borderLeft: "2px solid var(--tan2)", lineHeight: 1.5 }}
            >
              "A consultoria financeira que organiza, projeta e te devolve o controle do caixa."
            </p>
            <p className="text-[14px] mb-8" style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}>
              A Aura é uma gestora financeira boutique para PMEs. Cuidamos de tudo — da importação dos seus extratos à entrega de DFC, projeções e fechamento mensal — com tecnologia própria e atendimento humano.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Confiança", "Elegância", "Diferente", "Clean", "Humano"].map((tag, i) => (
                <span
                  key={tag}
                  className="text-[9px] uppercase px-4 py-2 rounded-full"
                  style={{
                    letterSpacing: "2px",
                    fontWeight: 500,
                    background: i === 0 ? "var(--green)" : "transparent",
                    color: i === 0 ? "#fff" : "var(--muted-foreground)",
                    border: "1px solid " + (i === 0 ? "var(--green)" : "var(--line)"),
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden py-4" style={{ background: "var(--green)" }}>
        <div className="flex gap-12 whitespace-nowrap" style={{ animation: "aura-mq 32s linear infinite" }}>
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="flex gap-12">
              {["Gestão financeira", "Clareza", "DFC", "Crescimento", "PMEs", "Resultados", "Aura"].map((t, i) => (
                <span key={i} className="flex items-center gap-12">
                  <span className="text-[10px] uppercase" style={{ letterSpacing: "3px", color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
                    {t}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <style>{`@keyframes aura-mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }`}</style>
      </div>

      {/* Solução */}
      <section id="solucao" className="px-8 lg:px-14 py-24 max-w-[1280px] mx-auto">
        <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
          <div>
            <div className="aura-cap mb-2.5" style={{ color: "var(--sage)" }}>[ 01 ] — Solução</div>
            <h2 className="aura-serif" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1, letterSpacing: "-2px" }}>
              Uma única plataforma<br />
              <em className="italic" style={{ color: "var(--green)" }}>para o financeiro inteiro.</em>
            </h2>
          </div>
          <div className="text-[10px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>
            [ Multi-cliente ]
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: "01", t: "Importação inteligente", d: "PDF, CSV ou imagem — qualquer banco, qualquer formato. A IA classifica automaticamente." },
            { n: "02", t: "DFC & projeção 90 dias", d: "Demonstrativo de fluxo de caixa pronto, com projeção dos próximos 3 meses por categoria." },
            { n: "03", t: "Portal do cliente", d: "Cada empresário acessa o próprio painel — saldo, despesas, contas previstas, em tempo real." },
          ].map((b) => (
            <div key={b.n} className="aura-card flex flex-col gap-3">
              <div className="aura-serif" style={{ fontSize: 44, color: "var(--line)", letterSpacing: "-2px" }}>{b.n}</div>
              <div className="text-[15px]" style={{ fontWeight: 500 }}>{b.t}</div>
              <div className="text-[12px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>{b.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 lg:px-14 py-20" style={{ background: "var(--linen)" }}>
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="aura-serif text-[44px]" style={{ lineHeight: 1.05, letterSpacing: "-1.5px" }}>
              Pronto para ver seus<br /><em className="italic" style={{ color: "var(--green)" }}>números com clareza?</em>
            </h3>
            <p className="mt-4 text-[13px] max-w-md" style={{ color: "var(--muted-foreground)", lineHeight: 1.8 }}>
              Já é cliente da Aura? Entre na plataforma e acompanhe o fechamento do mês em tempo real.
            </p>
          </div>
          <div className="md:text-right">
            <Link
              to="/login"
              className="inline-flex items-center gap-3 px-7 py-4 text-[10px] uppercase"
              style={{ background: "var(--green)", color: "#fff", letterSpacing: "2.5px", fontWeight: 500 }}
            >
              Entrar na plataforma →
            </Link>
            <div className="mt-4 text-[10px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>
              Acesso por convite
            </div>
          </div>
        </div>
      </section>

      <footer className="px-8 lg:px-14 py-8 flex items-center justify-between" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="aura-serif text-[15px]" style={{ color: "var(--muted-foreground)" }}>
          Aura · Gestora Financeira
        </div>
        <div className="text-[9px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>
          © 2026 · Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
}
