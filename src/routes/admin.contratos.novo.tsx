import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout, PageHeader } from "@/components/AdminLayout";
import { supabase, FUNCTIONS_URL } from "@/lib/supabase";
import { authHeaders } from "@/lib/auth";

export const Route = createFileRoute("/admin/contratos/novo")({
  component: NovoContrato,
  head: () => ({ meta: [{ title: "Novo contrato · Aurora" }] }),
});

type AcceptedProposal = {
  id: string;
  number: string;
  client_name: string;
  client_email: string | null;
  client_document: string | null;
  total_monthly: number;
  deal_id: string;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function NovoContrato() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AcceptedProposal | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [terminationDays, setTerminationDays] = useState(30);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ pdf_url: string | null; number: string } | null>(null);

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals", "accepted"],
    queryFn: async (): Promise<AcceptedProposal[]> => {
      const { data } = await supabase()
        .from("proposals")
        .select("id, number, client_name, client_email, client_document, total_monthly, deal_id")
        .eq("status", "accepted")
        .order("decided_at", { ascending: false });
      return (data ?? []) as AcceptedProposal[];
    },
  });

  async function createContract() {
    if (!selected) return;
    setSaving(true);
    try {
      const { data, error } = await supabase()
        .from("contracts")
        .insert({
          proposal_id: selected.id,
          deal_id: selected.deal_id,
          client_name: selected.client_name,
          client_email: selected.client_email,
          client_document: selected.client_document,
          total_monthly: selected.total_monthly,
          start_date: startDate,
          termination_notice_days: terminationDays,
          signature_provider: "manual",
        })
        .select()
        .single();
      if (error) throw error;

      toast.success(`Contrato ${data.number} criado — gerando PDF…`);

      // Gera PDF via edge function
      const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
      const res = await fetch(`${FUNCTIONS_URL}/contract-generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ contract_id: data.id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(`PDF não gerado: ${j.error ?? "falha na EF"}`);
        navigate({ to: "/admin/contratos" });
        return;
      }
      const out = await res.json();
      setResult({ pdf_url: out.pdf_url, number: data.number });
      toast.success("PDF gerado com sucesso");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        cap="Comercial"
        title="Novo"
        emphasis="contrato"
        description="A partir de uma proposta aceita."
      />
      <div className="px-8 lg:px-12 pb-12 grid lg:grid-cols-2 gap-8">
        <div className="aurora-card">
          <div className="aurora-cap mb-2">1. Proposta aceita</div>
          <div className="aurora-serif text-[22px] mb-4">Selecione a base</div>
          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
            {proposals.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="text-left p-4 flex justify-between items-center"
                style={{
                  border: `1px solid ${selected?.id === p.id ? "var(--green)" : "var(--line)"}`,
                  background: selected?.id === p.id ? "rgba(74,103,65,0.04)" : "#fff",
                }}
              >
                <div>
                  <div className="text-[12px]" style={{ fontWeight: 500 }}>
                    {p.client_name}
                  </div>
                  <div className="aurora-cap" style={{ fontFamily: "monospace" }}>
                    {p.number}
                  </div>
                </div>
                <div className="aurora-serif text-[16px]" style={{ color: "var(--green)" }}>
                  {brl(Number(p.total_monthly))}
                </div>
              </button>
            ))}
            {proposals.length === 0 && (
              <div className="text-[12px] py-6 text-center" style={{ color: "var(--muted-foreground)" }}>
                Nenhuma proposta aceita ainda.
              </div>
            )}
          </div>
        </div>

        <div className="aurora-card">
          <div className="aurora-cap mb-2">2. Termos do contrato</div>
          <div className="aurora-serif text-[22px] mb-4">Condições</div>
          {selected ? (
            <div className="flex flex-col gap-4">
              <Info label="Cliente" value={selected.client_name} />
              <Info label="CNPJ/CPF" value={selected.client_document ?? "—"} />
              <Info label="Valor mensal" value={brl(Number(selected.total_monthly))} />
              <label>
                <div className="aurora-cap mb-2">Data de início</div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="aurora-input"
                />
              </label>
              <label>
                <div className="aurora-cap mb-2">Aviso prévio (dias)</div>
                <input
                  type="number"
                  value={terminationDays}
                  onChange={(e) => setTerminationDays(Number(e.target.value))}
                  className="aurora-input"
                />
              </label>
              {!result ? (
                <div className="flex gap-3 items-center mt-2">
                  <button
                    disabled={saving}
                    onClick={createContract}
                    className="text-[10px] uppercase px-6 py-3 disabled:opacity-50"
                    style={{ background: "var(--green)", color: "#fff", letterSpacing: "2.5px", fontWeight: 500 }}
                  >
                    {saving ? "Gerando…" : "Criar contrato →"}
                  </button>
                  <button
                    disabled
                    title="Em breve: integração com ClickSign para assinatura digital"
                    className="text-[10px] uppercase px-4 py-2.5 opacity-50 cursor-not-allowed"
                    style={{ border: "1px solid var(--line)", letterSpacing: "2px" }}
                  >
                    Enviar para ClickSign (em breve)
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="aurora-cap" style={{ color: "var(--green)" }}>Contrato {result.number} criado</div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {result.pdf_url && (
                      <a
                        href={result.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aurora-card p-5 text-center"
                        style={{ borderColor: "var(--green)" }}
                      >
                        <div className="aurora-cap mb-1">PDF</div>
                        <div className="aurora-serif text-[16px]" style={{ color: "var(--green)" }}>
                          Abrir contrato →
                        </div>
                      </a>
                    )}
                    <button
                      onClick={() => navigate({ to: "/admin/contratos" })}
                      className="aurora-card p-5 text-center"
                    >
                      <div className="aurora-cap mb-1">Lista</div>
                      <div className="aurora-serif text-[16px]" style={{ color: "var(--navy)" }}>
                        Ver todos os contratos →
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              Escolha uma proposta na coluna ao lado.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="aurora-cap mb-1">{label}</div>
      <div className="text-[13px]">{value}</div>
    </div>
  );
}
