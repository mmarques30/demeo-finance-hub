import { Outlet, Link, createRootRoute, HeadContent, Scripts, redirect } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { getQueryClient } from "../lib/query";
import { supabase } from "../lib/supabase";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const path = location.pathname;
    // Setup é página especial — sempre passa (auto-blocks se já tem admin)
    if (path === "/admin/setup") return;
    // Guard só em /admin/*
    if (!path.startsWith("/admin")) return;
    // Roda apenas no browser (SSR não tem sessão)
    if (typeof window === "undefined") return;
    try {
      const sb = supabase();
      const { data: sessionData } = await sb.auth.getSession();
      const session = sessionData.session;
      if (!session?.user) {
        throw redirect({ to: "/login" });
      }
      const { data: profile } = await sb
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile?.role !== "admin") {
        throw redirect({ to: "/portal" });
      }
    } catch (e) {
      // Re-lança redirect; engole apenas erros de leitura (banco indisponível)
      if (e && typeof e === "object" && "to" in e) throw e;
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aurora · Gestão Financeira para Empresas" },
      { name: "description", content: "Plataforma multi-cliente da Aurora" },
      { property: "og:title", content: "Aurora · Gestão Financeira para Empresas" },
      { property: "og:description", content: "Plataforma multi-cliente da Aurora" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Aurora · Gestão Financeira para Empresas" },
      { name: "twitter:description", content: "Plataforma multi-cliente da Aurora" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1de17e07-7ac7-47bf-978b-1b0494ae0e46/id-preview-c501635a--0bbab5d0-6726-45bd-92b2-f096965588c7.lovable.app-1781052305153.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1de17e07-7ac7-47bf-978b-1b0494ae0e46/id-preview-c501635a--0bbab5d0-6726-45bd-92b2-f096965588c7.lovable.app-1781052305153.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/brand/aurora-favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,200;0,300;0,400;0,500;1,200;1,300;1,400&family=Space+Grotesk:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
