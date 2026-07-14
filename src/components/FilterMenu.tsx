import { useEffect, useRef, useState, type ReactNode } from "react";

/** Dropdown de filtro no padrão da Visão Geral (botão + menu). */
export function FilterMenu({
  label,
  valueLabel,
  children,
  minWidth = 180,
}: {
  label?: string;
  valueLabel: string;
  children: (close: () => void) => ReactNode;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[10px] uppercase"
        style={{
          letterSpacing: "1.5px",
          fontWeight: 600,
          background: "#fff",
          border: "1px solid var(--line)",
          color: "var(--foreground)",
          padding: "7px 12px",
          cursor: "pointer",
          borderRadius: 12,
        }}
      >
        {label ? <span style={{ color: "var(--muted-foreground)" }}>{label}</span> : null}
        <span>{valueLabel}</span>
        <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
            minWidth,
            overflow: "hidden",
          }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function FilterMenuOption({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 text-[12px] transition-colors"
      style={{
        background: active ? "rgba(153,169,137,0.16)" : "transparent",
        color: active ? "var(--green)" : "var(--foreground)",
        fontWeight: active ? 600 : 400,
        border: "none",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--offwhite)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
