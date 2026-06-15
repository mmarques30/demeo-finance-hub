import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCategories(clientId: string): string[] {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!clientId) return;
    supabase
      .from("categories")
      .select("name")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCategories(data.map((c) => c.name));
        }
      });
  }, [clientId]);

  return categories;
}
