import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogoMark } from "./Logo";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth";
import { useClickOutside, useLocalStorage } from "@/hooks/useClickOutside";

type SidebarItem = {
  to: string;
  label: string;
  icon: string;
};
type SidebarGroup = { id: string; label: string; items: SidebarItem[] };

const GROUPS: SidebarGroup[] = [
  {
    id: "visao",
    label: "Visão",
    items: [
      { to: "/admin", label: "Dashboard", icon: "▦" },
      { to: "/admin/clientes", label: "Clientes", icon: "◷" },
      { to: "/admin/dfc", label: "DFC / DRE", icon: "◈" },
      { to: "/admin/relatorios", label: "Relatórios", icon: "≡" },
    ],
  },
  {
    id: "operacao",
    label: "Operação",
    items: [
      { to: "/admin/importar", label: "Importar Extratos", icon: "↓" },
      { to: "/admin/pendentes", label: "Pendentes", icon: "⊙" },
      { to: "/admin/recorrencias", label: "Recorrências", icon: "↺" },
      { to: "/admin/contas", label: "Contas", icon: "⊜" },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    items: [
      { to: "/admin/pipeline", label: "Pipeline", icon: "⋯" },
      { to: "/admin/propostas", label: "Propostas", icon: "✎" },
      { to: "/admin/contratos", label: "Contratos", icon: "❍" },
    ],
  },
  {
    id: "catalogo",
    label: "Catálogo",
    items: [
      { to: "/admin/servicos", label: "Serviços", icon: "◇" },
      { to: "/admin/insights/precificacao", label: "Precificação", icon: "↗" },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

function isActive(pathname: string, to: string) {
  if (to === "/admin") return pathname === "/admin";
  return pathname.startsWith(to);
}

function activeGroupId(pathname: string): string {
  for (const g of GROUPS) {
    if (g.items.some((it) => isActive(pathname, it.to))) return g.id;
  }
  return GROUPS[0].id;
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const path = location.pathname;

  const { data: session } = useSession();
  const adminName = session?.user?.user_metadata?.display_name ?? session?.user?.email ?? "Admin";
  const adminRole = "Gestora";
  const adminInitials = adminName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  const { data: pendentesCount = 0 } = useQuery({
    queryKey: ["pendentes", "count"],
    queryFn: async () => {
      const { count } = await supabase()
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  const { data: recorrenciasCount = 0 } = useQuery({
    queryKey: ["recorrencias", "count"],
    queryFn: async () => {
      const { data } = await supabase().rpc("pending_recurrences_total");
      return (data as number) ?? 0;
    },
    refetchInterval: 120_000,
  });

  const [getCollapsed, setCollapsed] = useLocalStorage<boolean>("aurora.admin.collapsed", false);
  const [getExpanded, setExpanded] = useLocalStorage<Record<string, boolean>>("aurora.admin.groups", {
    visao: true,
    operacao: true,
    comercial: true,
    catalogo: true,
  });

  const [collapsed, setCollapsedState] = useState<boolean>(false);
  const [expanded, setExpandedState] = useState<Record<string, boolean>>({
    visao: true,
    operacao: true,
    comercial: true,
    catalogo: true,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement | null>(null);

  // Hidrata do localStorage no client-side
  useEffect(() => {
    setCollapsedState(getCollapsed());
    setExpandedState((prev) => ({ ...prev, ...getExpanded() }));
    // Garante que o grupo da página atual fica aberto
    setExpandedState((prev) => ({ ...prev, [activeGroupId(path)]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useClickOutside(userRef, () => setUserOpen(false), userOpen);

  // Fecha drawer ao navegar
  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsedState(next);
    setCollapsed(next);
  }
  function toggleGroup(id: string) {
    const next = { ...expanded, [id]: !expanded[id] };
    setExpandedState(next);
    setExpanded(next);
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#FFFFFF" }}>
      {/* ============= SIDEBAR DESKTOP ============= */}
      <aside
        className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen transition-[width] duration-300"
        style={{
          width: collapsed ? 76 : 260,
          background: "linear-gradient(180deg, #1C2D45 0%, #142235 100%)",
          color: "#fff",
        }}
      >
        <SidebarContent
          path={path}
          collapsed={collapsed}
          expanded={expanded}
          onToggleCollapsed={toggleCollapsed}
          onToggleGroup={toggleGroup}
          pendentesCount={pendentesCount}
          recorrenciasCount={recorrenciasCount}
        />
      </aside>

      {/* ============= MOBILE DRAWER ============= */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="h-full overflow-y-auto"
            style={{
              width: 280,
              background: "linear-gradient(180deg, var(--navy) 0%, #15303F 100%)",
              color: "#fff",
              animation: "aurora-slide-in 0.28s cubic-bezier(.22,.61,.36,1) both",
            }}
          >
            <style>{`@keyframes aurora-slide-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
            <SidebarContent
              path={path}
              collapsed={false}
              expanded={expanded}
              onToggleCollapsed={() => setDrawerOpen(false)}
              onToggleGroup={toggleGroup}
              pendentesCount={pendentesCount}
              recorrenciasCount={recorrenciasCount}
              mobile
            />
          </aside>
        </div>
      )}

      {/* ============= MAIN ============= */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8 py-3"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(20px) saturate(1.2)",
            WebkitBackdropFilter: "blur(20px) saturate(1.2)",
            borderBottom: "1px solid #EFEFEF",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger mobile */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-md flex flex-col gap-1"
              aria-label="Abrir menu"
              style={{ border: "1px solid #EFEFEF" }}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 16, height: 1.5, background: "var(--foreground)", display: "block" }} />
              ))}
            </button>

            {/* Breadcrumb dinâmico */}
            <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              <span className="hidden sm:inline">Aurora</span>
              <span className="hidden sm:inline" style={{ color: "rgba(0,0,0,0.2)" }}>/</span>
              <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
                {ALL_ITEMS.find((i) => isActive(path, i.to))?.label ?? "Painel"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dropdown user */}
            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-3 px-3 py-1.5 transition-all"
                style={{
                  border: "1px solid #EFEFEF",
                  borderRadius: 999,
                  background: userOpen ? "#F7F7F4" : "transparent",
                }}
              >
                <div className="hidden md:block text-right">
                  <div className="text-[9px] uppercase" style={{ letterSpacing: "2px", color: "var(--muted-foreground)" }}>
                    {adminRole}
                  </div>
                  <div className="aurora-serif text-[13px]" style={{ lineHeight: 1 }}>
                    {adminName}
                  </div>
                </div>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium"
                  style={{
                    background: "linear-gradient(135deg, var(--green), var(--green2))",
                    color: "#fff",
                    letterSpacing: "1px",
                    boxShadow: "0 4px 12px -4px rgba(74,103,65,0.45)",
                  }}
                >
                  {adminInitials}
                </div>
                <span
                  className="hidden md:inline transition-transform"
                  style={{
                    fontSize: 8,
                    color: "var(--muted-foreground)",
                    transform: userOpen ? "rotate(180deg)" : "rotate(0)",
                  }}
                >
                  ▾
                </span>
              </button>

              {userOpen && (
                <div
                  className="absolute right-0 mt-2 z-50 overflow-hidden"
                  style={{
                    width: 240,
                    background: "#fff",
                    border: "1px solid #EFEFEF",
                    borderRadius: 16,
                    boxShadow: "0 1px 2px rgba(27,57,77,0.04), 0 24px 48px -16px rgba(74,103,65,0.22)",
                    animation: "aurora-pop 0.18s cubic-bezier(.22,.61,.36,1) both",
                  }}
                >
                  <style>{`@keyframes aurora-pop { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
                  <div className="px-4 py-3.5" style={{ borderBottom: "1px solid #F4F4F2" }}>
                    <div className="aurora-cap mb-0.5" style={{ color: "var(--sage)" }}>
                      Conta
                    </div>
                    <div className="aurora-serif text-[15px]">{adminName}</div>
                    <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      {adminRole}
                    </div>
                  </div>
                  <div className="py-2">
                    <DropdownItem icon="◷" label="Meu perfil" onClick={() => setUserOpen(false)} />
                    <DropdownItem icon="⚙" label="Preferências" onClick={() => setUserOpen(false)} />
                    <DropdownItem icon="?" label="Ajuda" onClick={() => setUserOpen(false)} />
                  </div>
                  <Link
                    to="/login"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-[12px] transition-colors"
                    style={{ borderTop: "1px solid #F4F4F2", color: "var(--tan)" }}
                  >
                    <span style={{ fontSize: 14 }}>↪</span>
                    Sair
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0" style={{ background: "#FFFFFF" }}>
          {children}
        </main>

        <footer
          className="px-4 lg:px-10 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
          style={{ borderTop: "1px solid #EFEFEF", background: "#FFFFFF" }}
        >
          <div className="aurora-serif italic text-[13px]" style={{ color: "var(--muted-foreground)" }}>
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

function SidebarContent({
  path,
  collapsed,
  expanded,
  onToggleCollapsed,
  onToggleGroup,
  pendentesCount = 0,
  recorrenciasCount = 0,
  mobile = false,
}: {
  path: string;
  collapsed: boolean;
  expanded: Record<string, boolean>;
  onToggleCollapsed: () => void;
  onToggleGroup: (id: string) => void;
  pendentesCount?: number;
  recorrenciasCount?: number;
  mobile?: boolean;
}) {
  return (
    <>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        {/* Só o ícone da logo — sem texto "Aurora" nem "Gestão financeira" */}
        <Link
          to={"/admin" as string}
          aria-label="Aurora · ir para Dashboard"
          className={`inline-flex items-center text-white ${collapsed ? "justify-center w-full" : ""}`}
        >
          <span style={{ color: "var(--sage)" }}>
            <LogoMark size={28} />
          </span>
        </Link>
        {!mobile && !collapsed && (
          <button
            onClick={onToggleCollapsed}
            aria-label="Recolher menu"
            className="opacity-50 hover:opacity-100 transition-opacity"
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 11,
            }}
          >
            ◀
          </button>
        )}
        {mobile && (
          <button
            onClick={onToggleCollapsed}
            aria-label="Fechar"
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 12,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Toggle collapsed (quando colapsado, fica visível como botão central) */}
      {!mobile && collapsed && (
        <button
          onClick={onToggleCollapsed}
          aria-label="Expandir menu"
          className="mx-3 my-3 opacity-60 hover:opacity-100 transition-opacity"
          style={{
            height: 28,
            borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 11,
          }}
        >
          ▶
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pt-2 pb-4 flex flex-col gap-1">
        {GROUPS.map((group) => {
          const isOpen = expanded[group.id] ?? true;
          const hasActive = group.items.some((it) => isActive(path, it.to));
          return (
            <div key={group.id} className="flex flex-col">
              {!collapsed && (
                <button
                  onClick={() => onToggleGroup(group.id)}
                  className="flex items-center justify-between px-3 py-2.5 text-[11px] uppercase transition-colors"
                  style={{
                    letterSpacing: "2.5px",
                    color: hasActive ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.5)",
                    fontWeight: 600,
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{group.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      transition: "transform 0.25s",
                      transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                      opacity: 0.6,
                    }}
                  >
                    ▶
                  </span>
                </button>
              )}
              {collapsed && (
                <div
                  className="mx-3 my-2"
                  style={{
                    height: 1,
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
              )}
              <div
                style={{
                  maxHeight: collapsed ? "none" : isOpen ? 400 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.32s cubic-bezier(.22,.61,.36,1)",
                }}
              >
                {group.items.map((item) => {
                  const active = isActive(path, item.to);
                  const badge =
                    item.to === "/admin/pendentes"
                      ? pendentesCount
                      : item.to === "/admin/recorrencias"
                        ? recorrenciasCount
                        : 0;
                  return (
                    <Link
                      key={item.to}
                      to={item.to as string}
                      title={collapsed ? item.label : undefined}
                      className="group relative flex items-center gap-3 mx-1.5 my-0.5 transition-all"
                      style={{
                        padding: collapsed ? "12px" : "11px 14px",
                        justifyContent: collapsed ? "center" : undefined,
                        color: active ? "#fff" : "rgba(255,255,255,.78)",
                        background: active
                          ? "linear-gradient(135deg, rgba(143,166,136,0.28), rgba(143,166,136,0.10))"
                          : "transparent",
                        borderRadius: 10,
                        fontWeight: active ? 500 : 400,
                        fontSize: 14,
                        lineHeight: 1.2,
                      }}
                    >
                      {active && (
                        <span
                          aria-hidden
                          style={{
                            position: "absolute",
                            left: -2,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 3,
                            height: 22,
                            background: "var(--sage)",
                            borderRadius: 999,
                            boxShadow: "0 0 12px rgba(143,166,136,0.6)",
                          }}
                        />
                      )}
                      <span
                        aria-hidden
                        style={{
                          width: 20,
                          height: 20,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: active ? "var(--sage)" : "rgba(255,255,255,0.6)",
                          fontSize: 15,
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && <span className="flex-1 whitespace-nowrap">{item.label}</span>}
                      {!collapsed && badge > 0 && (
                        <span
                          className="text-[9px] px-2 py-0.5"
                          style={{
                            background: "linear-gradient(135deg, var(--tan), #9F7E59)",
                            color: "#fff",
                            letterSpacing: "0.5px",
                            fontWeight: 600,
                            borderRadius: 999,
                            boxShadow: "0 2px 6px -2px rgba(184,149,106,0.55)",
                            lineHeight: 1.4,
                          }}
                        >
                          {badge}
                        </span>
                      )}
                      {collapsed && badge > 0 && (
                        <span
                          aria-hidden
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            width: 8,
                            height: 8,
                            background: "var(--tan)",
                            borderRadius: 999,
                            border: "1px solid var(--navy)",
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer sidebar */}
      <div
        className="px-4 py-3 flex items-center justify-between text-[8px] uppercase"
        style={{
          letterSpacing: "2px",
          color: "rgba(255,255,255,.32)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {!collapsed ? (
          <>
            <span>v0.1</span>
            <span>Abril · 2026</span>
          </>
        ) : (
          <span className="w-full text-center">v0.1</span>
        )}
      </div>
    </>
  );
}

function DropdownItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] transition-colors hover:bg-[#F9F9F7]"
      style={{ color: "var(--foreground)" }}
    >
      <span style={{ color: "var(--sage)", fontSize: 13, width: 16, textAlign: "center" }}>{icon}</span>
      {label}
    </button>
  );
}

// Mapa de identidade visual por rota — cada módulo tem ícone + acento
type ModuleIdentity = {
  icon: string;
  accent: string;
  accentSoft: string;
  group: string;
};

const MODULE_MAP: Record<string, ModuleIdentity> = {
  "/admin": { icon: "▦", accent: "var(--navy)", accentSoft: "rgba(27,57,77,0.10)", group: "Visão" },
  "/admin/clientes": { icon: "◷", accent: "var(--sage)", accentSoft: "rgba(143,166,136,0.12)", group: "Visão" },
  "/admin/dfc": { icon: "◈", accent: "var(--navy)", accentSoft: "rgba(27,57,77,0.10)", group: "Visão" },
  "/admin/relatorios": { icon: "≡", accent: "var(--navy)", accentSoft: "rgba(27,57,77,0.10)", group: "Visão" },
  "/admin/importar": { icon: "↓", accent: "var(--tan)", accentSoft: "rgba(184,149,106,0.14)", group: "Operação" },
  "/admin/pendentes": { icon: "⊙", accent: "var(--tan)", accentSoft: "rgba(184,149,106,0.14)", group: "Operação" },
  "/admin/recorrencias": { icon: "↺", accent: "var(--sage)", accentSoft: "rgba(143,166,136,0.12)", group: "Operação" },
  "/admin/pipeline": { icon: "⋯", accent: "var(--green)", accentSoft: "rgba(74,103,65,0.12)", group: "Comercial" },
  "/admin/propostas": { icon: "✎", accent: "var(--green)", accentSoft: "rgba(74,103,65,0.12)", group: "Comercial" },
  "/admin/contratos": { icon: "❍", accent: "var(--green)", accentSoft: "rgba(74,103,65,0.12)", group: "Comercial" },
  "/admin/servicos": { icon: "◇", accent: "var(--tan)", accentSoft: "rgba(184,149,106,0.14)", group: "Catálogo" },
  "/admin/insights/precificacao": { icon: "↗", accent: "var(--tan)", accentSoft: "rgba(184,149,106,0.14)", group: "Catálogo" },
};

function resolveModule(pathname: string): ModuleIdentity {
  // Casa o prefixo mais longo
  const sorted = Object.keys(MODULE_MAP).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (pathname.startsWith(key)) return MODULE_MAP[key];
  }
  return MODULE_MAP["/admin"];
}

/**
 * PageHeader simples — só título + ação opcional à direita.
 * Sistema funcional, sem decoração (sem ícone, sem cap/eyebrow, sem
 * descrição, sem emphasis italic).
 *
 * Mantém os params `cap`, `emphasis` e `description` na API por
 * compatibilidade com as chamadas existentes nas rotas admin, mas eles
 * não são renderizados. O breadcrumb do topo já comunica em qual módulo
 * o usuário está.
 */
export function PageHeader({
  title,
  right,
}: {
  cap?: string;
  title: string;
  emphasis?: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div
      className="px-6 lg:px-10 py-6 flex items-center justify-between gap-4 flex-wrap"
      style={{
        background: "#FFFFFF",
      }}
    >
      <h1
        className="aurora-serif"
        style={{
          fontSize: 28,
          fontWeight: 300,
          lineHeight: 1.15,
          letterSpacing: "-0.6px",
          color: "var(--foreground)",
        }}
      >
        {title}
      </h1>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
