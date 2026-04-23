import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { brl } from "@/lib/mockData";

export const Route = createFileRoute("/admin/pipeline")({
  component: PipelinePage,
  head: () => ({ meta: [{ title: "Pipeline · De Meo" }] }),
});

const colunas: { key: string; label: string; cards: { name: string; source: string; date: string; value: number }[] }[] = [
  { key: "lead", label: "Lead", cards: [
    { name: "Confeitaria Aurora", source: "Indicação", date: "14/04", value: 24000 },
    { name: "Studio Pilates Vita", source: "Instagram", date: "16/04", value: 18000 },
  ] },
  { key: "contato", label: "Primeiro Contato", cards: [
    { name: "Pet Shop Petricor", source: "Landing page", date: "12/04", value: 21000 },
  ] },
  { key: "diag", label: "Diagnóstico", cards: [
    { name: "Auto Center Ponto Forte", source: "Indicação", date: "08/04", value: 28000 },
  ] },
  { key: "prop", label: "Proposta Enviada", cards: [
    { name: "Atelier de Costura M.", source: "Indicação", date: "05/04", value: 22000 },
  ] },
  { key: "ganho", label: "Fechado", cards: [
    { name: "Restaurante Pernambuco", source: "Indicação", date: "01/04", value: 36000 },
  ] },
  { key: "perdido", label: "Perdido", cards: [
    { name: "Loja Calçados X", source: "Landing page", date: "02/04", value: 12000 },
  ] },
];

function PipelinePage() {
  const totalAtivos = colunas.filter((c) => !["ganho", "perdido"].includes(c.key)).reduce((s, c) => s + c.cards.length, 0);
  const valorNeg = colunas.filter((c) => !["ganho", "perdido"].includes(c.key)).reduce((s, c) => s + c.cards.reduce((a, b) => a + b.value, 0), 0);
  const ticket = colunas.find((c) => c.key === "ganho")!.cards.reduce((a, b) => a + b.value, 0) / Math.max(1, colunas.find((c) => c.key === "ganho")!.cards.length);

  return (
    <AdminLayout>
      <PageHeader
        cap="CRM comercial"
        title="Pipeline"
        emphasis="de captação"
        description="Visualização kanban dos leads ativos da De Meo."
      />

      <div className="px-8 lg:px-12 pb-12 flex flex-col gap-8">
        {/* Métricas */}
        <div className="grid md:grid-cols-4 gap-5">
          <Metric label="Leads ativos" value={String(totalAtivos)} tone="green" />
          <Metric label="Em negociação" value={brl(valorNeg)} tone="navy" />
          <Metric label="Taxa de conversão" value="24%" tone="green" />
          <Metric label="Ticket médio" value={brl(ticket)} tone="tan" />
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {colunas.map((col) => (
            <div key={col.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <div className="dm-cap">{col.label}</div>
                <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{col.cards.length}</div>
              </div>
              <div className="flex flex-col gap-2 min-h-[200px]">
                {col.cards.map((card) => (
                  <div key={card.name} className="bg-white p-4 transition-shadow hover:shadow-sm" style={{ border: "1px solid var(--line)" }}>
                    <div className="text-[12px]" style={{ fontWeight: 500 }}>{card.name}</div>
                    <div className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>{card.source} · {card.date}</div>
                    <div className="dm-serif text-[18px] mt-3" style={{ color: "var(--green)" }}>{brl(card.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "green" | "tan" | "navy" }) {
  const color = tone === "green" ? "var(--green)" : tone === "tan" ? "var(--tan)" : "var(--navy)";
  return (
    <div className="dm-card">
      <div className="dm-cap mb-3">{label}</div>
      <div className="dm-serif" style={{ fontSize: 30, color, lineHeight: 1, letterSpacing: "-1px" }}>{value}</div>
    </div>
  );
}
