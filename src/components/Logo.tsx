// Aurora — símbolo v3 — 3 barras ascendentes
// (herança visual De Meo) com opacidade decrescente
// 100% / 60% / 32% representando crescimento progressivo.
interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 22, className }: LogoProps) {
  const height = Math.round((size * 86) / 58);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 58 86"
      fill="none"
      className={className}
      aria-label="Aurora"
    >
      <rect x="0" y="44" width="14" height="42" rx="3" fill="currentColor" />
      <rect x="22" y="22" width="14" height="64" rx="3" fill="currentColor" opacity="0.6" />
      <rect x="44" y="2" width="14" height="84" rx="3" fill="currentColor" opacity="0.32" />
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
        className={textClassName ?? "aurora-serif text-[18px]"}
        style={{ fontWeight: 400, letterSpacing: "-0.3px" }}
      >
        Aurora
      </span>
    </span>
  );
}
