// Form do hero — Nome + Telefone + E-mail + 2 perguntas qualificação.
// Fundo: azul intermediário da marca (#6D92A6).
import { useState } from "react";
import { FUNCTIONS_URL } from "@/lib/supabase";

const INK = "#1C2D45";
const STEEL = "#6D92A6";
const SURFACE = "#E0E4D6";
const FOREST = "#284C2B";

const FATURAMENTO = [
  { v: "ate_50k", l: "Até R$ 50 mil" },
  { v: "50_150k", l: "R$ 50 mil – R$ 150 mil" },
  { v: "150_500k", l: "R$ 150 mil – R$ 500 mil" },
  { v: "500k_mais", l: "R$ 500 mil ou mais" },
];

const DOR = [
  { v: "organizacao", l: "Não sei onde está cada real" },
  { v: "fluxo", l: "Preciso prever o caixa" },
  { v: "decisao", l: "Decido no escuro" },
  { v: "fechamento", l: "Quero relatórios prontos" },
];

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function HeroLeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fat, setFat] = useState("");
  const [dor, setDor] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone || !email || !fat || !dor) return;
    setStatus("loading");
    setErrMsg(null);
    try {
      const res = await fetch(`${FUNCTIONS_URL}/lead-intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          monthly_revenue_range: fat,
          pain_point: dor,
          consent_lgpd: true,
          source_slug: "landing_page",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha ao enviar");
      }
      setStatus("ok");
    } catch (e) {
      setStatus("error");
      setErrMsg(e instanceof Error ? e.message : "Falha desconhecida");
    }
  }

  if (status === "ok") {
    return (
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${STEEL} 0%, #5A7F94 100%)`,
          border: "1px solid rgba(28,45,69,0.12)",
          borderRadius: 24,
          boxShadow:
            "0 40px 80px -28px rgba(28,45,69,0.35), 0 16px 32px -16px rgba(40,76,43,0.18)",
          padding: 36,
          color: "#fff",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            background: FOREST,
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            marginBottom: 16,
            boxShadow: "0 12px 24px -6px rgba(40,76,43,0.45)",
          }}
        >
          ✓
        </div>
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            fontWeight: 400,
            color: "#fff",
            letterSpacing: "-0.6px",
            lineHeight: 1.2,
          }}
        >
          Obrigada, {name.split(" ")[0]}.{" "}
          <em className="italic" style={{ color: SURFACE }}>
            A Claudia te chama em até 1 dia útil.
          </em>
        </h3>
        <p className="mt-4" style={{ fontSize: 14, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          Sem pressão, sem cobrança no primeiro papo.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(165deg, ${STEEL} 0%, #5C8296 55%, #547A8E 100%)`,
        border: "1px solid rgba(28,45,69,0.14)",
        borderRadius: 24,
        boxShadow:
          "0 40px 80px -28px rgba(28,45,69,0.32), 0 18px 36px -18px rgba(40,76,43,0.16), inset 0 1px 0 rgba(255,255,255,0.22)",
        padding: 30,
      }}
    >
      <div
        aria-hidden
        className="absolute"
        style={{
          right: -50,
          top: -50,
          width: 200,
          height: 200,
          background: "radial-gradient(circle, rgba(224,228,214,0.35) 0%, transparent 70%)",
          filter: "blur(28px)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        className="absolute"
        style={{
          left: -40,
          bottom: -60,
          width: 180,
          height: 180,
          background: "radial-gradient(circle, rgba(40,76,43,0.28) 0%, transparent 70%)",
          filter: "blur(36px)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div className="relative">
        <div
          className="inline-flex items-center gap-2 mb-3"
          style={{
            background: SURFACE,
            color: FOREST,
            padding: "5px 12px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          DIAGNÓSTICO GRATUITO
        </div>
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 26,
            fontWeight: 400,
            color: "#FFFFFF",
            letterSpacing: "-0.6px",
            lineHeight: 1.15,
          }}
        >
          Conta um pouco da sua{" "}
          <em className="italic" style={{ color: SURFACE }}>
            empresa
          </em>
          .
        </h3>

        <div className="mt-5 flex flex-col gap-2.5">
          <Field label="Nome">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como prefere ser chamado(a)"
              required
              className="focus-ring"
              style={inputStyle}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Telefone">
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(11) 91234-5678"
                required
                className="focus-ring"
                style={inputStyle}
              />
            </Field>
            <Field label="E-mail">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="você@empresa.com"
                required
                className="focus-ring"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Faturamento mensal da empresa">
            <select
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              required
              className="focus-ring"
              style={{ ...inputStyle, color: fat ? INK : "rgba(28,45,69,0.5)" }}
            >
              <option value="" disabled>
                Selecione…
              </option>
              {FATURAMENTO.map((o) => (
                <option key={o.v} value={o.v} style={{ color: INK }}>
                  {o.l}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sua principal dor no financeiro">
            <select
              value={dor}
              onChange={(e) => setDor(e.target.value)}
              required
              className="focus-ring"
              style={{ ...inputStyle, color: dor ? INK : "rgba(28,45,69,0.5)" }}
            >
              <option value="" disabled>
                Selecione…
              </option>
              {DOR.map((o) => (
                <option key={o.v} value={o.v} style={{ color: INK }}>
                  {o.l}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="focus-ring mt-4 w-full inline-flex items-center justify-center gap-2 relative overflow-hidden"
          style={{
            background:
              status === "loading"
                ? "rgba(28,45,69,0.55)"
                : `linear-gradient(135deg, ${FOREST} 0%, #1f3a22 100%)`,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            padding: "16px 24px",
            border: "none",
            borderRadius: 999,
            boxShadow: "0 12px 28px -10px rgba(40,76,43,0.55)",
            cursor: status === "loading" ? "wait" : "pointer",
            letterSpacing: "0.2px",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            if (status === "idle") {
              e.currentTarget.style.transform = "translateY(-1px) scale(1.01)";
              e.currentTarget.style.boxShadow = "0 16px 32px -10px rgba(40,76,43,0.65)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "0 12px 28px -10px rgba(40,76,43,0.55)";
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 50%)",
              pointerEvents: "none",
            }}
          />
          <span style={{ position: "relative" }}>
            {status === "loading" ? "Enviando…" : "Agendar diagnóstico →"}
          </span>
        </button>

        {status === "error" && errMsg && (
          <p className="mt-2 text-center" style={{ fontSize: 11, color: SURFACE, lineHeight: 1.5 }}>
            {errMsg}
          </p>
        )}
        <p className="mt-3 text-center" style={{ fontSize: 11, color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
          Resposta em até 1 dia útil. Sem pressão, sem cobrança.
        </p>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "1.2px",
          color: SURFACE,
          marginBottom: 5,
        }}
      >
        {label.toUpperCase()}
      </div>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  fontSize: 13.5,
  background: "#FAFBFA",
  border: "1px solid rgba(255,255,255,0.35)",
  borderRadius: 10,
  outline: "none",
  fontFamily: "inherit",
  color: INK,
  transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
};
