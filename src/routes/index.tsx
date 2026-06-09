import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { Hero } from "@/components/landing/Hero";
import { Method } from "@/components/landing/Method";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { Services } from "@/components/landing/Services";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { CTASection } from "@/components/landing/CTASection";
import { AURORA_WHATSAPP } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Aurora · Gestão Financeira para Empresas" },
      {
        name: "description",
        content:
          "A Aurora caminha junto com o empresário: importa extratos, classifica lançamentos, gera DFC e te entrega a clareza para decidir o próximo passo.",
      },
      { property: "og:title", content: "Aurora · Gestão Financeira para Empresas" },
      {
        property: "og:description",
        content:
          "A Aurora caminha junto: extrato, DFC, projeção e clareza para decidir o próximo passo.",
      },
      { property: "og:image", content: "/brand/aurora-logo-primary.svg" },
    ],
  }),
});

const NAV = [
  { href: "#metodo", label: "Método" },
  { href: "#sistema", label: "Sistema" },
  { href: "#servicos", label: "Serviços" },
  { href: "#resultados", label: "Resultados" },
  { href: "#faq", label: "FAQ" },
];

const LINEN3 = "#EDE3D6";

function useScrolled(threshold = 40) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const fn = () => setS(window.scrollY > threshold);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return s;
}

function useRevealOnScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (reduce) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Landing() {
  const scrolled = useScrolled();
  useRevealOnScroll();

  return (
    <div className="min-h-screen" style={{ background: "var(--linen)" }}>
      {/* Skip link a11y */}
      <a href="#hero" className="skip-link focus-ring">
        Pular para o conteúdo
      </a>

      {/* NAV */}
      <nav
        aria-label="Navegação principal"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-14"
        style={{
          height: 64,
          background: "rgba(247,241,232,0.85)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--line)",
          boxShadow: scrolled ? "0 1px 0 var(--linen)" : "none",
          transition: "box-shadow 0.2s",
        }}
      >
        <Link
          to="/"
          aria-label="Aurora · página inicial"
          className="inline-flex items-center gap-2.5 focus-ring"
          style={{ color: "var(--green)" }}
        >
          <LogoMark size={22} />
          <span
            className="aurora-serif"
            style={{ color: "var(--foreground)", fontSize: 18, fontWeight: 500, letterSpacing: "0.2px" }}
          >
            Aurora
          </span>
        </Link>

        <ul className="hidden lg:flex items-center gap-7">
          {NAV.map((n) => (
            <li key={n.href}>
              <a
                href={n.href}
                className="text-[11px] uppercase focus-ring"
                style={{ letterSpacing: "2px", color: "var(--muted-foreground)", fontWeight: 500 }}
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-flex text-[11px] uppercase focus-ring"
            style={{
              letterSpacing: "2px",
              color: "var(--muted-foreground)",
              fontWeight: 500,
              padding: "8px 14px",
            }}
          >
            Entrar
          </Link>
          <a
            href={AURORA_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring text-[10px] uppercase inline-flex items-center gap-2"
            style={{
              background: "var(--green)",
              color: "#fff",
              letterSpacing: "2px",
              fontWeight: 500,
              padding: "10px 18px",
              borderRadius: 999,
            }}
          >
            Falar com a Claudia →
          </a>
        </div>
      </nav>

      <main id="main-content">
        {/* SEÇÃO 1 — Hero */}
        <Hero />

        {/* SEÇÃO 2 — Strip de prova social */}
        <div
          className="px-6 lg:px-14 py-6 text-center"
          style={{ background: LINEN3, borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}
        >
          {/* {{LOGOS_CLIENTES}} — quando real, substituir esse texto por linha de logos */}
          <p
            className="text-[11px] uppercase"
            style={{ letterSpacing: "2.5px", color: "var(--green2)", fontWeight: 500 }}
          >
            Atende empresários de São Paulo a Porto Alegre · 8 anos no mercado · Indicada por contadores
          </p>
        </div>

        {/* SEÇÃO 3 — Método */}
        <Method />

        {/* SEÇÃO 4 — Bento sistema */}
        <BentoGrid />

        {/* SEÇÃO 5 — Quem é a Claudia */}
        <section id="quem" className="px-6 lg:px-14 py-24 lg:py-32" style={{ background: "var(--linen)" }}>
          <div className="max-w-[1280px] mx-auto grid lg:grid-cols-[40fr_60fr] gap-12 lg:gap-16 items-center">
            <div className="reveal">
              <figure
                style={{
                  aspectRatio: "4 / 5",
                  maxWidth: 440,
                  margin: "0 auto",
                  background: "var(--linen2)",
                  border: "1px solid var(--tan)",
                  position: "relative",
                  boxShadow: "0 1px 0 rgba(74,103,65,0.05), 0 0 0 1px var(--linen)",
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
                    if (el.parentElement) {
                      el.parentElement.innerHTML = `
                        <div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:120px;color:rgba(74,103,65,0.18);">
                          Claudia
                        </div>
                      `;
                    }
                  }}
                />
              </figure>
            </div>

            <div className="reveal" style={{ transitionDelay: "120ms" }}>
              <div
                className="text-[10px] uppercase mb-3"
                style={{ letterSpacing: "3px", color: "var(--sage)", fontWeight: 500 }}
              >
                Quem está por trás
              </div>
              <h2
                className="aurora-serif"
                style={{ fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-1.8px" }}
              >
                Eu não aponto o caminho. Eu{" "}
                <em className="italic" style={{ color: "var(--green)" }}>
                  caminho junto
                </em>
                .
              </h2>

              <p
                className="mt-7 max-w-[560px]"
                style={{ fontSize: 15, color: "var(--muted-foreground)", lineHeight: 1.85, fontWeight: 300 }}
              >
                {/* {{HISTORIA_CLAUDIA}} parágrafo 1 */}
                Sou Claudia, gestora financeira. Trabalho há oito anos com pequenos empresários — pessoas que constroem
                negócios reais, com mão na massa, e que precisam de alguém para cuidar dos números com a mesma
                seriedade com que eles cuidam do que vendem.
              </p>
              <p
                className="mt-4 max-w-[560px]"
                style={{ fontSize: 15, color: "var(--muted-foreground)", lineHeight: 1.85, fontWeight: 300 }}
              >
                {/* {{HISTORIA_CLAUDIA}} parágrafo 2 */}
                Criei a Aurora para fazer isso de um jeito calmo e claro. A gente conversa pelo WhatsApp, eu fecho o
                mês junto com você, e a tecnologia fica em segundo plano — ela existe para você ter tempo para o que
                importa.
              </p>

              <ul className="mt-8 flex flex-col gap-2.5">
                {[
                  "8 anos com pequenos empresários",
                  "Formação em Gestão Financeira",
                  "100% remoto, fala pelo WhatsApp",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[13px]" style={{ color: "var(--foreground)" }}>
                    <span aria-hidden style={{ color: "var(--sage)", fontSize: 16, lineHeight: 1 }}>·</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SEÇÃO 6 — Serviços (do banco) */}
        <Services />

        {/* SEÇÃO 7 — Faixa de stats verde */}
        <StatsStrip />

        {/* SEÇÃO 8 — Depoimentos */}
        <Testimonials />

        {/* SEÇÃO 9 — FAQ */}
        <FAQ />

        {/* SEÇÃO 10 — CTA grande + LeadForm */}
        <CTASection />
      </main>

      {/* SEÇÃO 11 — Footer */}
      <footer
        className="px-6 lg:px-14 pt-16 pb-10"
        style={{ background: "var(--linen)", borderTop: "1px solid var(--line)" }}
      >
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-3 gap-10 mb-12">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5" style={{ color: "var(--green)" }}>
              <LogoMark size={22} />
              <span className="aurora-serif" style={{ color: "var(--foreground)", fontSize: 18, fontWeight: 500 }}>
                Aurora
              </span>
            </Link>
            <p
              className="aurora-serif italic mt-4 max-w-xs"
              style={{ fontSize: 15, color: "var(--muted-foreground)", lineHeight: 1.6 }}
            >
              Clareza que envolve. Resultado que permanece.
            </p>
            <p className="mt-5 text-[11px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
              {/* {{ENDERECO}} */}
              Aurora Gestão Financeira<br />
              São Paulo · SP
            </p>
          </div>

          <FooterCol title="Plataforma">
            <a href="#metodo">Método</a>
            <a href="#sistema">Sistema</a>
            <a href="#servicos">Serviços</a>
            <a href="#faq">FAQ</a>
          </FooterCol>

          <FooterCol title="Contato">
            <a href={AURORA_WHATSAPP} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <a href="mailto:claudia@aurora.com.br">claudia@aurora.com.br</a>
            {/* {{INSTAGRAM_URL}} */}
            <a href="#" rel="noopener noreferrer">Instagram</a>
            {/* {{LINKEDIN_URL}} */}
            <a href="#" rel="noopener noreferrer">LinkedIn</a>
          </FooterCol>
        </div>

        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pt-7"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <div className="text-[11px]" style={{ color: "var(--muted-foreground)", letterSpacing: "0.3px" }}>
            © Aurora Gestão Financeira 2026 · CNPJ {/* {{CNPJ}} */}00.000.000/0001-00
          </div>
          <div className="text-[11px]" style={{ color: "var(--muted-foreground)", letterSpacing: "0.3px" }}>
            Feito com ✶ pela IAplicada
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[9px] uppercase mb-4"
        style={{ letterSpacing: "2.5px", color: "var(--sage)", fontWeight: 600 }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-2.5 text-[13px]">{children}</div>
      <style>{`
        footer a {
          color: var(--muted-foreground);
          transition: color 0.15s;
        }
        footer a:hover { color: var(--green); }
      `}</style>
    </div>
  );
}
