// Form objetivo no hero — substitui o ProductPreview.
// Nome + 2 dropdowns de qualificação + submit magnético. Sem ruído.
import { useState } from "react";

const INK = "#1C2D45";
const STEEL = "#6D92A6";
const SAGE = "#99A989";
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

export function HeroLeadForm() {
  const [name, setName] = useState("");
  const [fat, setFat] = useState("");
  const [dor, setDor] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !fat || !dor) return;
    setStatus("loading");
    // TODO integrar com /functions/v1/lead-intake — placeholder rápido
    setTimeout(() => setStatus("ok"), 700);
  }

  if (status === "ok") {
    return (
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(250,250,248,0.95) 100%)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(28,45,69,0.08)",
          borderRadius: 24,
          boxShadow:
            "0 40px 80px -30px rgba(28,45,69,0.25), 0 24px 40px -20px rgba(40,76,43,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
          padding: 40,
        }}
      >
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            fontWeight: 300,
            color: INK,
            letterSpacing: "-0.6px",
            lineHeight: 1.2,
          }}
        >
          Obrigada, {name.split(" ")[0]}.{" "}
          <em className="italic" style={{ color: FOREST }}>
            A Claudia te chama em até 1 dia útil.
          </em>
        </div>
        <p className="mt-4" style={{ fontSize: 14, color: "rgba(28,45,69,0.65)", lineHeight: 1.6 }}>
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
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(250,250,248,0.95) 100%)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(28,45,69,0.08)",
        borderRadius: 24,
        boxShadow:
          "0 40px 80px -30px rgba(28,45,69,0.25), 0 24px 40px -20px rgba(40,76,43,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
        padding: 32,
      }}
    >
      {/* Brilho decorativo */}
      <div
        aria-hidden
        className="absolute"
        style={{
          right: -60,
          top: -60,
          width: 180,
          height: 180,
          background: "radial-gradient(circle, rgba(153,169,137,0.4) 0%, transparent 70%)",
          filter: "blur(40px)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div className="relative">
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "1.5px",
            color: SAGE,
            marginBottom: 8,
          }}
        >
          DIAGNÓSTICO GRATUITO
        </div>
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 26,
            fontWeight: 300,
            color: INK,
            letterSpacing: "-0.6px",
            lineHeight: 1.15,
          }}
        >
          Conta um pouco da sua{" "}
          <em className="italic" style={{ color: FOREST }}>
            empresa
          </em>
          .
        </h3>

        <div className="mt-6 flex flex-col gap-3">
          <Field>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              required
              className="focus-ring"
              style={inputStyle}
            />
          </Field>

          <Field>
            <select
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              required
              className="focus-ring"
              style={{ ...inputStyle, color: fat ? INK : "rgba(28,45,69,0.45)" }}
            >
              <option value="" disabled>
                Faturamento mensal da empresa
              </option>
              {FATURAMENTO.map((o) => (
                <option key={o.v} value={o.v} style={{ color: INK }}>
                  {o.l}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <select
              value={dor}
              onChange={(e) => setDor(e.target.value)}
              required
              className="focus-ring"
              style={{ ...inputStyle, color: dor ? INK : "rgba(28,45,69,0.45)" }}
            >
              <option value="" disabled>
                Sua principal dor no financeiro
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
                ? STEEL
                : `linear-gradient(135deg, ${FOREST} 0%, #1f3a22 100%)`,
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            padding: "18px 24px",
            border: "none",
            borderRadius: 999,
            boxShadow: "0 10px 28px -10px rgba(40,76,43,0.5)",
            cursor: status === "loading" ? "wait" : "pointer",
            letterSpacing: "0.2px",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            if (status === "idle") {
              e.currentTarget.style.transform = "translateY(-1px) scale(1.01)";
              e.currentTarget.style.boxShadow = "0 14px 32px -10px rgba(40,76,43,0.6)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "0 10px 28px -10px rgba(40,76,43,0.5)";
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
            {status === "loading" ? "Enviando…" : "Receber diagnóstico →"}
          </span>
        </button>

        <p
          className="mt-3 text-center"
          style={{ fontSize: 11, color: "rgba(28,45,69,0.5)", lineHeight: 1.5 }}
        >
          Resposta em até 1 dia útil. Sem pressão, sem cobrança.
        </p>
      </div>
    </form>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <label className="block">{children}</label>;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  fontSize: 14,
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(28,45,69,0.12)",
  borderRadius: 12,
  outline: "none",
  fontFamily: "inherit",
  color: INK,
  transition: "border-color 0.2s, box-shadow 0.2s",
};
