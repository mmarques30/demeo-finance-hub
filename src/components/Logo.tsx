interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 22, className }: LogoProps) {
  const height = Math.round((size * 72) / 80);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 80 72"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 68 A36 36 0 0 1 76 68"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 68 A26 26 0 0 1 66 68"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.58}
      />
      <path
        d="M24 68 A16 16 0 0 1 56 68"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.28}
      />
      <circle cx="40" cy="68" r="3" fill="currentColor" />
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
        className={textClassName ?? "aura-serif text-[17px]"}
        style={{ fontWeight: 500, letterSpacing: "0.3px" }}
      >
        Aura
      </span>
    </span>
  );
}
