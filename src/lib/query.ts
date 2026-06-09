import { QueryClient } from "@tanstack/react-query";

let _qc: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (_qc) return _qc;
  _qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  });
  return _qc;
}
