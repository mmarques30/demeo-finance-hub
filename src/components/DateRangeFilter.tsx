interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  maxDate?: string;
  onStartChange: (d: string) => void;
  onEndChange: (d: string) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  maxDate,
  onStartChange,
  onEndChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[11px] uppercase"
        style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)", fontWeight: 500 }}
      >
        De
      </span>
      <input
        type="date"
        value={startDate}
        max={endDate}
        onChange={(e) => onStartChange(e.target.value)}
        className="text-[12px] px-3 py-2 outline-none"
        style={{
          border: "1px solid var(--line)",
          color: "var(--foreground)",
          background: "#fff",
          borderRadius: "var(--radius-sm)",
        }}
      />
      <span
        className="text-[11px] uppercase"
        style={{ letterSpacing: "1.5px", color: "var(--muted-foreground)", fontWeight: 500 }}
      >
        Até
      </span>
      <input
        type="date"
        value={endDate}
        min={startDate}
        max={maxDate}
        onChange={(e) => onEndChange(e.target.value)}
        className="text-[12px] px-3 py-2 outline-none"
        style={{
          border: "1px solid var(--line)",
          color: "var(--foreground)",
          background: "#fff",
          borderRadius: "var(--radius-sm)",
        }}
      />
    </div>
  );
}
