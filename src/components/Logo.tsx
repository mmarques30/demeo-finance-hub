interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 22, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="0" y="12" width="5" height="10" rx="2.5" fill="currentColor" />
      <rect x="8.5" y="6" width="5" height="16" rx="2.5" fill="currentColor" opacity="0.7" />
      <rect x="17" y="0" width="5" height="22" rx="2.5" fill="currentColor" opacity="0.45" />
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
        className={textClassName ?? "dm-serif text-[17px]"}
        style={{ fontWeight: 500, letterSpacing: "0.3px" }}
      >
        De Meo
      </span>
    </span>
  );
}
