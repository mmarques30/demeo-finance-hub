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
import { PipelinePreview } from "@/components/landing/PipelinePreview";
import { DFCPreview } from "@/components/landing/DFCPreview";
import { PortalPreview } from "@/components/landing/PortalPreview";
import { Deliverables } from "@/components/landing/Deliverables";
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--linen2)" }}>
      {/* Ambient blobs no topo do site */}
      <div aria-hidden className="aurora-blob aurora-blob--sage" style={{ width: 720, height: 720, left: "-15%", top: "-10%" }} />
      <div aria-hidden className="aurora-blob aurora-blob--tan" style={{ width: 600, height: 600, right: "-10%", top: "5%" }} />

      {/* NAV */}
      <nav
        className="fixed top-4 left-4 right-4 lg:left-8 lg:right-8 z-50 flex items-center justify-between transition-all"
        style={{
          background: scrolled ? "rgba(253,249,244,0.78)" : "rgba(253,249,244,0.55)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          border: "1px solid rgba(74,103,65,0.08)",
          borderRadius: 999,
          padding: "10px 14px 10px 22px",
          boxShadow: scrolled
            ? "0 12px 32px -16px rgba(74,103,65,0.18), 0 1px 0 rgba(255,255,255,0.6) inset"
            : "0 1px 0 rgba(255,255,255,0.5) inset",
        }}
      >
        <Link to="/" className="inline-flex items-center gap-2.5" style={{ color: "var(--green)" }}>
          <LogoMark size={22} />
          <span className="aurora-serif text-[18px]" style={{ color: "var(--foreground)", fontWeight: 500 }}>
            Aurora
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="aurora-link">
              {n.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-2 text-[10px] uppercase transition-all"
            style={{
              color: "var(--green)",
              letterSpacing: "1.8px",
              fontWeight: 500,
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(74,103,65,0.18)",
              background: "rgba(255,255,255,0.6)",
            }}
          >
            Entrar
          </Link>
          <a
            href={AURORA_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase"
            style={{
              background: "linear-gradient(135deg, var(--green), var(--green2))",
              color: "#fff",
              letterSpacing: "1.8px",
              fontWeight: 500,
              padding: "10px 18px",
              borderRadius: 999,
              boxShadow: "0 8px 18px -8px rgba(74,103,65,0.5)",
            }}
          >
            Claudia →
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative px-6 lg:px-14 pt-[130px] pb-24 lg:pb-32">
        {/* Grid principal */}
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-20 items-start relative z-10 max-w-[1320px] mx-auto">
          {/* Coluna texto */}
          <Reveal>
            {/* Marcador compacto — substitui o masthead full-width que quebrava nas dobras */}
            <div className="inline-flex items-center gap-2.5 mb-7">
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--green)",
                }}
              />
              <span
                className="aurora-cap"
                style={{ color: "var(--green)", letterSpacing: "3.5px" }}
              >
                Em foco · Decisão com clareza
              </span>
            </div>

            {/* H1 contido, editorial */}
            <h1
              className="aurora-serif"
              style={{
                fontSize: "clamp(48px, 6vw, 88px)",
                lineHeight: 0.95,
                letterSpacing: "-2.5px",
                color: "var(--foreground)",
                maxWidth: 720,
              }}
            >
              Gestão <em className="italic" style={{ color: "var(--green)" }}>boutique</em>{" "}
              do caixa <em className="italic" style={{ color: "var(--green)" }}>da sua empresa.</em>
            </h1>

            {/* Tagline italic com rule editorial */}
            <div className="mt-8 flex items-start gap-5 max-w-xl">
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 3,
                  background: "linear-gradient(180deg, var(--green), var(--sage))",
                  borderRadius: 999,
                  alignSelf: "stretch",
                  minHeight: 60,
                }}
              />
              <div>
                <p
                  className="aurora-serif italic"
                  style={{
                    fontSize: "clamp(18px, 1.6vw, 22px)",
                    color: "var(--foreground)",
                    lineHeight: 1.5,
                    letterSpacing: "-0.3px",
                  }}
                >
                  "Clareza que envolve. Resultado que permanece."
                </p>
                <p
                  className="mt-4 text-[14px] lg:text-[15px]"
                  style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}
                >
                  Cuidamos do financeiro de ponta a ponta — extrato, DFC, projeção e portal — com tecnologia própria e atendimento humano. Para PMEs entre R$ 50 mil e R$ 1 milhão de faturamento mensal.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#contato" className="aurora-cta">
                Quero ver com clareza →
              </a>
              <a href="#sistema" className="aurora-cta--ghost">
                Ver o sistema por dentro
              </a>
            </div>

            {/* Editorial footer-bar com prova social */}
            <div
              className="mt-10 flex items-center gap-5 flex-wrap pt-6"
              style={{ borderTop: "1px solid rgba(74,103,65,0.08)" }}
            >
              <div className="flex -space-x-3">
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
                      border: "2.5px solid var(--linen2)",
                      boxShadow: "0 4px 10px -4px rgba(74,103,65,0.2)",
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
              <div className="text-[12px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--foreground)", fontWeight: 500 }}>+42 empresas</strong> sob gestão.{" "}
                <br className="hidden md:inline" />
                Atendimento por convite.
              </div>
            </div>
          </Reveal>

          <Reveal delay={150} y={36}>
            <div className="aurora-glow relative aurora-float" style={{ animationDelay: "1s" }}>
              <DashboardPreview />
              {/* Etiqueta glass solta */}
              <div
                className="aurora-card--glass absolute -bottom-8 -left-8 px-5 py-3.5 hidden md:block"
                style={{ animationDuration: "10s" }}
              >
                <div className="aurora-cap" style={{ color: "var(--sage)" }}>
                  Status do fechamento
                </div>
                <div className="mt-1.5 flex items-center gap-2.5">
                  <span
                    className="rounded-full aurora-pulse"
                    style={{ width: 10, height: 10, background: "var(--green)" }}
                  />
                  <span className="text-[13px]" style={{ fontWeight: 500 }}>
                    Abril · 96% completo
                  </span>
                </div>
              </div>
              {/* Tag dinheiro */}
              <div
                className="aurora-card--glass absolute -top-6 -right-6 px-5 py-3.5 hidden lg:block aurora-float"
                style={{ animationDelay: "2s" }}
              >
                <div className="aurora-cap" style={{ color: "var(--sage)" }}>
                  Próximos 30d
                </div>
                <div className="aurora-serif mt-1" style={{ fontSize: 22, color: "var(--green)" }}>
                  R$ 38.420
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* MARQUEE */}
      <div
        className="overflow-hidden py-4 relative z-10"
        style={{
          background: "linear-gradient(90deg, var(--green2), var(--green) 50%, var(--green2))",
        }}
      >
        <div className="flex gap-12 whitespace-nowrap" style={{ animation: "aurora-mq 30s linear infinite" }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12">
              {["EXTRATO", "DFC", "DRE", "PROJEÇÃO", "CLAREZA", "RESULTADO", "AURORA"].map((t, j) => (
                <span key={j} className="flex items-center gap-12">
                  <span className="text-[10px] uppercase" style={{ letterSpacing: "3.5px", color: "rgba(255,255,255,0.78)", fontWeight: 500 }}>
                    {t}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <style>{`@keyframes aurora-mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }`}</style>
      </div>

      {/* STATS BAND */}
      <section className="relative px-6 lg:px-14 py-14 max-w-[1320px] mx-auto">
        <StatsBand />
      </section>

      {/* DELIVERABLES — seção dark com proposta clara de entrega */}
      <section
        className="relative px-6 lg:px-14 py-24 lg:py-32 overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, #234C66 0%, var(--navy) 60%), var(--navy)",
        }}
      >
        <div
          aria-hidden
          className="aurora-blob aurora-blob--green"
          style={{ width: 600, height: 600, right: "-15%", top: "-10%", opacity: 0.35 }}
        />
        <div className="max-w-[1320px] mx-auto relative z-10">
          <Reveal>
            <Deliverables />
          </Reveal>
        </div>
      </section>

      {/* SISTEMA POR DENTRO — mockups realistas dos módulos */}
      <section id="sistema" className="relative px-6 lg:px-14 py-24 lg:py-32 max-w-[1320px] mx-auto">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <div>
              <div className="aurora-pill mb-5" style={{ background: "rgba(143,166,136,0.12)", color: "var(--sage)", borderColor: "rgba(143,166,136,0.2)" }}>
                ✦ Sistema por dentro
              </div>
              <h2
                className="aurora-serif"
                style={{ fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1, letterSpacing: "-2.5px" }}
              >
                Não é maquete.<br />
                <em className="italic" style={{ color: "var(--green)" }}>É o que você usa.</em>
              </h2>
            </div>
            <p className="max-w-md text-[15px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.9 }}>
              4 módulos integrados. Sidebar dark com seu cliente sempre acessível, canvas claro com seus números.
            </p>
          </div>
        </Reveal>

        {/* Bento de mockups: Dashboard grande + 3 menores */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <Reveal delay={80}>
            <div className="flex flex-col gap-4">
              <span className="aurora-cap" style={{ color: "var(--sage)" }}>
                01 · Operacional
              </span>
              <span className="aurora-serif text-[24px]" style={{ letterSpacing: "-0.5px" }}>
                Pipeline · CRM kanban
              </span>
              <PipelinePreview />
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div className="flex flex-col gap-4">
              <span className="aurora-cap" style={{ color: "var(--sage)" }}>
                02 · Relatório
              </span>
              <span className="aurora-serif text-[24px]" style={{ letterSpacing: "-0.5px" }}>
                DFC · Fluxo + drill-down
              </span>
              <DFCPreview />
            </div>
          </Reveal>
          <Reveal delay={240}>
            <div className="flex flex-col gap-4">
              <span className="aurora-cap" style={{ color: "var(--sage)" }}>
                03 · Visão do cliente
              </span>
              <span className="aurora-serif text-[24px]" style={{ letterSpacing: "-0.5px" }}>
                Portal · seu empresário vê
              </span>
              <PortalPreview />
            </div>
          </Reveal>
        </div>
      </section>

      {/* SOLUÇÃO — BENTO GRID */}
      <section id="solucao" className="px-6 lg:px-14 py-24 lg:py-32 max-w-[1320px] mx-auto relative">
        <div aria-hidden className="aurora-blob aurora-blob--sage" style={{ width: 500, height: 500, right: "-15%", top: 100 }} />

        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-6 mb-14 relative z-10">
            <div>
              <div className="aurora-pill mb-5" style={{ background: "rgba(143,166,136,0.12)", color: "var(--sage)", borderColor: "rgba(143,166,136,0.2)" }}>
                01 · Solução
              </div>
              <h2
                className="aurora-serif"
                style={{ fontSize: "clamp(40px, 5.5vw, 72px)", lineHeight: 1, letterSpacing: "-2.5px" }}
              >
                Uma única plataforma<br />
                <em className="italic" style={{ color: "var(--green)" }}>para o financeiro inteiro.</em>
              </h2>
            </div>
            <p className="max-w-md text-[15px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.9 }}>
              Da entrada do extrato à reunião de fechamento, tudo num lugar só. A Aurora é boutique no atendimento e robusta na engenharia.
            </p>
          </div>
        </Reveal>

        {/* Bento orgânico */}
        <Reveal delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-5 relative z-10">
            {/* Card grande à esquerda (navy escuro) */}
            <BentoCard span="md:col-span-4" tone="dark">
              <div className="aurora-cap mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>
                Importação
              </div>
              <h3 className="aurora-serif" style={{ fontSize: 42, color: "#fff", letterSpacing: "-1.5px", lineHeight: 1.05 }}>
                IA que entende <em className="italic" style={{ color: "var(--sage)" }}>seu extrato.</em>
              </h3>
              <p className="mt-4 text-[14px] max-w-md" style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.9 }}>
                Qualquer banco, qualquer formato. PDF, CSV, imagem. A Aurora lê, identifica recorrências e classifica. Você revisa.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-2.5">
                {["Itaú", "Bradesco", "Inter", "Nubank", "Santander", "BB"].map((b) => (
                  <div
                    key={b}
                    className="text-[11px] px-3 py-2.5 text-center"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.78)",
                      letterSpacing: "0.5px",
                      borderRadius: 999,
                    }}
                  >
                    {b}
                  </div>
                ))}
              </div>
            </BentoCard>

            <BentoCard span="md:col-span-2" tone="green">
              <div className="aurora-cap mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                DFC pronto
              </div>
              <div
                className="aurora-serif italic"
                style={{ fontSize: 54, color: "#fff", lineHeight: 1, letterSpacing: "-2px" }}
              >
                em 1<br />clique.
              </div>
              <p className="mt-5 text-[13px]" style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.75 }}>
                Comparativo mês a mês, por categoria, com export em PDF Aurora.
              </p>
            </BentoCard>

            <BentoCard span="md:col-span-2">
              <div className="aurora-cap mb-3" style={{ color: "var(--sage)" }}>
                Projeção
              </div>
              <div className="aurora-serif" style={{ fontSize: 34, color: "var(--green)", letterSpacing: "-1.2px", lineHeight: 1.05 }}>
                90 dias <em className="italic">à frente.</em>
              </div>
              <div className="mt-6 relative h-20">
                <svg viewBox="0 0 200 80" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="bento-line-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4A6741" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#4A6741" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,60 C30,46 60,52 90,32 C120,14 150,32 180,18 L200,12 L200,80 L0,80 Z"
                    fill="url(#bento-line-grad)"
                  />
                  <path
                    d="M0,60 C30,46 60,52 90,32 C120,14 150,32 180,18 L200,12"
                    fill="none"
                    stroke="var(--green)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </BentoCard>

            <BentoCard span="md:col-span-2">
              <div className="aurora-cap mb-3" style={{ color: "var(--sage)" }}>
                Portal cliente
              </div>
              <div className="aurora-serif" style={{ fontSize: 30, letterSpacing: "-1px", lineHeight: 1.1, color: "var(--foreground)" }}>
                Seu empresário<br /><em className="italic" style={{ color: "var(--green)" }}>vê em tempo real.</em>
              </div>
              <p className="mt-5 text-[13px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.75 }}>
                Saldo, despesas, contas previstas — pelo navegador, sem app pesado.
              </p>
            </BentoCard>

            <BentoCard span="md:col-span-2" tone="tan">
              <div className="aurora-cap mb-3" style={{ color: "rgba(255,255,255,0.75)" }}>
                Atendimento
              </div>
              <div
                className="aurora-serif italic"
                style={{ fontSize: 30, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1.2 }}
              >
                "Conversa direta<br />com a Claudia."
              </div>
              <p className="mt-5 text-[13px]" style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.75 }}>
                Sem ticket, sem suporte genérico. Aurora é boutique.
              </p>
            </BentoCard>
          </div>
        </Reveal>
      </section>

      {/* FEATURE TABS */}
      <section className="px-6 lg:px-14 py-24 relative" style={{ background: "linear-gradient(180deg, var(--linen2), var(--linen) 50%, var(--linen2))" }}>
        <div aria-hidden className="aurora-blob aurora-blob--green" style={{ width: 500, height: 500, left: "-10%", top: 0, opacity: 0.25 }} />
        <div className="max-w-[1320px] mx-auto relative z-10">
          <Reveal>
            <div className="aurora-pill mb-5" style={{ background: "rgba(143,166,136,0.12)", color: "var(--sage)", borderColor: "rgba(143,166,136,0.2)" }}>
              02 · Recursos
            </div>
            <h2
              className="aurora-serif mb-12"
              style={{ fontSize: "clamp(40px, 5.5vw, 64px)", lineHeight: 1, letterSpacing: "-2.5px" }}
            >
              Tudo que a Aurora <em className="italic" style={{ color: "var(--green)" }}>resolve por você</em>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <FeatureTabs />
          </Reveal>
        </div>
      </section>

      {/* MÉTODO — TIMELINE ORGÂNICO */}
      <section id="metodo" className="px-6 lg:px-14 py-24 lg:py-32 max-w-[1320px] mx-auto relative">
        <Reveal>
          <div className="aurora-pill mb-5" style={{ background: "rgba(143,166,136,0.12)", color: "var(--sage)", borderColor: "rgba(143,166,136,0.2)" }}>
            03 · Método
          </div>
          <h2
            className="aurora-serif mb-14"
            style={{ fontSize: "clamp(40px, 5.5vw, 64px)", lineHeight: 1, letterSpacing: "-2.5px" }}
          >
            3 passos para o seu <em className="italic" style={{ color: "var(--green)" }}>financeiro caminhar</em>
          </h2>
        </Reveal>

        <div className="relative grid md:grid-cols-3 gap-6">
          {/* Curva conectora */}
          <svg
            aria-hidden
            className="hidden md:block absolute"
            style={{ left: "10%", right: "10%", top: 36, height: 4, width: "80%" }}
            viewBox="0 0 800 4"
            preserveAspectRatio="none"
          >
            <path d="M0,2 Q400,-12 800,2" stroke="rgba(74,103,65,0.18)" strokeWidth="1.5" fill="none" strokeDasharray="6 8" />
          </svg>

          {[
            { n: "01", t: "Entender", d: "Mergulhamos no seu extrato e na sua história. Escutamos antes de classificar." },
            { n: "02", t: "Organizar", d: "Categorias, recorrências, fechamento mensal. Uma estrutura que fala a sua língua." },
            { n: "03", t: "Projetar", d: "DFC e projeção de 90 dias. Você decide antes do problema chegar." },
          ].map((b, i) => (
            <Reveal key={b.n} delay={i * 150}>
              <div className="flex flex-col items-start">
                <span
                  className="relative aurora-serif inline-flex items-center justify-center mb-7"
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #FFFFFF, var(--linen))",
                    border: "1px solid rgba(74,103,65,0.12)",
                    color: "var(--green)",
                    fontSize: 26,
                    letterSpacing: "-0.5px",
                    boxShadow: "0 10px 28px -12px rgba(74,103,65,0.28), inset 0 1px 0 rgba(255,255,255,0.8)",
                  }}
                >
                  {b.n}
                </span>
                <div className="aurora-serif text-[36px]" style={{ color: "var(--green)", letterSpacing: "-1.2px" }}>
                  {b.t}
                </div>
                <p
                  className="mt-3 text-[14px] max-w-xs"
                  style={{ color: "var(--muted-foreground)", lineHeight: 1.9 }}
                >
                  {b.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="px-6 lg:px-14 py-24 relative" style={{ background: "linear-gradient(180deg, var(--linen2), var(--linen))" }}>
        <div aria-hidden className="aurora-blob aurora-blob--tan" style={{ width: 600, height: 600, right: "-15%", top: 100 }} />
        <div className="max-w-[1320px] mx-auto relative z-10">
          <Reveal>
            <div className="flex items-end justify-between flex-wrap gap-6 mb-14">
              <div>
                <div className="aurora-pill mb-5" style={{ background: "rgba(143,166,136,0.12)", color: "var(--sage)", borderColor: "rgba(143,166,136,0.2)" }}>
                  04 · Planos
                </div>
                <h2
                  className="aurora-serif"
                  style={{ fontSize: "clamp(40px, 5.5vw, 64px)", lineHeight: 1, letterSpacing: "-2.5px" }}
                >
                  Investimento <em className="italic" style={{ color: "var(--green)" }}>transparente.</em>
                </h2>
              </div>
              <p className="max-w-md text-[15px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.9 }}>
                Sem fidelidade, sem letra miúda. Você ajusta o plano à medida que a empresa cresce.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {services.map((s, i) => (
                <div
                  key={s.id}
                  className="relative p-7 flex flex-col gap-4 transition-all hover:-translate-y-2"
                  style={{
                    background: i === 0
                      ? "linear-gradient(180deg, #FFFFFF, var(--linen2))"
                      : "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${i === 0 ? "rgba(74,103,65,0.2)" : "rgba(74,103,65,0.06)"}`,
                    borderRadius: 26,
                    boxShadow: i === 0
                      ? "0 1px 2px rgba(27,57,77,0.04), 0 30px 56px -28px rgba(74,103,65,0.32)"
                      : "0 1px 2px rgba(27,57,77,0.03), 0 12px 28px -16px rgba(74,103,65,0.14)",
                  }}
                >
                  {i === 0 && (
                    <span
                      className="self-start text-[9px] uppercase px-3 py-1.5"
                      style={{
                        letterSpacing: "2px",
                        background: "linear-gradient(135deg, var(--green), var(--green2))",
                        color: "#fff",
                        fontWeight: 500,
                        borderRadius: 999,
                        boxShadow: "0 6px 14px -6px rgba(74,103,65,0.5)",
                      }}
                    >
                      Recomendado
                    </span>
                  )}
                  <div className="aurora-serif text-[24px]" style={{ lineHeight: 1.15, color: "var(--foreground)" }}>
                    {s.name}
                  </div>
                  <div className="aurora-cap" style={{ color: "var(--sage)" }}>
                    A partir de
                  </div>
                  <div
                    className="aurora-serif flex items-baseline gap-2"
                    style={{ color: "var(--green)", lineHeight: 1 }}
                  >
                    <span style={{ fontSize: 46, letterSpacing: "-1.8px" }}>{brl(s.base_price)}</span>
                    <span className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                      {UNIT_LABEL[s.unit] ?? ""}
                    </span>
                  </div>
                  <a
                    href="#contato"
                    className="mt-3 text-[10px] uppercase py-3 text-center transition-all"
                    style={{
                      background: i === 0
                        ? "linear-gradient(135deg, var(--green), var(--green2))"
                        : "transparent",
                      color: i === 0 ? "#fff" : "var(--green)",
                      letterSpacing: "2.5px",
                      fontWeight: 500,
                      border: `1px solid ${i === 0 ? "transparent" : "var(--green)"}`,
                      borderRadius: 999,
                      boxShadow: i === 0 ? "0 8px 18px -8px rgba(74,103,65,0.5)" : "none",
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
          <div className="aurora-pill mb-5" style={{ background: "rgba(143,166,136,0.12)", color: "var(--sage)", borderColor: "rgba(143,166,136,0.2)" }}>
            05 · Depoimentos
          </div>
          <h2
            className="aurora-serif mb-12"
            style={{ fontSize: "clamp(40px, 5.5vw, 64px)", lineHeight: 1, letterSpacing: "-2.5px" }}
          >
            O que <em className="italic" style={{ color: "var(--green)" }}>dizem por aí.</em>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <Testimonials />
        </Reveal>
      </section>

      {/* QUEM SOU — fundo navy com gradiente */}
      <section
        id="quem-sou"
        className="px-6 lg:px-14 py-24 lg:py-32 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(80% 100% at 30% 0%, #234C66 0%, var(--navy) 60%), var(--navy)",
          color: "#fff",
        }}
      >
        <div aria-hidden className="aurora-blob aurora-blob--green" style={{ width: 500, height: 500, right: "-10%", top: "-10%", opacity: 0.3 }} />
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-14 items-center relative z-10">
          <Reveal>
            <div
              className="aspect-[4/5] max-w-[440px] overflow-hidden mx-auto lg:mx-0"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 28,
                boxShadow: "0 40px 80px -32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <img
                src="/claudia.jpg"
                alt="Claudia, fundadora da Aurora"
                className="w-full h-full object-cover"
                style={{ borderRadius: 27 }}
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = "none";
                  if (el.parentElement) {
                    el.parentElement.innerHTML = `
                      <div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:128px;color:rgba(255,255,255,0.16);">
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
              <div className="aurora-pill mb-5" style={{ background: "rgba(143,166,136,0.18)", color: "var(--sage)", borderColor: "rgba(143,166,136,0.28)" }}>
                06 · Quem está por trás
              </div>
              <h2
                className="aurora-serif"
                style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1, letterSpacing: "-2.5px" }}
              >
                Oi, sou a <em className="italic" style={{ color: "var(--sage)" }}>Claudia.</em>
              </h2>
              <p className="mt-7 text-[15px]" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.95, maxWidth: 540 }}>
                {`{{HISTORIA_CLAUDIA}}`}
              </p>
              <p className="mt-4 text-[15px]" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.95, maxWidth: 540 }}>
                Fundei a Aurora para fazer o que sempre fiz com os negócios que admirei: organizar o financeiro com calma, ler o que os números querem dizer — e devolver decisões claras pro empresário. Você não vai precisar fingir que entende.
              </p>
              <div className="mt-9 flex gap-2.5 flex-wrap">
                {["+5 anos com PMEs", "Boutique, sob convite", "Atendimento direto"].map((t) => (
                  <span
                    key={t}
                    className="text-[10px] uppercase px-4 py-2.5"
                    style={{
                      letterSpacing: "2px",
                      color: "rgba(255,255,255,0.85)",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      fontWeight: 500,
                      borderRadius: 999,
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
      <section className="px-6 lg:px-14 py-24 lg:py-32 max-w-[1320px] mx-auto relative">
        <Reveal>
          <div className="text-center mb-14">
            <div
              className="aurora-pill mb-5 inline-flex"
              style={{ background: "rgba(143,166,136,0.12)", color: "var(--sage)", borderColor: "rgba(143,166,136,0.2)" }}
            >
              07 · Dúvidas
            </div>
            <h2
              className="aurora-serif"
              style={{ fontSize: "clamp(40px, 5.5vw, 64px)", lineHeight: 1, letterSpacing: "-2.5px" }}
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
        style={{
          background:
            "radial-gradient(80% 100% at 70% 0%, #5A7752 0%, var(--green) 60%), var(--green)",
        }}
      >
        <div
          aria-hidden
          className="absolute pointer-events-none select-none aurora-float"
          style={{
            left: -120,
            bottom: -80,
            color: "rgba(255,255,255,0.06)",
            transform: "scale(8)",
            transformOrigin: "bottom left",
          }}
        >
          <LogoMark size={160} />
        </div>
        <div className="max-w-[1320px] mx-auto relative z-10 grid lg:grid-cols-[1fr_560px] gap-14 items-start">
          <Reveal>
            <div
              className="aurora-pill mb-5"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}
            >
              08 · Contato
            </div>
            <h2
              className="aurora-serif"
              style={{ fontSize: "clamp(44px, 6vw, 84px)", lineHeight: 1, letterSpacing: "-3px", color: "#fff" }}
            >
              Vamos <em className="italic" style={{ color: "var(--linen)" }}>conversar?</em>
            </h2>
            <p
              className="mt-7 text-[16px]"
              style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.9, maxWidth: 480 }}
            >
              Conta brevemente sua situação. A Claudia responde em até 1 dia útil. Se preferir, chame agora pelo WhatsApp.
            </p>
            <a
              href={AURORA_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-3 px-7 py-4 text-[10px] uppercase transition-all hover:-translate-y-1"
              style={{
                background: "#fff",
                color: "var(--green)",
                letterSpacing: "2.5px",
                fontWeight: 500,
                borderRadius: 999,
                boxShadow: "0 14px 32px -16px rgba(0,0,0,0.4)",
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
      <footer
        className="px-6 lg:px-14 pt-16 pb-8 relative"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, #1E4153 0%, var(--navy) 70%), var(--navy)",
          color: "#fff",
        }}
      >
        <div className="max-w-[1320px] mx-auto grid md:grid-cols-4 gap-10 mb-14 relative z-10">
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
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-7 max-w-[1320px] mx-auto"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="aurora-serif italic" style={{ color: "rgba(255,255,255,0.6)", fontSize: 17 }}>
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
    tone === "dark"
      ? "radial-gradient(120% 100% at 0% 0%, #234C66, var(--navy) 70%)"
      : tone === "green"
      ? "linear-gradient(135deg, var(--green), var(--green2))"
      : tone === "tan"
      ? "linear-gradient(135deg, #C9A57E, var(--tan))"
      : "linear-gradient(135deg, #FFFFFF, var(--linen2))";
  const shadowTone =
    tone === "dark"
      ? "0 1px 2px rgba(0,0,0,0.1), 0 40px 80px -32px rgba(27,57,77,0.5)"
      : tone === "green"
      ? "0 1px 2px rgba(0,0,0,0.05), 0 32px 64px -28px rgba(74,103,65,0.45)"
      : tone === "tan"
      ? "0 1px 2px rgba(0,0,0,0.05), 0 32px 64px -28px rgba(184,149,106,0.35)"
      : "0 1px 2px rgba(27,57,77,0.03), 0 24px 56px -28px rgba(74,103,65,0.18)";
  return (
    <div
      className={`${span} p-8 lg:p-10 relative overflow-hidden transition-all hover:-translate-y-2`}
      style={{
        background: bg,
        border: `1px solid ${tone === "light" ? "rgba(74,103,65,0.06)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 28,
        minHeight: 260,
        boxShadow: shadowTone,
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
        {Array.isArray(children) ? children : [children]}
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
