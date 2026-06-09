import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { LeadForm } from "@/components/LeadForm";
import { Reveal } from "@/components/landing/Reveal";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { StatsBand } from "@/components/landing/StatsBand";
import { FeatureTabs } from "@/components/landing/FeatureTabs";
import { Faq } from "@/components/landing/Faq";
import { Testimonials } from "@/components/landing/Testimonials";
import { supabase, AURORA_WHATSAPP } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Aurora · Gestão Financeira para Empresas" },
      { name: "description", content: "Clareza que envolve. Resultado que permanece. A Aurora cuida do financeiro da sua empresa de ponta a ponta — extrato, DFC, projeção e portal — com tecnologia própria e atendimento humano." },
      { property: "og:title", content: "Aurora · Gestão Financeira para Empresas" },
      { property: "og:description", content: "Plataforma boutique de gestão financeira para PMEs." },
      { property: "og:image", content: "/brand/aurora-logo-primary.svg" },
    ],
  }),
});

const NAV = [
  { href: "#solucao", label: "Solução" },
  { href: "#metodo", label: "Método" },
  { href: "#planos", label: "Planos" },
  { href: "#quem-sou", label: "Quem sou" },
  { href: "#contato", label: "Contato" },
];

type Service = { id: string; name: string; unit: string; base_price: number };

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

const UNIT_LABEL: Record<string, string> = { mensal: "/ mês", projeto: "· projeto", horas: "/ hora" };

function useServices() {
  return useQuery({
    queryKey: ["public", "services"],
    queryFn: async (): Promise<Service[]> => {
      try {
        const { data } = await supabase()
          .from("services")
          .select("id, name, unit, base_price")
          .eq("is_active", true)
          .order("base_price", { ascending: false });
        return (data ?? []) as Service[];
      } catch {
        return [
          { id: "1", name: "Fechamento Mensal Completo", unit: "mensal", base_price: 1800 },
          { id: "2", name: "Implantação Inicial", unit: "projeto", base_price: 2500 },
          { id: "3", name: "DFC Semanal", unit: "mensal", base_price: 900 },
          { id: "4", name: "Consultoria Pontual", unit: "horas", base_price: 350 },
        ];
      }
    },
    staleTime: 5 * 60_000,
  });
}

function useScrolled(threshold = 16) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const fn = () => setS(window.scrollY > threshold);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return s;
}

