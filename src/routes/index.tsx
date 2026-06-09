import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { HeroPC } from "@/components/landing/HeroPC";
import { ValueProp } from "@/components/landing/ValueProp";
import { CaseStudies } from "@/components/landing/CaseStudies";
import { ClaudiaSection } from "@/components/landing/ClaudiaSection";
import { ServicesList } from "@/components/landing/ServicesList";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { AURORA_WHATSAPP } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Aurora · Gestão Financeira Boutique para Empresários" },
      {
        name: "description",
        content:
          "Sócia estratégica do financeiro de empresários ambiciosos. A Aurora cuida do extrato, fecha o DFC, projeta o caixa — e te entrega leitura clara para a próxima decisão.",
      },
      { property: "og:title", content: "Aurora · Gestão Financeira Boutique" },
      {
        property: "og:description",
        content:
          "A clareza que faz sua empresa crescer. Sócia estratégica do financeiro de empresários ambiciosos.",
      },
      { property: "og:image", content: "/brand/aurora-logo-primary.svg" },
    ],
  }),
});

const NAV = [
  { href: "#metodo", label: "Método" },
  { href: "#casos", label: "Casos" },
  { href: "#quem", label: "Quem somos" },
  { href: "#servicos", label: "Serviços" },
  { href: "#faq", label: "Dúvidas" },
];

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
    if (reduce || typeof IntersectionObserver === "undefined") {
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
    <div className="min-h-screen" style={{ background: "var(--linen2)" }}>
      <a href="#hero" className="skip-link focus-ring">
        Pular para o conteúdo
      </a>

      {/* NAV — clean, dark text on light bg (Podcast Coach style) */}
      <nav
        aria-label="Navegação principal"
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled ? "rgba(253,249,244,0.94)" : "rgba(253,249,244,0)",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <div className="px-6 lg:px-14 flex items-center justify-between" style={{ height: 72 }}>
          <Link
            to="/"
            aria-label="Aurora · página inicial"
            className="inline-flex items-center gap-2.5 focus-ring"
            style={{ color: "var(--green)" }}
          >
            <LogoMark size={22} />
            <span
              className="aurora-serif"
              style={{
                color: "var(--foreground)",
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: "0.2px",
              }}
            >
              Aurora
            </span>
          </Link>

          <ul className="hidden lg:flex items-center gap-9">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="text-[12px] uppercase focus-ring"
                  style={{
                    letterSpacing: "2px",
                    color: "var(--foreground)",
                    fontWeight: 500,
                  }}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-[12px] uppercase focus-ring"
              style={{
                letterSpacing: "2px",
                color: "var(--foreground)",
                fontWeight: 500,
                padding: "8px 14px",
              }}
            >
              Entrar
            </Link>
            <a
              href="#contato"
              className="focus-ring text-[11px] uppercase"
              style={{
                background: "var(--green)",
                color: "#fff",
                letterSpacing: "2px",
                fontWeight: 500,
                padding: "12px 22px",
              }}
            >
              Agendar conversa →
            </a>
          </div>
        </div>
      </nav>

      <main id="main-content">
        <HeroPC />
        <ValueProp />

        {/* Anchor explícito para "Método" + "Casos" — a section CaseStudies tem id próprio internamente */}
        <div id="metodo" />
        <div id="casos" />
        <CaseStudies />

        <ClaudiaSection />
        <ServicesList />

        {/* Testimonials já tem seu próprio bg/wrapper — reuso o componente */}
        <Testimonials />

        <FAQ />
        <FinalCTA />
      </main>

      {/* FOOTER — Podcast Coach style com newsletter */}
      <footer
        className="px-6 lg:px-14 pt-20 pb-10"
        style={{ background: "var(--navy)", color: "#fff" }}
      >
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-16">
          {/* Coluna 1 — marca + newsletter */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5" style={{ color: "#fff" }}>
              <span style={{ color: "var(--sage)" }}>
                <LogoMark size={22} />
              </span>
              <span className="aurora-serif" style={{ fontSize: 22, fontWeight: 500 }}>
                Aurora
              </span>
            </Link>
            <p
              className="aurora-serif italic mt-4 max-w-xs"
              style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}
            >
              A clareza que faz sua empresa crescer.
            </p>

            <form
              className="mt-7 max-w-[400px]"
              onSubmit={(e) => {
                e.preventDefault();
                // {{NEWSLETTER_SUBMIT}} — integrar com Resend ou edge function depois
                alert("Em breve! Por enquanto: claudia@aurora.com.br");
              }}
            >
              <label
                htmlFor="footer-newsletter"
                className="text-[10px] uppercase block mb-2"
                style={{ letterSpacing: "2.5px", color: "var(--sage)", fontWeight: 600 }}
              >
                Newsletter mensal
              </label>
              <div
                className="flex items-stretch"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <input
                  id="footer-newsletter"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  aria-describedby="newsletter-help"
                  className="flex-1 px-4 py-3 text-[13px] focus-ring"
                  style={{
                    background: "transparent",
                    color: "#fff",
                    border: "none",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  className="focus-ring text-[11px] uppercase px-5"
                  style={{
                    background: "var(--green)",
                    color: "#fff",
                    letterSpacing: "2px",
                    fontWeight: 500,
                  }}
                >
                  Quero →
                </button>
              </div>
              <p
                id="newsletter-help"
                className="mt-2 text-[11px]"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Uma leitura por mês sobre gestão financeira de PME. Sem spam.
              </p>
            </form>
          </div>

          <FooterCol title="Plataforma">
            <a href="#metodo">Método</a>
            <a href="#casos">Casos</a>
            <a href="#servicos">Serviços</a>
            <a href="#faq">Dúvidas</a>
          </FooterCol>

          <FooterCol title="Aurora">
            <a href="#quem">Quem somos</a>
            <Link to="/login">Entrar</Link>
            <a href="mailto:claudia@aurora.com.br">Contato</a>
            <a href={AURORA_WHATSAPP} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </FooterCol>

          <FooterCol title="Acompanhe">
            <a href="#" rel="noopener noreferrer">
              Instagram
            </a>
            <a href="#" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href="#" rel="noopener noreferrer">
              Blog
            </a>
          </FooterCol>
        </div>

        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-7"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.3px" }}>
            © Aurora Gestão Financeira 2026 · CNPJ {/* {{CNPJ}} */}00.000.000/0001-00
          </div>
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.3px" }}>
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
          color: rgba(255,255,255,0.65);
          transition: color 0.15s;
        }
        footer a:hover { color: #fff; }
      `}</style>
    </div>
  );
}
