// Divisor curvo SVG entre seções — substitui borda reta.
type Props = {
  topColor: string;
  bottomColor: string;
  variant?: "wave" | "curve" | "tilt";
  height?: number;
};

export function WaveDivider({ topColor, bottomColor, variant = "curve", height = 96 }: Props) {
  let path = "";
  if (variant === "wave") {
    path = "M0,40 C320,120 720,-20 1440,60 L1440,120 L0,120 Z";
  } else if (variant === "curve") {
    path = "M0,0 C480,120 960,120 1440,0 L1440,120 L0,120 Z";
  } else if (variant === "tilt") {
    path = "M0,0 L1440,80 L1440,120 L0,120 Z";
  }
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
        <path d={path} fill={bottomColor} />
      </svg>
    </div>
  );
}