function Landing() {
  const { data: services = [] } = useServices();
  const scrolled = useScrolled();

  return (
    <div className="min-h-screen" style={{ background: "var(--linen2)" }}>
      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-14 py-3.5 transition-all"
        style={{
          background: scrolled ? "rgba(253,249,244,0.85)" : "rgba(253,249,244,0)",
          backdropFilter: scrolled ? "blur(18px)" : "blur(0)",
          borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
        }}
      >
        <Link to="/" className="inline-flex items-center gap-2.5" style={{ color: "var(--green)" }}>
          <LogoMark size={22} />
          <span className="aurora-serif text-[18px]" style={{ color: "var(--foreground)", fontWeight: 500 }}>
            Aurora
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-7">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="aurora-link">
              {n.label}
            </a>
          ))}
        </div>
        <a
          href={AURORA_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] uppercase px-4 py-2.5"
          style={{ background: "var(--green)", color: "#fff", letterSpacing: "2px", fontWeight: 500 }}
        >
          Falar com a Claudia →
        </a>
      </nav>

      {/* HERO */}
      <section className="relative px-6 lg:px-14 pt-[140px] pb-20 lg:pb-32 overflow-hidden">
        {/* Marca d'água gigante */}
        <div
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            right: -120,
            top: -80,
            color: "rgba(74,103,65,0.05)",
            transform: "scale(7) rotate(-12deg)",
            transformOrigin: "top right",
          }}
        >
          <LogoMark size={140} />
        </div>

        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-16 items-center relative z-10 max-w-[1320px] mx-auto">
          <Reveal>
            <div className="aurora-cap mb-6 flex items-center gap-3">
              <span className="inline-block w-7 h-px" style={{ background: "var(--sage)" }} />
              <span style={{ color: "var(--sage)" }}>Gestão financeira boutique · 2026</span>
            </div>
            <h1
              className="aurora-serif"
              style={{ fontSize: "clamp(52px, 8vw, 116px)", lineHeight: 0.92, letterSpacing: "-3.5px" }}
            >
              Clareza<br />
              <em className="italic" style={{ color: "var(--green)" }}>que envolve.</em>
              <br />
              <span style={{ color: "var(--muted-foreground)" }}>Resultado</span>{" "}
              <em className="italic" style={{ color: "var(--green)" }}>que permanece.</em>
            </h1>
            <p
              className="mt-7 text-[15px] lg:text-[17px] max-w-xl"
              style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}
            >
              A Aurora cuida do financeiro da sua empresa de ponta a ponta — extrato, DFC, projeção e portal do cliente — com tecnologia própria e atendimento humano boutique. Sem planilha, sem dúvida, sem improviso.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#contato" className="aurora-cta">
                Quero ver com clareza →
              </a>
              <a href="#solucao" className="aurora-cta--ghost">
                Conhecer o método
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6 flex-wrap">
              <div className="flex -space-x-2">
                {["M", "H", "A", "R"].map((l, i) => (
                  <span
                    key={l}
                    className="inline-flex items-center justify-center aurora-serif italic"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      background: ["var(--linen)", "var(--sage)", "var(--tan2)", "var(--linen)"][i],
                      color: "var(--green)",
                      fontSize: 14,
                      border: "2px solid var(--linen2)",
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--foreground)", fontWeight: 500 }}>+42 empresas</strong> sob gestão.{" "}
                <br className="hidden md:inline" />
                Atendimento por convite.
              </div>
            </div>
          </Reveal>

          <Reveal delay={150} y={32}>
            <div className="aurora-glow relative">
              <DashboardPreview />
              {/* Etiqueta solta */}
              <div
                className="absolute -bottom-6 -left-6 px-4 py-3 hidden md:block"
                style={{
                  background: "#fff",
                  border: "1px solid var(--line)",
                  boxShadow: "0 12px 32px -16px rgba(27,57,77,0.18)",
                  borderRadius: 10,
                }}
              >
                <div className="aurora-cap" style={{ color: "var(--sage)" }}>
                  Status do fechamento
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="rounded-full"
                    style={{ width: 8, height: 8, background: "var(--green)" }}
                  />
                  <span className="text-[12px]" style={{ fontWeight: 500 }}>
                    Abril · 96% completo
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden py-3" style={{ background: "var(--green)" }}>
        <div className="flex gap-12 whitespace-nowrap" style={{ animation: "aurora-mq 28s linear infinite" }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12">
              {["EXTRATO", "DFC", "DRE", "PROJEÇÃO", "CLAREZA", "RESULTADO", "AURORA"].map((t, j) => (
                <span key={j} className="flex items-center gap-12">
                  <span className="text-[10px] uppercase" style={{ letterSpacing: "3px", color: "rgba(255,255,255,0.72)", fontWeight: 500 }}>
                    {t}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <style>{`@keyframes aurora-mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }`}</style>
      </div>

      {/* STATS BAND */}
      <section className="relative">
        <StatsBand />
      </section>

      {/* SOLUÇÃO — BENTO GRID */}
      <section id="solucao" className="px-6 lg:px-14 py-24 lg:py-32 max-w-[1320px] mx-auto">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-6 mb-14">
            <div>
              <div className="aurora-cap mb-3" style={{ color: "var(--sage)" }}>
                [ 01 ] — Solução
              </div>
              <h2
                className="aurora-serif"
                style={{ fontSize: "clamp(36px, 5vw, 68px)", lineHeight: 1, letterSpacing: "-2px" }}
              >
                Uma única plataforma<br />
                <em className="italic" style={{ color: "var(--green)" }}>para o financeiro inteiro.</em>
              </h2>
            </div>
            <p className="max-w-md text-[14px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}>
              Da entrada do extrato à reunião de fechamento, tudo num lugar só. A Aurora é boutique no atendimento e robusta na engenharia.
            </p>
          </div>
        </Reveal>

        {/* Bento grid */}
        <Reveal delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Card grande à esquerda */}
            <BentoCard span="md:col-span-4" tone="dark">
              <div className="aurora-cap mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                Importação
              </div>
              <h3 className="aurora-serif" style={{ fontSize: 36, color: "#fff", letterSpacing: "-1.2px", lineHeight: 1.05 }}>
                IA que entende <em className="italic" style={{ color: "var(--sage)" }}>seu extrato.</em>
              </h3>
              <p className="mt-3 text-[13px] max-w-md" style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.85 }}>
                Qualquer banco, qualquer formato. PDF, CSV, imagem. A Aurora lê, identifica recorrências e classifica. Você revisa.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {["Itaú", "Bradesco", "Inter", "Nubank", "Santander", "BB"].map((b) => (
                  <div
                    key={b}
                    className="text-[11px] px-3 py-2.5 text-center"
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.78)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {b}
                  </div>
                ))}
              </div>
            </BentoCard>

            <BentoCard span="md:col-span-2" tone="green">
              <div className="aurora-cap mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>
                DFC pronto
              </div>
              <div
                className="aurora-serif italic"
                style={{ fontSize: 48, color: "#fff", lineHeight: 1, letterSpacing: "-1.5px" }}
              >
                em 1<br />clique.
              </div>
              <p className="mt-4 text-[12px]" style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.7 }}>
                Comparativo mês a mês, por categoria, com export em PDF Aurora.
              </p>
            </BentoCard>

            <BentoCard span="md:col-span-2">
              <div className="aurora-cap mb-2" style={{ color: "var(--sage)" }}>
                Projeção
              </div>
              <div className="aurora-serif" style={{ fontSize: 32, color: "var(--green)", letterSpacing: "-1px", lineHeight: 1.05 }}>
                90 dias <em className="italic">à frente.</em>
              </div>
              <div className="mt-5 relative h-16">
                <svg viewBox="0 0 200 64" className="w-full h-full">
                  <defs>
                    <linearGradient id="aurora-line-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4A6741" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4A6741" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,48 C30,38 60,42 90,28 C120,14 150,30 180,18 L200,12 L200,64 L0,64 Z"
                    fill="url(#aurora-line-grad)"
                  />
                  <path
                    d="M0,48 C30,38 60,42 90,28 C120,14 150,30 180,18 L200,12"
                    fill="none"
                    stroke="var(--green)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </BentoCard>

            <BentoCard span="md:col-span-2">
              <div className="aurora-cap mb-2" style={{ color: "var(--sage)" }}>
                Portal cliente
              </div>
              <div className="aurora-serif" style={{ fontSize: 28, letterSpacing: "-0.8px", lineHeight: 1.1, color: "var(--foreground)" }}>
                Seu empresário<br /><em className="italic" style={{ color: "var(--green)" }}>vê em tempo real.</em>
              </div>
              <p className="mt-4 text-[12px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
                Saldo, despesas, contas previstas — pelo navegador, sem app pesado.
              </p>
            </BentoCard>

            <BentoCard span="md:col-span-2" tone="tan">
              <div className="aurora-cap mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                Atendimento
              </div>
              <div
                className="aurora-serif italic"
                style={{ fontSize: 28, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.2 }}
              >
                "Conversa direta<br />com a Claudia."
              </div>
              <p className="mt-4 text-[12px]" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
                Sem ticket, sem suporte genérico. Aurora é boutique.
              </p>
            </BentoCard>
          </div>
        </Reveal>
      </section>

      {/* FEATURE TABS */}
      <section className="px-6 lg:px-14 py-24" style={{ background: "var(--linen)" }}>
        <div className="max-w-[1320px] mx-auto">
          <Reveal>
            <div className="aurora-cap mb-3" style={{ color: "var(--sage)" }}>
              [ 02 ] — Recursos
            </div>
            <h2
              className="aurora-serif mb-12"
              style={{ fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1, letterSpacing: "-2px" }}
            >
              Tudo que a Aurora <em className="italic" style={{ color: "var(--green)" }}>resolve por você</em>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <FeatureTabs />
          </Reveal>
        </div>
      </section>

      {/* MÉTODO — TIMELINE VERTICAL */}
      <section id="metodo" className="px-6 lg:px-14 py-24 lg:py-32 max-w-[1320px] mx-auto">
        <Reveal>
          <div className="aurora-cap mb-3" style={{ color: "var(--sage)" }}>
            [ 03 ] — Método
          </div>
          <h2
            className="aurora-serif mb-14"
            style={{ fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1, letterSpacing: "-2px" }}
          >
            3 passos para o seu <em className="italic" style={{ color: "var(--green)" }}>financeiro caminhar</em>
          </h2>
        </Reveal>

        <div className="relative grid md:grid-cols-3 gap-5">
          {/* Linha conectora desktop */}
          <div
            aria-hidden
            className="hidden md:block absolute"
            style={{
              left: "16%",
              right: "16%",
              top: 32,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, var(--line) 15%, var(--line) 85%, transparent)",
            }}
          />

          {[
            { n: "01", t: "Entender", d: "Mergulhamos no seu extrato e na sua história. Escutamos antes de classificar." },
            { n: "02", t: "Organizar", d: "Categorias, recorrências, fechamento mensal. Uma estrutura que fala a sua língua." },
            { n: "03", t: "Projetar", d: "DFC e projeção de 90 dias. Você decide antes do problema chegar." },
          ].map((b, i) => (
            <Reveal key={b.n} delay={i * 150}>
              <div className="flex flex-col items-start">
                <span
                  className="relative aurora-serif inline-flex items-center justify-center mb-6"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    background: "var(--linen)",
                    border: "1px solid var(--line)",
                    color: "var(--green)",
                    fontSize: 22,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {b.n}
                </span>
                <div className="aurora-serif text-[32px]" style={{ color: "var(--green)", letterSpacing: "-1px" }}>
                  {b.t}
                </div>
                <p
                  className="mt-3 text-[14px] max-w-xs"
                  style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}
                >
                  {b.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PLANOS / SERVIÇOS */}
      <section id="planos" className="px-6 lg:px-14 py-24" style={{ background: "var(--linen)" }}>
        <div className="max-w-[1320px] mx-auto">
          <Reveal>
            <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
              <div>
                <div className="aurora-cap mb-3" style={{ color: "var(--sage)" }}>
                  [ 04 ] — Planos
                </div>
                <h2
                  className="aurora-serif"
                  style={{ fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1, letterSpacing: "-2px" }}
                >
                  Investimento <em className="italic" style={{ color: "var(--green)" }}>transparente.</em>
                </h2>
              </div>
              <p className="max-w-md text-[14px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}>
                Sem fidelidade, sem letra miúda. Você ajusta o plano à medida que a empresa cresce.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((s, i) => (
                <div
                  key={s.id}
                  className="bg-white p-6 flex flex-col gap-4 transition-all hover:-translate-y-1"
                  style={{
                    border: `1px solid ${i === 0 ? "var(--green)" : "var(--line)"}`,
                    boxShadow: i === 0 ? "0 20px 40px -24px rgba(74,103,65,0.25)" : "none",
                  }}
                >
                  {i === 0 && (
                    <span
                      className="self-start text-[9px] uppercase px-2 py-0.5"
                      style={{
                        letterSpacing: "2px",
                        background: "var(--green)",
                        color: "#fff",
                        fontWeight: 500,
                      }}
                    >
                      Recomendado
                    </span>
                  )}
                  <div className="aurora-serif text-[22px]" style={{ lineHeight: 1.15, color: "var(--foreground)" }}>
                    {s.name}
                  </div>
                  <div className="aurora-cap" style={{ color: "var(--sage)" }}>
                    A partir de
                  </div>
                  <div
                    className="aurora-serif flex items-baseline gap-2"
                    style={{ color: "var(--green)", lineHeight: 1 }}
                  >
                    <span style={{ fontSize: 40, letterSpacing: "-1.5px" }}>{brl(s.base_price)}</span>
                    <span className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                      {UNIT_LABEL[s.unit] ?? ""}
                    </span>
                  </div>
                  <a
                    href="#contato"
                    className="mt-2 text-[10px] uppercase py-3 text-center"
                    style={{
                      background: i === 0 ? "var(--green)" : "transparent",
                      color: i === 0 ? "#fff" : "var(--green)",
                      letterSpacing: "2.5px",
                      fontWeight: 500,
                      border: `1px solid ${i === 0 ? "var(--green)" : "var(--green)"}`,
                    }}
                  >
                    Conversar →
                  </a>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="px-6 lg:px-14 py-24 lg:py-32 max-w-[1320px] mx-auto">
        <Reveal>
          <div className="aurora-cap mb-3" style={{ color: "var(--sage)" }}>
            [ 05 ] — Depoimentos
          </div>
          <h2
            className="aurora-serif mb-12"
            style={{ fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1, letterSpacing: "-2px" }}
          >
            O que <em className="italic" style={{ color: "var(--green)" }}>dizem por aí.</em>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <Testimonials />
        </Reveal>
      </section>

      {/* QUEM SOU */}
      <section id="quem-sou" className="px-6 lg:px-14 py-24" style={{ background: "var(--navy)", color: "#fff" }}>
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-14 items-center">
          <Reveal>
            <div
              className="aspect-[4/5] max-w-[440px] overflow-hidden mx-auto lg:mx-0"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <img
                src="/claudia.jpg"
                alt="Claudia, fundadora da Aurora"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = "none";
                  if (el.parentElement) {
                    el.parentElement.innerHTML = `
                      <div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:120px;color:rgba(255,255,255,0.15);">
                        Claudia
                      </div>
                    `;
                  }
                }}
              />
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div>
              <div className="aurora-cap mb-3" style={{ color: "var(--sage)" }}>
                [ 06 ] — Quem está por trás
              </div>
              <h2
                className="aurora-serif"
                style={{ fontSize: "clamp(36px, 4.5vw, 60px)", lineHeight: 1, letterSpacing: "-2px" }}
              >
                Oi, sou a <em className="italic" style={{ color: "var(--sage)" }}>Claudia.</em>
              </h2>
              <p className="mt-7 text-[15px]" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.9, maxWidth: 540 }}>
                {`{{HISTORIA_CLAUDIA}}`}
              </p>
              <p className="mt-4 text-[15px]" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.9, maxWidth: 540 }}>
                Fundei a Aurora para fazer o que sempre fiz com os negócios que admirei: organizar o financeiro com calma, ler o que os números querem dizer — e devolver decisões claras pro empresário. Você não vai precisar fingir que entende.
              </p>
              <div className="mt-8 flex gap-3 flex-wrap">
                {["+5 anos com PMEs", "Boutique, sob convite", "Atendimento direto"].map((t) => (
                  <span
                    key={t}
                    className="text-[10px] uppercase px-4 py-2.5"
                    style={{
                      letterSpacing: "2px",
                      color: "rgba(255,255,255,0.75)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      fontWeight: 500,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 lg:px-14 py-24 lg:py-32 max-w-[1320px] mx-auto">
        <Reveal>
          <div className="text-center mb-14">
            <div className="aurora-cap mb-3" style={{ color: "var(--sage)" }}>
              [ 07 ] — Dúvidas
            </div>
            <h2
              className="aurora-serif"
              style={{ fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1, letterSpacing: "-2px" }}
            >
              O que <em className="italic" style={{ color: "var(--green)" }}>perguntam por aqui.</em>
            </h2>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <Faq />
        </Reveal>
      </section>

      {/* CTA + LeadForm */}
      <section
        id="contato"
        className="px-6 lg:px-14 py-24 lg:py-32 relative overflow-hidden"
        style={{ background: "var(--green)" }}
      >
        <div
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            left: -100,
            bottom: -80,
            color: "rgba(255,255,255,0.05)",
            transform: "scale(8)",
            transformOrigin: "bottom left",
          }}
        >
          <LogoMark size={160} />
        </div>
        <div className="max-w-[1320px] mx-auto relative z-10 grid lg:grid-cols-[1fr_560px] gap-14 items-start">
          <Reveal>
            <div className="aurora-cap mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
              [ 08 ] — Contato
            </div>
            <h2
              className="aurora-serif"
              style={{ fontSize: "clamp(40px, 5.5vw, 76px)", lineHeight: 1, letterSpacing: "-2.5px", color: "#fff" }}
            >
              Vamos <em className="italic" style={{ color: "var(--linen)" }}>conversar?</em>
            </h2>
            <p
              className="mt-6 text-[15px]"
              style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.9, maxWidth: 480 }}
            >
              Conta brevemente sua situação. A Claudia responde em até 1 dia útil. Se preferir, chame agora pelo WhatsApp.
            </p>
            <a
              href={AURORA_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-3 px-7 py-4 text-[10px] uppercase"
              style={{
                background: "#fff",
                color: "var(--green)",
                letterSpacing: "2.5px",
                fontWeight: 500,
              }}
            >
              WhatsApp direto →
            </a>
          </Reveal>
          <Reveal delay={150}>
            <LeadForm />
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 lg:px-14 pt-16 pb-8" style={{ background: "var(--navy)", color: "#fff" }}>
        <div className="max-w-[1320px] mx-auto grid md:grid-cols-4 gap-10 mb-14">
          <div>
            <div className="inline-flex items-center gap-2.5" style={{ color: "#fff" }}>
              <LogoMark size={22} />
              <span className="aurora-serif text-[18px]" style={{ fontWeight: 500 }}>
                Aurora
              </span>
            </div>
            <p className="mt-4 text-[12px]" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.85, maxWidth: 280 }}>
              Gestora financeira boutique para pequenas e médias empresas. Sob convite.
            </p>
          </div>
          <FooterCol title="Plataforma">
            <a href="#solucao">Solução</a>
            <a href="#metodo">Método</a>
            <a href="#planos">Planos</a>
            <Link to="/login">Entrar</Link>
          </FooterCol>
          <FooterCol title="Empresa">
            <a href="#quem-sou">Quem sou</a>
            <a href={AURORA_WHATSAPP} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <a href="mailto:claudia@aurora.com.br">claudia@aurora.com.br</a>
          </FooterCol>
          <FooterCol title="Legal">
            <a href="#">Política de Privacidade</a>
            <a href="#">Termos de uso</a>
            <a href="#">LGPD</a>
          </FooterCol>
        </div>
        <div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-7"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="aurora-serif italic" style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>
            Clareza que envolve. Resultado que permanece.
          </div>
          <div className="text-[9px] uppercase" style={{ letterSpacing: "2px", color: "rgba(255,255,255,0.4)" }}>
            © Aurora Gestão Financeira 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

function BentoCard({
  children,
  span,
  tone = "light",
}: {
  children: React.ReactNode;
  span: string;
  tone?: "light" | "dark" | "green" | "tan";
}) {
  const bg =
    tone === "dark" ? "var(--navy)" : tone === "green" ? "var(--green)" : tone === "tan" ? "var(--tan)" : "#fff";
  return (
    <div
      className={`${span} p-7 lg:p-9 relative overflow-hidden transition-all hover:-translate-y-0.5`}
      style={{
        background: bg,
        border: `1px solid ${tone === "light" ? "var(--line)" : "transparent"}`,
        minHeight: 240,
      }}
    >
      {children}
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="aurora-cap mb-4" style={{ color: "var(--sage)" }}>
        {title}
      </div>
      <div className="flex flex-col gap-2.5 text-[12px]">
        {Array.isArray(children)
          ? children
          : [children]}
      </div>
      <style>{`
        footer a {
          color: rgba(255,255,255,0.7);
          transition: color 0.15s;
        }
        footer a:hover { color: #fff; }
      `}</style>
    </div>
  );
}
