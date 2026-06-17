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

/** Espelha exatamente a lógica de buildPattern() do classify-batch edge function. */
export function buildPattern(raw: string): string {
  const normalized = raw
    .toUpperCase()
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, "")
    .replace(/\b\d+\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return normalized.split(" ").filter(Boolean).slice(0, 3).join(" ");
}

/** Gera CSV com BOM UTF-8 (para Excel reconhecer acentos) e dispara download. */
export function exportToCSV(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  const bom = "﻿";
  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
