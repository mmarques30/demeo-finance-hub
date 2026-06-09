import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "./Logo";
import { currentAdmin, pendingTransactions } from "@/lib/mockData";

type SidebarItem = { to: string; label: string; badge?: () => number };

const sidebarItems: SidebarItem[] = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/clientes", label: "Meus Clientes" },
  { to: "/admin/importar", label: "Importar Extratos" },
  { to: "/admin/pendentes", label: "Pendentes", badge: () => pendingTransactions().length },
  { to: "/admin/dfc", label: "DFC / DRE" },
  { to: "/admin/relatorios", label: "Relatórios" },
  { to: "/admin/pipeline", label: "Pipeline" },
  { to: "/admin/propostas", label: "Propostas" },
  { to: "/admin/contratos", label: "Contratos" },
  { to: "/admin/servicos", label: "Serviços" },
  { to: "/admin/insights/precificacao", label: "Precificação" },
];

const topLinks: { to: string; label: string }[] = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/clientes", label: "Clientes" },
  { to: "/admin/importar", label: "Extratos" },
  { to: "/admin/dfc", label: "Relatórios" },
  { to: "/admin/pipeline", label: "Pipeline" },
];

function isActive(pathname: string, to: string) {
  if (to === "/admin") return pathname === "/admin";
  return pathname.startsWith(to);
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="min-h-screen flex" style={{ background: "#FFFFFF" }}>
      {/* Sidebar — fundo navy do brand com gradiente sutil */}
      <aside
        className="hidden lg:flex flex-col w-[240px] shrink-0 sticky top-0 h-screen"
        style={{
          background:
            "linear-gradient(180deg, var(--navy) 0%, #15303F 100%)",
          color: "#fff",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="px-6 pt-7 pb-8">
          <Link to={"/admin" as string} className="inline-flex items-center gap-2.5 text-white">
            <LogoMark size={20} />
            <span className="aurora-serif text-[18px]" style={{ fontWeight: 500 }}>Aurora</span>
          </Link>
          <div
            className="mt-1.5 text-[9px] uppercase"
            style={{ letterSpacing: "2.5px", color: "rgba(255,255,255,.4)" }}
          >
            Gestão financeira
          </div>
        </div>

        <nav className="px-3 flex flex-col gap-0.5">
          {sidebarItems.map((item) => {
            const active = isActive(path, item.to);
            const badge = item.badge ? item.badge() : 0;
            return (
              <Link
                key={item.to}
                to={item.to as string}
                className="group flex items-center gap-3 px-3 py-2.5 text-[11px] uppercase transition-colors"
                style={{
                  letterSpacing: "1.5px",
                  color: active ? "#fff" : "rgba(255,255,255,.55)",
                  background: active ? "rgba(143,166,136,0.20)" : "transparent",
                  borderLeft: active ? "2px solid var(--sage)" : "2px solid transparent",
                }}
              >
                <span
                  className="block rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: active ? "var(--sage)" : "rgba(255,255,255,0.25)",
                  }}
                />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "rgba(184,149,106,0.85)",
                      color: "#fff",
                      letterSpacing: "1px",
                      fontWeight: 500,
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 py-6 text-[9px] uppercase" style={{ letterSpacing: "2px", color: "rgba(255,255,255,.35)" }}>
          v0.1 · Abril 2026
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar — branco translúcido com blur, harmonizando com fundo branco do conteúdo */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-8 py-4"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px) saturate(1.2)",
            WebkitBackdropFilter: "blur(16px) saturate(1.2)",
            borderBottom: "1px solid #EEEEEE",
          }}
        >
          <div className="lg:hidden">
            <Logo />
          </div>
          <nav className="hidden lg:flex items-center gap-7">
            {topLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to as string}
                className="aurora-link"
                data-status={isActive(path, link.to) ? "active" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <div className="text-[10px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>
                {currentAdmin.role}
              </div>
              <div className="aurora-serif text-[15px]">{currentAdmin.name}</div>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium"
              style={{ background: "var(--green)", color: "#fff", letterSpacing: "1px" }}
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
          className="px-8 py-6 flex items-center justify-between"
          style={{ borderTop: "1px solid #EEEEEE", background: "#FFFFFF" }}
        >
          <div className="aurora-serif text-[14px]" style={{ color: "var(--muted-foreground)" }}>
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
    <div className="px-8 lg:px-12 pt-10 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div>
        <div className="aurora-cap mb-3">{cap}</div>
        <h1 className="aurora-serif text-[44px] md:text-[56px] leading-[0.95]">
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
            style={{ color: "var(--muted-foreground)", lineHeight: 1.75 }}
          >
            {description}
          </p>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
