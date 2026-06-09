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
      { title: "Aurora · Gestora Financeira para empresas que crescem" },
      {
        name: "description",
        content:
          "Gestão financeira para empresas que querem enxergar o próprio crescimento. A Aurora cuida do extrato, fecha o DFC e te entrega clareza para decidir.",
      },
      { property: "og:title", content: "Aurora · Gestora Financeira" },
      {
        property: "og:description",
        content:
          "Clareza que ilumina. Resultado que permanece. Gestora financeira para PMEs.",
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
    <div className="min-h-screen" style={{ background: "#FFFFFF", color: "#1C2D45" }}>
      <a href="#hero" className="skip-link focus-ring">
        Pular para o conteúdo
      </a>

      {/* NAV v3 — clean clinical, branco com backdrop blur */}
      <nav
        aria-label="Navegação principal"
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled
            ? "rgba(255,255,255,0.94)"
            : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: scrolled
            ? "1px solid rgba(28,45,69,0.08)"
            : "1px solid transparent",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <div
          className="px-6 lg:px-14 flex items-center justify-between"
          style={{ height: 64 }}
        >
          <Link
            to="/"
            aria-label="Aurora · página inicial"
            className="inline-flex items-center gap-2.5 focus-ring"
            style={{ color: "#284C2B" }}
          >
            <LogoMark size={18} />
            <span
              className="aurora-serif"
              style={{
                color: "#1C2D45",
                fontSize: 17,
                fontWeight: 400,
                letterSpacing: "-0.3px",
              }}
            >
              Aurora
            </span>
          </Link>

          <ul className="hidden lg:flex items-center gap-0">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="focus-ring"
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: "rgba(28,45,69,0.5)",
                    padding: "6px 14px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#284C2B")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(28,45,69,0.5)")
                  }
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden sm:inline-flex focus-ring"
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "rgba(28,45,69,0.5)",
                padding: "8px 14px",
              }}
            >
              Entrar
            </Link>
            <a
              href="#contato"
              className="focus-ring inline-flex items-center gap-2"
              style={{
                background: "#284C2B",
                color: "#fff",
                fontSize: 12,
                fontWeight: 500,
                padding: "10px 18px",
                borderRadius: 4,
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

        <div id="casos" />
        <CaseStudies />

        <ClaudiaSection />
        <ServicesList />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>

      {/* FOOTER v3 — ink #1C2D45 */}
      <footer
        className="px-6 lg:px-16 pt-16 pb-8"
        style={{ background: "#1C2D45", color: "#fff" }}
      >
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 mb-12">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2.5"
              style={{ color: "#99A989" }}
            >
              <LogoMark size={20} />
              <span
                className="aurora-serif"
                style={{ color: "#fff", fontSize: 22, fontWeight: 400 }}
              >
                Aurora
              </span>
            </Link>
            <p
              className="aurora-serif italic mt-5 max-w-xs"
              style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}
            >
              Clareza que ilumina. Resultado que permanece.
            </p>
            <p
              className="mt-6 max-w-xs"
              style={{
                fontSize: 12,
                fontWeight: 300,
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.7,
              }}
            >
              Gestão financeira para pequenas e médias empresas.
              <br />
              Atendimento por convite.
            </p>
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
            <a href="mailto:claudia@aurora.fin.br">Contato</a>
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
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
            © Aurora Gestão Financeira · Claudia De Meo · 2026
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            IAplicada Business
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
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#99A989",
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-2.5" style={{ fontSize: 13 }}>
        {children}
      </div>
      <style>{`
        footer a {
          color: rgba(255,255,255,0.6);
          transition: color 0.15s;
        }
        footer a:hover { color: #99A989; }
      `}</style>
    </div>
  );
}
