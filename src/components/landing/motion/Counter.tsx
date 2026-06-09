// Counter que anima de 0 até o valor quando entra no viewport.
import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function Counter({
  value,
  prefix,
  suffix,
  format,
  duration = 1600,
  className,
  style,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(value);
      return;
    }
    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started) return;
        started = true;
        io.disconnect();
        const t0 = performance.now();
        let raf = 0;
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - t, 3); // cubic out
          setVal(value * eased);
          if (t < 1) raf = requestAnimationFrame(tick);
          else setVal(value);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  const formatted = format
    ? format(val)
    : val.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
