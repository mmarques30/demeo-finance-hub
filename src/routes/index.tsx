import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { HeroPC } from "@/components/landing/HeroPC";
import { ValueProp } from "@/components/landing/ValueProp";
import { Features } from "@/components/landing/Features";
import { Numbers } from "@/components/landing/Numbers";
import { ClaudiaSection } from "@/components/landing/ClaudiaSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { AURORA_WHATSAPP } from "@/lib/supabase";

const INK = "#1C2D45";
const SAGE = "#99A989";
const FOREST = "#284C2B";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Aurora · Gestora Financeira para empresas que crescem" },
      {
        name: "description",
        content:
          "A Aurora cuida do financeiro da sua empresa de ponta a ponta — extrato, DFC, projeção e portal — para você decidir com clareza.",
      },
      { property: "og:title", content: "Aurora · Gestora Financeira" },
      {
        property: "og:description",
        content: "Cada real da sua empresa, visível.",
      },
      { property: "og:image", content: "/brand/aurora-logo-primary.svg" },
    ],
  }),
});

const NAV = [
  { href: "#metodo", label: "Como funciona" },
  { href: "#quem", label: "Quem somos" },
  { href: "#resultados", label: "Casos" },
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
    <div className="min-h-screen" style={{ background: "#FFFFFF", color: INK }}>
      <a href="#hero" className="skip-link focus-ring">
        Pular para o conteúdo
      </a>

      {/* NAV — clean white nextsense-style */}
      <nav
        aria-label="Navegação principal"
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled
            ? "rgba(255,255,255,0.96)"
            : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: scrolled
            ? "1px solid rgba(28,45,69,0.08)"
            : "1px solid transparent",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <div
          className="px-6 lg:px-14 flex items-center justify-between max-w-[1320px] mx-auto"
          style={{ height: 72 }}
        >
          <Link
            to="/"
            aria-label="Aurora · página inicial"
            className="inline-flex items-center gap-2.5 focus-ring"
            style={{ color: FOREST }}
          >
            <LogoMark size={20} />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: INK,
                fontSize: 20,
                fontWeight: 400,
                letterSpacing: "-0.3px",
              }}
            >
              Aurora
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="focus-ring"
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: "rgba(28,45,69,0.65)",
                    padding: "6px 0",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = FOREST)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(28,45,69,0.65)")
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
                fontSize: 14,
                fontWeight: 400,
                color: "rgba(28,45,69,0.65)",
                padding: "8px 14px",
              }}
            >
              Entrar
            </Link>
            <a
              href="#contato"
              className="focus-ring inline-flex items-center gap-2"
              style={{
                background: FOREST,
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                padding: "11px 22px",
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
        <Features />
        <Numbers />
        <ClaudiaSection />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>

      {/* FOOTER ink minimal nextsense-style */}
      <footer
        className="px-6 lg:px-14 pt-16 pb-8"
        style={{ background: INK, color: "#fff" }}
      >
        <div className="max-w-[1280px] mx-auto">
          <div className="grid lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2.5"
                style={{ color: SAGE }}
              >
                <LogoMark size={22} />
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: "#fff",
                    fontSize: 24,
                    fontWeight: 400,
                  }}
                >
                  Aurora
                </span>
              </Link>
              <p
                className="mt-5 max-w-xs"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: 18,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.5,
                }}
              >
                Cada real da sua empresa, visível.
              </p>
              <p
                className="mt-6 max-w-xs"
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: 1.7,
                }}
              >
                Gestora financeira para pequenas e médias empresas. Atendimento por convite.
              </p>
            </div>

            <FooterCol title="Solução">
              <a href="#metodo">Como funciona</a>
              <a href="#resultados">Casos</a>
              <a href="#faq">Dúvidas</a>
            </FooterCol>

            <FooterCol title="Aurora">
              <a href="#quem">Quem somos</a>
              <Link to="/login">Entrar</Link>
              <a href="mailto:claudia@aurora.fin.br">claudia@aurora.fin.br</a>
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
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
              © Aurora Gestão Financeira · Claudia De Meo · 2026
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              IAplicada Business
            </div>
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
          fontWeight: 600,
          color: SAGE,
          marginBottom: 16,
          letterSpacing: "1.5px",
        }}
      >
        {title.toUpperCase()}
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
