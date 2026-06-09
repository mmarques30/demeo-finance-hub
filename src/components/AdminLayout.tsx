import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "./Logo";
import { currentAdmin, pendingTransactions } from "@/lib/mockData";

type SidebarItem = { to: string; label: string; badge?: () => number; group?: string };

const sidebarItems: SidebarItem[] = [
  { to: "/admin", label: "Dashboard", group: "Visão" },
  { to: "/admin/clientes", label: "Clientes", group: "Visão" },
  { to: "/admin/dfc", label: "DFC / DRE", group: "Visão" },
  { to: "/admin/relatorios", label: "Relatórios", group: "Visão" },

  { to: "/admin/importar", label: "Importar Extratos", group: "Operação" },
  { to: "/admin/pendentes", label: "Pendentes", badge: () => pendingTransactions().length, group: "Operação" },

  { to: "/admin/pipeline", label: "Pipeline", group: "Comercial" },
  { to: "/admin/propostas", label: "Propostas", group: "Comercial" },
  { to: "/admin/contratos", label: "Contratos", group: "Comercial" },

  { to: "/admin/servicos", label: "Serviços", group: "Catálogo" },
  { to: "/admin/insights/precificacao", label: "Precificação", group: "Catálogo" },
];

function isActive(pathname: string, to: string) {
  if (to === "/admin") return pathname === "/admin";
  return pathname.startsWith(to);
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const path = location.pathname;

  // Agrupa itens da sidebar
  const grouped = sidebarItems.reduce<Record<string, SidebarItem[]>>((acc, item) => {
    const g = item.group ?? "Outros";
    (acc[g] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex" style={{ background: "#FFFFFF" }}>
      {/* Sidebar — gradient navy com pills modernos */}
      <aside
        className="hidden lg:flex flex-col w-[256px] shrink-0 sticky top-0 h-screen"
        style={{
          background:
            "linear-gradient(180deg, var(--navy) 0%, #15303F 100%)",
          color: "#fff",
        }}
      >
        <div className="px-6 pt-7 pb-6">
          <Link to={"/admin" as string} className="inline-flex items-center gap-2.5 text-white">
            <span style={{ color: "var(--sage)" }}>
              <LogoMark size={22} />
            </span>
            <span className="aurora-serif text-[20px]" style={{ fontWeight: 500, letterSpacing: "0.2px" }}>
              Aurora
            </span>
          </Link>
          <div
            className="mt-1.5 text-[9px] uppercase"
            style={{ letterSpacing: "2.5px", color: "rgba(255,255,255,.4)" }}
          >
            Gestão financeira
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-5">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="flex flex-col gap-0.5">
              <div
                className="px-3 mb-2 text-[8px] uppercase"
                style={{ letterSpacing: "2.5px", color: "rgba(255,255,255,0.35)" }}
              >
                {group}
              </div>
              {items.map((item) => {
                const active = isActive(path, item.to);
                const badge = item.badge ? item.badge() : 0;
                return (
                  <Link
                    key={item.to}
                    to={item.to as string}
                    className="group relative flex items-center gap-3 px-3 py-2.5 text-[12px] transition-all"
                    style={{
                      letterSpacing: "0.3px",
                      color: active ? "#fff" : "rgba(255,255,255,.6)",
                      background: active
                        ? "linear-gradient(135deg, rgba(143,166,136,0.24), rgba(143,166,136,0.10))"
                        : "transparent",
                      borderRadius: 12,
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {active && (
                      <span
                        style={{
                          position: "absolute",
                          left: -8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 3,
                          height: 22,
                          background: "var(--sage)",
                          borderRadius: 999,
                          boxShadow: "0 0 14px rgba(143,166,136,0.6)",
                        }}
                      />
                    )}
                    <span
                      className="block rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        background: active ? "var(--sage)" : "rgba(255,255,255,0.25)",
                        transition: "background 0.2s",
                      }}
                    />
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span
                        className="text-[9px] px-2 py-0.5"
                        style={{
                          background: "linear-gradient(135deg, var(--tan), #9F7E59)",
                          color: "#fff",
                          letterSpacing: "0.5px",
                          fontWeight: 600,
                          borderRadius: 999,
                          boxShadow: "0 2px 6px -2px rgba(184,149,106,0.6)",
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div
          className="px-6 py-4 flex items-center justify-between text-[9px] uppercase"
          style={{
            letterSpacing: "2px",
            color: "rgba(255,255,255,.35)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span>v0.1</span>
          <span>Abril · 2026</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar glass */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-6 lg:px-10 py-3.5"
          style={{
            background: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(20px) saturate(1.2)",
            WebkitBackdropFilter: "blur(20px) saturate(1.2)",
            borderBottom: "1px solid #EFEFEF",
          }}
        >
          <div className="lg:hidden">
            <Logo />
          </div>
          {/* Breadcrumb leve */}
          <div className="hidden lg:flex items-center gap-2 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            <span>Aurora</span>
            <span style={{ color: "rgba(0,0,0,0.2)" }}>/</span>
            <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
              {(() => {
                const m = sidebarItems.find((i) => isActive(path, i.to));
                return m?.label ?? "Painel";
              })()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <div className="text-[10px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>
                {currentAdmin.role}
              </div>
              <div className="aurora-serif text-[15px]">{currentAdmin.name}</div>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-medium"
              style={{
                background: "linear-gradient(135deg, var(--green), var(--green2))",
                color: "#fff",
                letterSpacing: "1px",
                boxShadow: "0 6px 16px -6px rgba(74,103,65,0.45)",
              }}
            >
              {currentAdmin.initials}
            </div>
            <Link
              to="/login"
              className="text-[10px] uppercase aurora-link"
              title="Sair"
            >
              Sair
            </Link>
          </div>
        </header>

        <main className="flex-1 min-w-0" style={{ background: "#FFFFFF" }}>
          {children}
        </main>

        <footer
          className="px-6 lg:px-10 py-6 flex items-center justify-between"
          style={{ borderTop: "1px solid #EFEFEF", background: "#FFFFFF" }}
        >
          <div className="aurora-serif italic text-[14px]" style={{ color: "var(--muted-foreground)" }}>
            Clareza que envolve. Resultado que permanece.
          </div>
          <div className="text-[9px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>
            © Aurora Gestão Financeira 2026
          </div>
        </footer>
      </div>
    </div>
  );
}

export function PageHeader({
  cap,
  title,
  emphasis,
  description,
  right,
}: {
  cap: string;
  title: string;
  emphasis?: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden px-6 lg:px-10 pt-10 pb-8"
      style={{
        background:
          "linear-gradient(180deg, #FAFAF8 0%, #FFFFFF 100%)",
        borderBottom: "1px solid #EFEFEF",
      }}
    >
      {/* Blob ambient */}
      <div
        aria-hidden
        className="aurora-blob aurora-blob--sage"
        style={{ width: 320, height: 320, right: "-5%", top: "-30%", opacity: 0.25 }}
      />
      <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="aurora-cap mb-3" style={{ color: "var(--sage)" }}>
            ✦ {cap}
          </div>
          <h1
            className="aurora-serif"
            style={{ fontSize: "clamp(36px, 4.5vw, 52px)", lineHeight: 1, letterSpacing: "-2px" }}
          >
            {title}
            {emphasis && (
              <>
                {" "}
                <em className="italic" style={{ color: "var(--green)" }}>
                  {emphasis}
                </em>
              </>
            )}
          </h1>
          {description && (
            <p
              className="mt-4 max-w-xl text-[13px]"
              style={{ color: "var(--muted-foreground)", lineHeight: 1.85 }}
            >
              {description}
            </p>
          )}
        </div>
        {right && <div>{right}</div>}
      </div>
    </div>
  );
}
