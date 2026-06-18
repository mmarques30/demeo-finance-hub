export function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function firstOfMonthISO(offsetMonths = 0): string {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() + offsetMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function lastOfMonthISO(offsetMonths = 0): string {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() + offsetMonths + 1, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function firstOfYearISO(): string {
  return `${new Date().getFullYear()}-01-01`;
}
