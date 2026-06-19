import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useCategories(clientId: string): string[] | null {
  const [categories, setCategories] = useState<string[] | null>(null);

  useEffect(() => {
    if (!clientId) return;
    setCategories(null);
    supabase()
      .from("categories")
      .select("name")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setCategories((data ?? []).map((c) => c.name));
      });
  }, [clientId]);

  return categories;
}
