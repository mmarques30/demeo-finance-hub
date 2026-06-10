// Dobra com design — curva + linha gradient + tint suave.
// Substitui WaveDivider quando a transição precisa de "presença" visual.
import { useId } from "react";

type Accent = "forest" | "steel" | "sage";

type Props = {
  topColor: string;
  bottomColor: string;
  height?: number;
  accent?: Accent;
};

const ACCENTS: Record<Accent, { stroke1: string; stroke2: string; fill: string }> = {
  forest: {
    stroke1: "rgba(40,76,43,0.28)",
    stroke2: "rgba(109,146,166,0.26)",
    fill: "rgba(40,76,43,0.06)",
  },
  steel: {
    stroke1: "rgba(109,146,166,0.32)",
    stroke2: "rgba(40,76,43,0.24)",
    fill: "rgba(109,146,166,0.07)",
  },
  sage: {
    stroke1: "rgba(153,169,137,0.5)",
    stroke2: "rgba(109,146,166,0.4)",
    fill: "rgba(153,169,137,0.1)",
  },
};

export function DesignedFold({ topColor, bottomColor, height = 96, accent = "forest" }: Props) {
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  const a = ACCENTS[accent];

  const curve = "M0,60 C360,20 720,100 1080,40 C1260,15 1380,32 1440,56";
  const fillBelow = `${curve} L1440,120 L0,120 Z`;

  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: "100%",
        height,
        marginTop: -1,
        marginBottom: -1,
        background: topColor,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        width="100%"
        height={height}
        style={{ display: "block", position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <linearGradient id={`fold-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={a.fill} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <linearGradient id={`fold-stroke-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="35%" stopColor={a.stroke1} />
            <stop offset="65%" stopColor={a.stroke2} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>
        {/* Bottom region — pinta o lado de baixo da curva com a cor da próxima dobra */}
        <path d={fillBelow} fill={bottomColor} />
        {/* Tint suave logo abaixo da curva, vai se diluindo */}
        <path d={fillBelow} fill={`url(#fold-fill-${id})`} />
        {/* Linha gradient sobre a curva — o "vinco" da dobra */}
        <path
          d={curve}
          fill="none"
          stroke={`url(#fold-stroke-${id})`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
