import { LogoMark } from "@/components/Logo";

// Mockup estilizado do dashboard Aurora exibido no hero da landing.
// Não consulta dados reais — é demo visual.
export function DashboardPreview() {
  const bars = [38, 52, 41, 67, 49, 78, 62];
  const max = Math.max(...bars);

  return (
    <div
      className="relative rounded-[18px] overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--line)",
        boxShadow:
          "0 30px 60px -30px rgba(27,57,77,0.18), 0 12px 24px -16px rgba(74,103,65,0.12)",
      }}
    >
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--line)", background: "var(--linen2)" }}
      >
        <div className="flex items-center gap-2" style={{ color: "var(--green)" }}>
          <LogoMark size={16} />
          <span className="aurora-serif text-[14px]" style={{ color: "var(--foreground)", fontWeight: 500 }}>
            Aurora
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
          <span>Abril · 2026</span>
          <span
            className="rounded-full w-6 h-6 inline-flex items-center justify-center text-[9px]"
            style={{ background: "var(--green)", color: "#fff", fontWeight: 500 }}
          >
            CL
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 grid grid-cols-3 gap-3">
        {/* Saldo grande */}
        <div className="col-span-2 p-4" style={{ background: "var(--linen)", borderRadius: 12 }}>
          <div className="aurora-cap mb-1">Saldo consolidado</div>
          <div
            className="aurora-serif"
            style={{ fontSize: 36, lineHeight: 1, color: "var(--navy)", letterSpacing: "-1px" }}
          >
            R$ 184.230
          </div>
          <div className="flex items-end justify-between mt-3">
            <div className="flex items-end gap-1" style={{ height: 56 }}>
              {bars.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 12,
                    height: `${(h / max) * 100}%`,
                    background: i === bars.length - 1 ? "var(--green)" : "var(--sage)",
                    opacity: i === bars.length - 1 ? 1 : 0.55,
                    borderRadius: 3,
                  }}
                />
              ))}
            </div>
            <div className="text-[10px]" style={{ color: "var(--green)" }}>
              ↑ 12,4% vs mar
            </div>
          </div>
        </div>

        {/* Donut/categoria */}
        <div className="p-4" style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12 }}>
          <div className="aurora-cap mb-2">Categorias</div>
          <svg viewBox="0 0 36 36" className="block mx-auto" width="84" height="84">
            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--linen)" strokeWidth="3.5" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="var(--green)"
              strokeWidth="3.5"
              strokeDasharray="62 100"
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="var(--tan)"
              strokeWidth="3.5"
              strokeDasharray="26 100"
              strokeDashoffset="-62"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <div className="mt-2 flex flex-col gap-1 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} /> Receita
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--tan)" }} /> Despesa
            </span>
          </div>
        </div>

        {/* DFC mini */}
        <div className="col-span-3 p-4" style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12 }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="aurora-cap mb-0.5">DFC · Próximos 30 dias</div>
              <div className="aurora-serif text-[15px]">Projeção de caixa</div>
            </div>
            <span className="aurora-badge aurora-badge--ok">● Saldo positivo</span>
          </div>
          <div className="relative h-16">
            <svg viewBox="0 0 200 60" className="w-full h-full">
              <path
                d="M0,40 C30,30 60,45 80,25 C100,10 120,35 140,20 C160,5 180,18 200,12"
                fill="none"
                stroke="var(--green)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M0,40 C30,30 60,45 80,25 C100,10 120,35 140,20 C160,5 180,18 200,12 L200,60 L0,60 Z"
                fill="var(--green)"
                opacity="0.08"
              />
            </svg>
          </div>
          <div className="flex justify-between mt-2 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
            {["sem 1", "sem 2", "sem 3", "sem 4"].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
