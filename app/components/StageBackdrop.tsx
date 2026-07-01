"use client";
import { useEffect, useRef } from "react";

interface StageBackdropProps {
  getAmplitude: () => number;
}

export default function StageBackdrop({ getAmplitude }: StageBackdropProps) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let frame: number;
    function tick() {
      const glow = glowRef.current;
      if (glow) {
        const amplitude = getAmplitude();
        const boost = 1 + amplitude * 0.4;
        glow.style.setProperty("--amp-boost", boost.toFixed(3));
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [getAmplitude]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        ref={glowRef}
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(255,111,145,0.14), rgba(255,143,171,0.08) 35%, transparent 65%)",
          animation: "breathe 6s ease-in-out infinite",
          transform: "scale(var(--amp-boost, 1))",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
