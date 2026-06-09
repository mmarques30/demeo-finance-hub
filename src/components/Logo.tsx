interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 22, className }: LogoProps) {
  const height = Math.round((size * 48) / 52);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 52 48"
      fill="none"
      className={className}
      aria-label="Aurora"
    >
      <line x1="26" y1="44" x2="26" y2="8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <line x1="26" y1="44" x2="42" y2="16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <line x1="26" y1="44" x2="10" y2="16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <line x1="26" y1="44" x2="51" y2="28" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" opacity={0.35} />
      <line x1="26" y1="44" x2="1" y2="28" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" opacity={0.35} />
      <path d="M4 44 A22 22 0 0 1 48 44" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" />
      <circle cx="26" cy="44" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  size = 20,
  color,
  textClassName,
}: {
  size?: number;
  color?: string;
  textClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5" style={{ color }}>
      <LogoMark size={size} />
      <span
        className={textClassName ?? "aurora-serif text-[17px]"}
        style={{ fontWeight: 500, letterSpacing: "0.3px" }}
      >
        Aurora
      </span>
    </span>
  );
}
