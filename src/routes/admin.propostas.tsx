import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/propostas")({
  component: () => <Outlet />,
});
