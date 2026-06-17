import { Link, useRouterState } from "@tanstack/react-router";

type TabKey = "overview" | "recorrencias" | "contas";

const TABS: { key: TabKey; label: string; suffix: string }[] = [
  { key: "overview",     label: "Visão Geral",   suffix: "" },
  { key: "recorrencias", label: "Recorrências",  suffix: "/recorrencias" },
  { key: "contas",       label: "Contas",         suffix: "/contas" },
];

export function ClientTabs({ clientId }: { clientId: string }) {
  const location = useRouterState({ select: (s) => s.location.pathname });

  function isActive(key: TabKey) {
    if (key === "overview") {
      return (
        location === `/admin/clientes/${clientId}` ||
        location === `/admin/clientes/${clientId}/`
      );
    }
    return location.startsWith(`/admin/clientes/${clientId}/${key}`);
  }

  return (
    <div
      className="flex items-end gap-0 px-8 lg:px-12"
      style={{ borderBottom: "1px solid var(--line)", marginTop: -8 }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.key);
        return (
          <Link
            key={tab.key}
            to={`/admin/clientes/${clientId}${tab.suffix}` as never}
            className="px-5 py-3 text-[11px] uppercase transition-colors"
            style={{
              letterSpacing: "2px",
              fontWeight: 600,
              color: active ? "var(--green)" : "var(--muted-foreground)",
              borderBottom: active ? "2px solid var(--green)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
