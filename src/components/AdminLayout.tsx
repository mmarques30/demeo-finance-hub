import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogoMark } from "./Logo";
import { supabase } from "@/lib/supabase";
import { useSession, useIsAdmin } from "@/lib/auth";
import { useClickOutside, useLocalStorage } from "@/hooks/useClickOutside";
import { usePushNotifications } from "@/hooks/usePushNotifications";

type SidebarItem = {
  to: string;
  label: string;
  icon: string;
  subLabel?: string;   // header do sub-grupo (renderizado como botão toggle)
  subGroupId?: string; // id do sub-grupo ao qual este item pertence
  indent?: boolean;
};
type SidebarGroup = { id: string; label: string; items: SidebarItem[] };

const GROUPS: SidebarGroup[] = [
  {
    id: "visao",
    label: "Visão",
    items: [
      { to: "/admin/", label: "Dashboard", icon: "▦" },
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
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    items: [
      { to: "/admin/pipeline", label: "Pipeline", icon: "⋯" },
      { to: "/admin/propostas", label: "Propostas", icon: "✎", subLabel: "Documentos", subGroupId: "documentos", indent: true },
      { to: "/admin/contratos", label: "Contratos", icon: "❍", subGroupId: "documentos", indent: true },
      { to: "/admin/insights/precificacao", label: "Precificação", icon: "↗", subLabel: "Serviços", subGroupId: "servicos", indent: true },
    ],
  },
  {
    id: "configuracao",
    label: "Configuração",
    items: [
      { to: "/admin/categorias", label: "Categorias", icon: "⊞" },
      { to: "/admin/regras", label: "Regras de Classificação", icon: "⊟" },
      { to: "/admin/usuarios", label: "Usuários do Portal", icon: "◫" },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

function isActive(pathname: string, to: string) {
  if (to === "/admin/") return pathname === "/admin/" || pathname === "/admin";
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
  const navigate = useNavigate();

  const { data: session, isLoading: sessionLoading } = useSession();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  // Guard: sem sessão → login; sessão mas não admin → portal
  // sessionLoading protege contra redirect prematuro no primeiro render (antes de ler localStorage)
  useEffect(() => {
    console.log("[AdminLayout guard]", { sessionLoading, adminLoading, userId: session?.user?.id, isAdmin });
    if (sessionLoading) return;
    if (!session) { navigate({ to: "/login" }); return; }
    if (!adminLoading && isAdmin === false) {
      console.warn("[AdminLayout] isAdmin=false → redirect /portal. role provavelmente é 'owner', não 'admin'.");
      navigate({ to: "/portal" });
    }
  }, [session, sessionLoading, isAdmin, adminLoading, navigate]);

  const adminEmail = session?.user?.email ?? "";
  const adminName = (session?.user?.user_metadata?.display_name ?? adminEmail) || "Admin";
  const adminRole = "Gestora";
  const adminInitials = adminName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  const push = usePushNotifications();
  const showBell = !!adminEmail && push.isSupported;

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

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

  const [getCollapsed, setCollapsed] = useLocalStorage<boolean>("aurora.admin.collapsed", false);
  const [getExpanded, setExpanded] = useLocalStorage<Record<string, boolean>>("aurora.admin.groups", {});

  const [collapsed, setCollapsedState] = useState<boolean>(false);
  const [expanded, setExpandedState] = useState<Record<string, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement | null>(null);

  // Hidrata do localStorage no client-side
  useEffect(() => {
    setCollapsedState(getCollapsed());
    setExpandedState(getExpanded());
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
          background: "linear-gradient(180deg, #1C2D45 0%, #111E2E 100%)",
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
              background: "linear-gradient(180deg, var(--navy) 0%, #111E2E 100%)",
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
              <Link
                to="/admin"
                className="hidden sm:inline hover:opacity-70 transition-opacity"
                style={{ color: "var(--muted-foreground)", textDecoration: "none" }}
              >
                Aurora
              </Link>
              <span className="hidden sm:inline" style={{ color: "rgba(0,0,0,0.2)" }}>/</span>
              <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
                {ALL_ITEMS.find((i) => isActive(path, i.to))?.label ?? "Painel"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bell: push notifications (admin only) */}
            {showBell && (
              <button
                onClick={() =>
                  push.isSubscribed ? push.unsubscribe() : push.subscribe(adminEmail)
                }
                disabled={push.loading}
                title={push.isSubscribed ? "Desativar notificações push" : "Ativar notificações push"}
                className="flex items-center justify-center transition-all"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: "1px solid #EFEFEF",
                  background: push.isSubscribed ? "rgba(40,76,43,0.07)" : "transparent",
                  color: push.isSubscribed ? "var(--green)" : "var(--muted-foreground)",
                  cursor: push.loading ? "wait" : "pointer",
                  opacity: push.loading ? 0.6 : 1,
                }}
              >
                {push.isSubscribed ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                )}
              </button>
            )}

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
                    boxShadow: "0 4px 12px -4px rgba(40,76,43,0.45)",
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
                    boxShadow: "0 1px 2px rgba(28,45,69,0.04), 0 24px 48px -16px rgba(40,76,43,0.22)",
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
  mobile = false,
}: {
  path: string;
  collapsed: boolean;
  expanded: Record<string, boolean>;
  onToggleCollapsed: () => void;
  onToggleGroup: (id: string) => void;
  pendentesCount?: number;
  mobile?: boolean;
}) {
  const [subExpanded, setSubExpanded] = useState<Record<string, boolean>>({});
  function toggleSubGroup(id: string) {
    setSubExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        {/* Só o ícone da logo — sem texto "Aurora" nem "Gestão financeira" */}
        <Link
          to={"/admin/" as string}
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
            className="opacity-60 hover:opacity-100 transition-opacity"
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.85)",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
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
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
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
          className="mx-3 my-3 opacity-70 hover:opacity-100 transition-opacity"
          style={{
            height: 28,
            borderRadius: 8,
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.90)",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            width: "calc(100% - 24px)",
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
                      : 0;
                  const subOpen = item.subGroupId ? (subExpanded[item.subGroupId] ?? false) : true;
                  return (
                    <div key={item.to}>
                      {!collapsed && item.subLabel && (
                        <button
                          onClick={() => item.subGroupId && toggleSubGroup(item.subGroupId)}
                          className="flex items-center justify-between w-full px-3 pt-3 pb-1 text-[9px] uppercase transition-colors hover:opacity-80"
                          style={{
                            letterSpacing: "2px",
                            color: "rgba(255,255,255,0.45)",
                            fontWeight: 600,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <span>{item.subLabel}</span>
                          <span
                            style={{
                              fontSize: 8,
                              transition: "transform 0.22s",
                              transform: subOpen ? "rotate(90deg)" : "rotate(0)",
                              opacity: 0.7,
                            }}
                          >
                            ▶
                          </span>
                        </button>
                      )}
                    {subOpen && <Link
                      to={item.to as string}
                      title={collapsed ? item.label : undefined}
                      className="group relative flex items-center gap-3 mx-1.5 my-0.5 transition-all"
                      style={{
                        padding: collapsed ? "12px" : "11px 14px",
                        paddingLeft: !collapsed && item.indent ? "22px" : undefined,
                        justifyContent: collapsed ? "center" : undefined,
                        color: active ? "#fff" : "rgba(255,255,255,.78)",
                        background: active
                          ? "linear-gradient(135deg, rgba(153,169,137,0.28), rgba(153,169,137,0.10))"
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
                            boxShadow: "0 0 12px rgba(153,169,137,0.6)",
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
                    </Link>}
                    </div>
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
  "/admin": { icon: "▦", accent: "var(--navy)", accentSoft: "rgba(28,45,69,0.10)", group: "Visão" },
  "/admin/clientes": { icon: "◷", accent: "var(--sage)", accentSoft: "rgba(153,169,137,0.12)", group: "Visão" },
  "/admin/clientes/": { icon: "◷", accent: "var(--sage)", accentSoft: "rgba(153,169,137,0.12)", group: "Visão" },
  "/admin/dfc": { icon: "◈", accent: "var(--navy)", accentSoft: "rgba(28,45,69,0.10)", group: "Visão" },
  "/admin/relatorios": { icon: "≡", accent: "var(--navy)", accentSoft: "rgba(28,45,69,0.10)", group: "Visão" },
  "/admin/importar": { icon: "↓", accent: "var(--tan)", accentSoft: "rgba(184,149,106,0.14)", group: "Operação" },
  "/admin/pendentes": { icon: "⊙", accent: "var(--tan)", accentSoft: "rgba(184,149,106,0.14)", group: "Operação" },
  "/admin/pipeline": { icon: "⋯", accent: "var(--green)", accentSoft: "rgba(40,76,43,0.12)", group: "Comercial" },
  "/admin/propostas": { icon: "✎", accent: "var(--green)", accentSoft: "rgba(40,76,43,0.12)", group: "Comercial" },
  "/admin/contratos": { icon: "❍", accent: "var(--green)", accentSoft: "rgba(40,76,43,0.12)", group: "Comercial" },
  "/admin/servicos": { icon: "◇", accent: "var(--tan)", accentSoft: "rgba(184,149,106,0.14)", group: "Comercial" },
  "/admin/insights/precificacao": { icon: "↗", accent: "var(--tan)", accentSoft: "rgba(184,149,106,0.14)", group: "Comercial" },
  "/admin/categorias": { icon: "⊞", accent: "var(--sage)", accentSoft: "rgba(153,169,137,0.12)", group: "Configuração" },
  "/admin/regras": { icon: "⊟", accent: "var(--sage)", accentSoft: "rgba(153,169,137,0.12)", group: "Configuração" },
  "/admin/usuarios": { icon: "◫", accent: "var(--sage)", accentSoft: "rgba(153,169,137,0.12)", group: "Configuração" },
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
          fontSize: "var(--title-page)",
          fontWeight: 300,
          lineHeight: 1.15,
          letterSpacing: "-0.8px",
          color: "var(--foreground)",
        }}
      >
        {title}
      </h1>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
