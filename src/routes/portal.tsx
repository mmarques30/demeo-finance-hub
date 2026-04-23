import { createFileRoute, Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/Logo";
import { currentClient, transactionsByClient, brl } from "@/lib/mockData";

export const Route = createFileRoute("/portal")({
  component: PortalPage,
  head: () => ({ meta: [{ title: "Portal · De Meo" }] }),
});

function PortalPage() {
  const tx = transactionsByClient(currentClient.id);
  const receitas = tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const despesas = tx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const saldo = 48230.55;

  // Por categoria (apenas despesas)
  const desp = new Map<string, number>();
  tx.filter((t) => t.amount < 0).forEach((t) => {
    desp.set(t.category, (desp.get(t.category) ?? 0) + Math.abs(t.amount));
  });
  const despList = Array.from(desp.entries()).sort((a, b) => b[1] - a[1]);

  // Últimos 6 meses (mock)
  const meses = ["Nov", "Dez", "Jan", "Fev", "Mar", "Abr"];
  const valores = [38000, 41200, 37800, 44100, 39600, receitas];
  const max = Math.max(...valores);

  return (
    <div className="min-h-screen" style={{ background: "var(--linen)" }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-8 lg:px-14 py-5"
        style={{ background: "rgba(247,241,232,0.92)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line)" }}
      >
        <span className="inline-flex items-center gap-2.5" style={{ color: "var(--green)" }}>
          <LogoMark size={22} />
          <span className="dm-serif text-[18px]" style={{ color: "var(--foreground)", fontWeight: 500 }}>De Meo</span>
        </span>
        <div className="hidden md:flex items-center gap-5">
          <span className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            Olá, <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{currentClient.ownerName}</span>
          </span>
          <Link to="/login" className="dm-link">Sair</Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 lg:px-12 py-12 flex flex-col gap-8">
        <div>
          <div className="dm-cap mb-3">Portal · {currentClient.companyName}</div>
          <h1 className="dm-serif" style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 0.95, letterSpacing: "-2px" }}>
            Bem-vindo,<br /><em className="italic" style={{ color: "var(--green)" }}>{currentClient.ownerName.split(" ")[0]}.</em>
          </h1>
          <p className="mt-4 text-[13px] max-w-xl" style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}>
            Aqui estão os números da sua empresa atualizados pela equipe da De Meo.
          </p>
        </div>

        {/* Saldo grande */}
        <div className="dm-card p-10">
          <div className="dm-cap mb-3">Saldo atual consolidado</div>
          <div className="dm-serif" style={{ fontSize: "clamp(48px, 7vw, 88px)", color: "var(--navy)", lineHeight: 1, letterSpacing: "-2px" }}>
            {brl(saldo)}
          </div>
          <div className="text-[12px] mt-3" style={{ color: "var(--muted-foreground)" }}>
            Atualizado em 20/04/2026 · 14:22
          </div>
        </div>

        {/* Mes atual */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="dm-card">
            <div className="dm-cap mb-3">Receitas · Abril</div>
            <div className="dm-serif" style={{ fontSize: 44, color: "var(--green)", lineHeight: 1, letterSpacing: "-1.5px" }}>{brl(receitas)}</div>
          </div>
          <div className="dm-card">
            <div className="dm-cap mb-3">Despesas · Abril</div>
            <div className="dm-serif" style={{ fontSize: 44, color: "var(--tan)", lineHeight: 1, letterSpacing: "-1.5px" }}>{brl(despesas)}</div>
          </div>
        </div>

        {/* Evolução 6 meses */}
        <div className="dm-card">
          <div className="dm-cap mb-1">Evolução das receitas</div>
          <div className="dm-serif text-[22px] mb-6">Últimos <em className="italic" style={{ color: "var(--green)" }}>6 meses</em></div>
          <div className="grid grid-cols-6 gap-4 items-end h-[180px]">
            {meses.map((m, i) => (
              <div key={m} className="h-full flex flex-col justify-end items-center gap-2">
                <div
                  className="w-full"
                  style={{
                    height: `${(valores[i] / max) * 100}%`,
                    background: i === meses.length - 1 ? "var(--green)" : "var(--sage)",
                    opacity: i === meses.length - 1 ? 1 : 0.7,
                    borderRadius: "4px 4px 0 0",
                  }}
                />
                <div className="text-[10px] uppercase" style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)" }}>{m}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas categoria */}
        <div className="dm-card">
          <div className="dm-cap mb-1">Onde foi seu dinheiro</div>
          <div className="dm-serif text-[22px] mb-5">Despesas por <em className="italic" style={{ color: "var(--green)" }}>categoria</em></div>
          <div className="flex flex-col gap-3">
            {despList.map(([cat, val]) => (
              <div key={cat} className="flex items-center justify-between gap-4 pb-3" style={{ borderBottom: "1px solid var(--line)" }}>
                <div className="text-[13px]">{cat}</div>
                <div className="dm-serif text-[18px]" style={{ color: "var(--navy)" }}>{brl(val)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas contas */}
        <div className="dm-card">
          <div className="dm-cap mb-1">Próximos 30 dias</div>
          <div className="dm-serif text-[22px] mb-5">Contas <em className="italic" style={{ color: "var(--green)" }}>previstas</em></div>
          <div className="flex flex-col gap-3">
            {[
              { d: "25/04", n: "Aluguel ponto", v: -6800 },
              { d: "30/04", n: "Folha funcionários", v: -18400 },
              { d: "05/05", n: "Energia Enel", v: -1480 },
              { d: "10/05", n: "Contabilidade", v: -890 },
            ].map((p) => (
              <div key={p.n} className="flex items-center justify-between gap-4 pb-3" style={{ borderBottom: "1px solid var(--line)" }}>
                <div>
                  <div className="text-[13px]">{p.n}</div>
                  <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Vencimento {p.d}</div>
                </div>
                <div className="dm-serif text-[18px]" style={{ color: "var(--tan)" }}>{brl(p.v)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <button className="text-[10px] uppercase px-6 py-3.5" style={{ background: "var(--green)", color: "#fff", letterSpacing: "2.5px", fontWeight: 500 }}>
            Baixar relatório completo (PDF) ↓
          </button>
          <button className="text-[10px] uppercase px-6 py-3.5" style={{ border: "1px solid var(--line)", color: "var(--muted-foreground)", letterSpacing: "2.5px" }}>
            Falar com a Claudia →
          </button>
        </div>
      </main>

      <footer className="px-8 lg:px-14 py-8 flex items-center justify-between" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="dm-serif text-[14px]" style={{ color: "var(--muted-foreground)" }}>De Meo · Gestora Financeira</div>
        <div className="text-[9px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>Portal seguro · 2026</div>
      </footer>
    </div>
  );
}
