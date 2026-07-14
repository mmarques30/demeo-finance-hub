// Preview do módulo Pipeline (CRM) Aurora — versão realista para landing.
const COLS = [
  { label: "Lead", count: 4, color: "rgba(143,166,136,0.18)", text: "var(--sage)" },
  { label: "Diagnóstico", count: 3, color: "rgba(109,146,166,0.18)", text: "var(--tan)" },
  { label: "Proposta", count: 2, color: "rgba(27,57,77,0.16)", text: "var(--navy)" },
  { label: "Fechado", count: 5, color: "rgba(74,103,65,0.18)", text: "var(--green)" },
];

const CARDS = [
  ["Padaria São Jorge", "Indicação · 14d", "R$ 28.4k", 0],
  ["Restaurante Pernambuco", "LP · 8d", "R$ 36.0k", 0],
  ["Studio Pilates Vita", "IG · 3d", "R$ 18.0k", 1],
  ["Consultório Dra. Ana", "Indic · 11d", "R$ 24.0k", 2],
  ["Auto Center Ponto Forte", "Indic · 5d", "R$ 36.0k", 3],
];

export function PipelinePreview() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, var(--linen2) 100%)",
        border: "1px solid rgba(74,103,65,0.08)",
        borderRadius: 22,
        boxShadow:
          "0 1px 2px rgba(27,57,77,0.04), 0 30px 64px -28px rgba(74,103,65,0.28), inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid rgba(74,103,65,0.06)" }}
      >
        <div>
          <div className="aurora-cap" style={{ color: "var(--sage)" }}>
            Comercial
          </div>
          <div className="aurora-serif text-[15px]" style={{ fontWeight: 500 }}>
            Pipeline · 14 negócios
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] px-2.5 py-1 rounded-full"
            style={{
              background: "linear-gradient(135deg, var(--green), var(--green2))",
              color: "#fff",
              fontWeight: 500,
              letterSpacing: "1px",
            }}
          >
            R$ 142k em pipeline
          </span>
        </div>
      </div>

      {/* Kanban */}
      <div className="p-4 grid grid-cols-4 gap-2.5">
        {COLS.map((c, i) => (
          <div key={c.label} className="flex flex-col gap-2">
            <div
              className="flex items-center justify-between px-2 py-1.5 rounded-full"
              style={{ background: c.color }}
            >
              <span
                className="text-[8px] uppercase"
                style={{ letterSpacing: "1.2px", color: c.text, fontWeight: 600 }}
              >
                ● {c.label}
              </span>
              <span className="text-[9px]" style={{ color: c.text, fontWeight: 500 }}>
                {c.count}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {CARDS.filter(([, , , col]) => col === i).map(([title, source, value]) => (
                <div
                  key={String(title)}
                  className="p-2.5"
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(74,103,65,0.08)",
                    borderRadius: 10,
                    boxShadow: "0 2px 6px -2px rgba(74,103,65,0.08)",
                  }}
                >
                  <div className="text-[10px]" style={{ fontWeight: 500, lineHeight: 1.2 }}>
                    {title}
                  </div>
                  <div
                    className="text-[8px] mt-1"
                    style={{ color: "var(--muted-foreground)", letterSpacing: "0.4px" }}
                  >
                    {source}
                  </div>
                  <div
                    className="aurora-serif mt-1.5"
                    style={{ fontSize: 12, color: "var(--green)", letterSpacing: "-0.3px" }}
                  >
                    {value}
                  </div>
                </div>
              ))}
              {/* Placeholder vazio */}
              {!CARDS.filter(([, , , col]) => col === i).length && (
                <div
                  className="text-[9px] text-center py-3 rounded"
                  style={{ color: "var(--muted-foreground)", background: "rgba(74,103,65,0.02)" }}
                >
                  —
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
