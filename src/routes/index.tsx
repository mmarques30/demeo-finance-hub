import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogoMark } from "@/components/Logo";
import { LeadForm } from "@/components/LeadForm";
import { supabase, AURORA_WHATSAPP } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Aurora · Gestão Financeira para Empresas" },
      { name: "description", content: "Clareza que envolve. Resultado que permanece. A Aurora caminha junto com o empresário e ilumina o financeiro de dentro para fora." },
      { property: "og:title", content: "Aurora · Gestão Financeira para Empresas" },
      { property: "og:description", content: "Você sabe onde está cada real da sua empresa? A Aurora organiza, projeta e devolve o controle do caixa." },
      { property: "og:image", content: "/brand/aurora-logo-primary.svg" },
    ],
  }),
});

const NAV = [
  { href: "#metodo", label: "Método" },
  { href: "#servicos", label: "Serviços" },
  { href: "#quem-sou", label: "Quem sou" },
  { href: "#contato", label: "Contato" },
];

type Service = {
  id: string;
  name: string;
  description: string | null;
  unit: "mensal" | "projeto" | "horas";
  base_price: number;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

const UNIT_LABEL: Record<string, string> = {
  mensal: "/ mês",
  projeto: "· projeto",
  horas: "/ hora",
};

function useServices() {
  return useQuery({
    queryKey: ["public", "services"],
    queryFn: async (): Promise<Service[]> => {
      try {
        const { data, error } = await supabase()
          .from("services")
          .select("id, name, description, unit, base_price")
          .eq("is_active", true)
          .order("base_price", { ascending: false });
        if (error) throw error;
        return (data ?? []) as Service[];
      } catch {
        // Fallback offline: seeds do banco
        return [
          { id: "1", name: "Fechamento Mensal Completo", description: null, unit: "mensal", base_price: 1800 },
          { id: "2", name: "Implantação Inicial", description: null, unit: "projeto", base_price: 2500 },
          { id: "3", name: "DFC Semanal", description: null, unit: "mensal", base_price: 900 },
          { id: "4", name: "Consultoria Pontual", description: null, unit: "horas", base_price: 350 },
        ];
      }
    },
    staleTime: 5 * 60_000,
  });
}

function Landing() {
  const { data: services = [] } = useServices();

  return (
    <div className="min-h-screen" style={{ background: "var(--linen2)" }}>
      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 lg:px-14 py-4"
        style={{
          background: "rgba(247,241,232,0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--line)",
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
      <section className="relative pt-[160px] pb-24 px-8 lg:px-14 overflow-hidden">
        {/* Marca d'água símbolo Aurora (raios) gigante */}
        <div
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            right: "-80px",
            bottom: "-40px",
            color: "rgba(74,103,65,0.06)",
            transform: "scale(8)",
            transformOrigin: "bottom right",
          }}
        >
          <LogoMark size={120} />
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-end relative z-10 max-w-[1280px] mx-auto">
          <div>
            <div className="aurora-cap mb-6 flex items-center gap-3">
              <span className="block w-8 h-px" style={{ background: "var(--sage)" }} />
              Gestão financeira boutique
            </div>
            <h1 className="aurora-serif" style={{ fontSize: "clamp(56px, 8vw, 112px)", lineHeight: 0.95, letterSpacing: "-3px" }}>
              Clareza<br />
              <em className="italic" style={{ color: "var(--green)" }}>que envolve.</em>
              <br />
              Resultado<br />
              <em className="italic" style={{ color: "var(--green)" }}>que permanece.</em>
            </h1>
            <p className="mt-7 text-[15px] max-w-xl" style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}>
              Você sabe exatamente onde está cada real da sua empresa? A Aurora caminha junto com o empresário e ilumina o financeiro de dentro para fora.
            </p>
            <a
              href="#contato"
              className="mt-8 inline-flex items-center gap-3 px-7 py-4 text-[10px] uppercase"
              style={{ background: "var(--green)", color: "#fff", letterSpacing: "2.5px", fontWeight: 500 }}
            >
              Quero ver com clareza →
            </a>
          </div>

          <div className="pb-2">
            <div
              className="aurora-card p-8 flex flex-col gap-5"
              style={{ background: "#fff", border: "1px solid var(--line)" }}
            >
              {[
                { i: "01", t: "Clareza do extrato", d: "Cada lançamento entendido, classificado e revisado." },
                { i: "02", t: "Entendimento do resultado", d: "Saber o que sobra de fato — e por quê." },
                { i: "03", t: "Visão do futuro", d: "Projeção de 90 dias para decidir antes do problema." },
              ].map((b) => (
                <div key={b.i} className="flex gap-4 items-start">
                  <span
                    className="aurora-serif italic"
                    style={{ color: "var(--sage)", fontSize: 32, lineHeight: 1, letterSpacing: "-1px" }}
                  >
                    {b.i}
                  </span>
                  <div>
                    <div className="aurora-serif text-[18px]" style={{ color: "var(--foreground)" }}>
                      {b.t}
                    </div>
                    <div className="text-[12px] mt-1" style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
                      {b.d}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

      {/* MÉTODO */}
      <section id="metodo" className="px-8 lg:px-14 py-24 max-w-[1280px] mx-auto">
        <div className="aurora-cap mb-2" style={{ color: "var(--sage)" }}>[ Método ]</div>
        <h2 className="aurora-serif mb-12" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1, letterSpacing: "-2px" }}>
          3 passos para o seu <em className="italic" style={{ color: "var(--green)" }}>financeiro caminhar</em>
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: "01", t: "Entender", d: "Mergulhamos no seu extrato. Identificamos o que entra, o que sai e por quê. Você fala — a gente escuta." },
            { n: "02", t: "Organizar", d: "Categorias, recorrências, fechamento mensal. Tudo numa estrutura que faz sentido pro seu negócio." },
            { n: "03", t: "Projetar", d: "DFC e projeção de 90 dias. Você vê o que vem e decide antes — não depois." },
          ].map((b) => (
            <div key={b.n} className="aurora-card flex flex-col gap-4">
              <div className="aurora-serif italic" style={{ fontSize: 48, color: "var(--sage)", letterSpacing: "-2px", lineHeight: 1 }}>
                {b.n}
              </div>
              <div className="aurora-serif text-[26px]" style={{ color: "var(--green)" }}>
                {b.t}
              </div>
              <div className="text-[13px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}>
                {b.d}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="px-8 lg:px-14 py-24" style={{ background: "var(--linen)" }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="aurora-cap mb-2" style={{ color: "var(--sage)" }}>[ Serviços ]</div>
          <h2 className="aurora-serif mb-12" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1, letterSpacing: "-2px" }}>
            O que a Aurora <em className="italic" style={{ color: "var(--green)" }}>oferece</em>
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            {services.map((s) => (
              <div key={s.id} className="aurora-card flex items-start justify-between gap-6">
                <div>
                  <div className="aurora-serif text-[24px]" style={{ color: "var(--foreground)" }}>
                    {s.name}
                  </div>
                  {s.description && (
                    <p className="mt-2 text-[12px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
                      {s.description}
                    </p>
                  )}
                  <div className="aurora-cap mt-3" style={{ color: "var(--sage)" }}>
                    A partir de
                  </div>
                  <div
                    className="aurora-serif"
                    style={{ fontSize: 40, color: "var(--green)", lineHeight: 1, letterSpacing: "-1.5px" }}
                  >
                    {brl(s.base_price)}
                    <span className="text-[14px] ml-2" style={{ color: "var(--muted-foreground)" }}>
                      {UNIT_LABEL[s.unit]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUEM SOU */}
      <section id="quem-sou" className="px-8 lg:px-14 py-24 max-w-[1280px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div
              className="aspect-[4/5] max-w-[440px] overflow-hidden"
              style={{ background: "var(--linen)", border: "1px solid var(--line)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/claudia.jpg"
                alt="Claudia, fundadora da Aurora"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
          <div>
            <div className="aurora-cap mb-2" style={{ color: "var(--sage)" }}>[ Quem sou ]</div>
            <h2 className="aurora-serif mb-7" style={{ fontSize: "clamp(36px, 4vw, 56px)", lineHeight: 1, letterSpacing: "-2px" }}>
              Oi, sou a <em className="italic" style={{ color: "var(--green)" }}>Claudia</em>.
            </h2>
            <p className="text-[14px] mb-4" style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}>
              {`{{HISTORIA_CLAUDIA}}`}
            </p>
            <p className="text-[14px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}>
              Fundei a Aurora para fazer o que sempre fiz para os negócios que admirei: organizar o financeiro com calma, lendo o que os números querem dizer — e devolvendo decisões claras pro empresário.
            </p>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="px-8 lg:px-14 py-24" style={{ background: "var(--linen)" }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="aurora-cap mb-2" style={{ color: "var(--sage)" }}>[ Depoimentos ]</div>
          <h2 className="aurora-serif mb-12" style={{ fontSize: "clamp(32px, 4vw, 48px)", lineHeight: 1, letterSpacing: "-1.5px" }}>
            O que <em className="italic" style={{ color: "var(--green)" }}>dizem por aí</em>
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aurora-card flex flex-col gap-4">
                <span className="aurora-serif italic" style={{ fontSize: 64, color: "var(--sage)", lineHeight: 0.6 }}>
                  "
                </span>
                <p
                  className="aurora-serif italic text-[18px]"
                  style={{ color: "var(--foreground)", lineHeight: 1.6, letterSpacing: "-0.3px" }}
                >
                  {`{{DEPOIMENTOS}}`}
                </p>
                <div className="mt-auto pt-4" style={{ borderTop: "1px solid var(--line)" }}>
                  <div className="aurora-cap">Cliente Aurora</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="px-8 lg:px-14 py-24 max-w-[1280px] mx-auto">
        <div className="aurora-cap mb-2 text-center" style={{ color: "var(--sage)" }}>[ Contato ]</div>
        <h2
          className="aurora-serif mb-3 text-center"
          style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1, letterSpacing: "-2px" }}
        >
          Vamos <em className="italic" style={{ color: "var(--green)" }}>conversar</em>?
        </h2>
        <p className="text-center text-[14px] mb-10 max-w-xl mx-auto" style={{ color: "var(--muted-foreground)", lineHeight: 1.8 }}>
          Preencha o formulário ou chame no WhatsApp. A Claudia te responde em até 1 dia útil.
        </p>
        <LeadForm />
      </section>

      <footer className="px-8 lg:px-14 py-8 flex items-center justify-between" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="aurora-serif text-[15px]" style={{ color: "var(--muted-foreground)" }}>
          Clareza que envolve. Resultado que permanece.
        </div>
        <div className="text-[9px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>
          © Aurora Gestão Financeira 2026
        </div>
      </footer>
    </div>
  );
}
