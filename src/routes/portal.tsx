import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogoMark } from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";
import { brl, monthOptions, monthRangeDates } from "@/lib/utils";

export const Route = createFileRoute("/portal")({
  component: PortalPage,
  head: () => ({ meta: [{ title: "Portal · Aurora" }] }),
});

const MES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function PortalPage() {
  const { data: session } = useSession();
  const clientId = session?.user?.user_metadata?.client_id as string | undefined;

  const { data: client } = useQuery({
    queryKey: ["portal", "client", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase()
        .from("clients")
        .select("name, owner_name")
        .eq("id", clientId!)
        .single();
      return data;
    },
  });

  const mesAtual = monthOptions(1)[0];
  const { start: mesStart, end: mesEnd } = monthRangeDates(mesAtual);

  const { data: txMes = [], isLoading } = useQuery({
    queryKey: ["portal", "txMes", clientId, mesAtual],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase()
        .from("transactions")
        .select("amount, category")
        .eq("client_id", clientId!)
        .eq("status", "approved")
        .gte("date", mesStart)
        .lte("date", mesEnd);
      return (data ?? []) as { amount: number; category: string | null }[];
    },
  });

  const meses6 = monthOptions(6).reverse();
  const { start: hist6Start } = monthRangeDates(meses6[0]);
  const { end: hist6End } = monthRangeDates(meses6[meses6.length - 1]);

  const { data: tx6 = [] } = useQuery({
    queryKey: ["portal", "historico", clientId, hist6Start],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase()
        .from("transactions")
        .select("amount, date")
        .eq("client_id", clientId!)
        .eq("status", "approved")
        .gt("amount", 0)
        .gte("date", hist6Start)
        .lte("date", hist6End);
      return (data ?? []) as { amount: number; date: string }[];
    },
  });

  const { data: txAll = [] } = useQuery({
    queryKey: ["portal", "saldo", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase()
        .from("transactions")
        .select("amount")
        .eq("client_id", clientId!)
        .eq("status", "approved");
      return (data ?? []) as { amount: number }[];
    },
  });

  const receitas = txMes.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const despesas = txMes.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const saldo = txAll.reduce((s, t) => s + t.amount, 0);

  const desp = new Map<string, number>();
  txMes
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      const cat = t.category ?? "Sem categoria";
      desp.set(cat, (desp.get(cat) ?? 0) + Math.abs(t.amount));
    });
  const despList = Array.from(desp.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const chartValues = meses6.map((m) => {
    const { start, end } = monthRangeDates(m);
    return tx6.filter((t) => t.date >= start && t.date <= end).reduce((s, t) => s + t.amount, 0);
  });
  const chartLabels = meses6.map((m) => MES_CURTO[Number(m.split("/")[0]) - 1]);
  const chartMax = Math.max(...chartValues, 1);

  const mesLabel = new Date().toLocaleDateString("pt-BR", { month: "long" });
  const mesLabelCap = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);
  const updatedAt = new Date().toLocaleDateString("pt-BR");

  if (isLoading && !client) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--linen)" }}>
        <div className="aurora-cap">Carregando portal…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--linen)" }}>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-8 lg:px-14 py-5"
        style={{ background: "rgba(247,241,232,0.92)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line)" }}
      >
        <span className="inline-flex items-center gap-2.5" style={{ color: "var(--green)" }}>
          <LogoMark size={22} />
          <span className="aurora-serif text-[18px]" style={{ color: "var(--foreground)", fontWeight: 500 }}>Aurora</span>
        </span>
        <div className="hidden md:flex items-center gap-5">
          <span className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            Olá, <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{client?.owner_name ?? "—"}</span>
          </span>
          <Link to="/login" className="aurora-link">Sair</Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 lg:px-12 py-12 flex flex-col gap-8">
        <div>
          <div className="aurora-cap mb-3">Portal · {client?.name ?? "—"}</div>
          <h1 className="aurora-serif" style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 0.95, letterSpacing: "-2px" }}>
            Bem-vindo,<br /><em className="italic" style={{ color: "var(--green)" }}>{(client?.owner_name ?? "").split(" ")[0] || "—"}.</em>
          </h1>
          <p className="mt-4 text-[13px] max-w-xl" style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}>
            Aqui estão os números da sua empresa atualizados pela equipe da Aurora.
          </p>
        </div>

        <div className="aurora-card p-10">
          <div className="aurora-cap mb-3">Saldo atual consolidado</div>
          <div className="aurora-value" style={{ fontSize: "clamp(48px, 7vw, 88px)", color: "var(--navy)" }}>
            {brl(saldo)}
          </div>
          <div className="text-[12px] mt-3" style={{ color: "var(--muted-foreground)" }}>
            Atualizado em {updatedAt}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="aurora-card">
            <div className="aurora-cap mb-3">Receitas · {mesLabelCap}</div>
            <div className="aurora-value" style={{ fontSize: 44, color: "var(--green)" }}>{brl(receitas)}</div>
          </div>
          <div className="aurora-card">
            <div className="aurora-cap mb-3">Despesas · {mesLabelCap}</div>
            <div className="aurora-value" style={{ fontSize: 44, color: "var(--tan)" }}>{brl(despesas)}</div>
          </div>
        </div>

        <div className="aurora-card">
          <div className="aurora-cap mb-1">Evolução das receitas</div>
          <div className="aurora-serif text-[22px] mb-6">Últimos <em className="italic" style={{ color: "var(--green)" }}>6 meses</em></div>
          <div className="grid grid-cols-6 gap-4 items-end h-[180px]">
            {chartLabels.map((m, i) => (
              <div key={m} className="h-full flex flex-col justify-end items-center gap-2">
                <div
                  className="w-full"
                  style={{
                    height: `${(chartValues[i] / chartMax) * 100}%`,
                    minHeight: chartValues[i] > 0 ? 4 : 0,
                    background: i === chartLabels.length - 1 ? "var(--green)" : "var(--sage)",
                    opacity: i === chartLabels.length - 1 ? 1 : 0.7,
                    borderRadius: "4px 4px 0 0",
                  }}
                />
                <div className="text-[10px] uppercase" style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)" }}>{m}</div>
              </div>
            ))}
          </div>
        </div>

        {despList.length > 0 && (
          <div className="aurora-card">
            <div className="aurora-cap mb-1">Onde foi seu dinheiro</div>
            <div className="aurora-serif text-[22px] mb-5">Despesas por <em className="italic" style={{ color: "var(--green)" }}>categoria</em></div>
            <div className="flex flex-col gap-3">
              {despList.map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between gap-4 pb-3" style={{ borderBottom: "1px solid var(--line)" }}>
                  <div className="text-[13px]">{cat}</div>
                  <div className="aurora-value text-[18px]" style={{ color: "var(--navy)" }}>{brl(val)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

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
        <div className="aurora-serif text-[14px]" style={{ color: "var(--muted-foreground)" }}>Clareza que envolve. Resultado que permanece.</div>
        <div className="text-[9px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>© Aurora Gestão Financeira 2026</div>
      </footer>
    </div>
  );
}
