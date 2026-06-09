// Background ambient animado — mesh gradient + 3 blobs flutuando.
// Sem fundo branco morto. Tudo se move sutilmente.
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1, overflow: "hidden" }}
    >
      <div
        className="absolute"
        style={{
          inset: 0,
          background: "linear-gradient(180deg, #FAFAF8 0%, #FFFFFF 50%, #FAFAF8 100%)",
        }}
      />
      {/* Blob 1 — sage */}
      <div
        className="absolute"
        style={{
          left: "-10%",
          top: "5%",
          width: 720,
          height: 720,
          background:
            "radial-gradient(circle, rgba(153,169,137,0.32) 0%, transparent 60%)",
          filter: "blur(60px)",
          borderRadius: "50%",
          animation: "ambient-drift-1 28s ease-in-out infinite",
        }}
      />
      {/* Blob 2 — steel */}
      <div
        className="absolute"
        style={{
          right: "-15%",
          top: "30%",
          width: 800,
          height: 800,
          background:
            "radial-gradient(circle, rgba(109,146,166,0.22) 0%, transparent 60%)",
          filter: "blur(80px)",
          borderRadius: "50%",
          animation: "ambient-drift-2 36s ease-in-out infinite",
        }}
      />
      {/* Blob 3 — forest */}
      <div
        className="absolute"
        style={{
          left: "20%",
          bottom: "-10%",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(40,76,43,0.18) 0%, transparent 60%)",
          filter: "blur(70px)",
          borderRadius: "50%",
          animation: "ambient-drift-3 32s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes ambient-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(80px, -40px) scale(1.08); }
          66%      { transform: translate(-40px, 60px) scale(0.94); }
        }
        @keyframes ambient-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-90px, 50px) scale(1.12); }
        }
        @keyframes ambient-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(60px, -70px) scale(0.92); }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="ambient"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
