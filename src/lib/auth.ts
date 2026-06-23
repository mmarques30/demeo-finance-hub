import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export function useSession() {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const { data } = await supabase().auth.getSession();
      return data.session;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: () => qc.getQueryData(["auth", "session"]),
  });
}

export function useIsAdmin() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["auth", "isAdmin", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      // Lê de user_roles (padrão Supabase — múltiplos roles por user, RLS dedicada)
      const { data } = await supabase()
        .from("user_roles")
        .select("role")
        .eq("user_id", session!.user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    staleTime: 60_000,
  });
}

export type PortalRole = "owner" | "financeiro";

export function usePortalRole() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["auth", "portalRole", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async (): Promise<PortalRole> => {
      const { data } = await supabase()
        .from("user_client_mapping")
        .select("portal_role")
        .eq("user_id", session!.user.id)
        .maybeSingle();
      return (data?.portal_role as PortalRole) ?? "owner";
    },
    staleTime: 60_000,
  });
}

export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
