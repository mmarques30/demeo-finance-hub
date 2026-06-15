import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDatePtBR(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

export function monthOptions(count = 6): string[] {
  const opts: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    opts.push(`${mm}/${date.getFullYear()}`);
  }
  return opts;
}

export function monthRangeDates(mmyyyy: string): { start: string; end: string } {
  const [mm, yyyy] = mmyyyy.split("/");
  const start = `${yyyy}-${mm}-01`;
  const lastDay = new Date(Number(yyyy), Number(mm), 0).getDate();
  const end = `${yyyy}-${mm}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function currentMonthStr(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${mm}/${now.getFullYear()}`;
}

export function currentMonthLabel(): string {
  return new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
