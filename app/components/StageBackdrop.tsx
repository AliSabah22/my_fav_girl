"use client";
import { useEffect, useRef } from "react";

interface StageBackdropProps {
  getAmplitude: () => number;
}

export default function StageBackdrop({ getAmplitude }: StageBackdropProps) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      if (glow) {
        glow.style.opacity = "1";
        glow.style.transform = "scale(1)";
      }
      return;
    }

    let frame: number;
    function tick() {
      if (glow) {
        const amplitude = getAmplitude();
        const t = performance.now() / 1000;
        const breathePhase = (Math.sin((t / 6) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
        const scale = 1 + breathePhase * 0.05;
        const opacity = 0.7 + breathePhase * 0.3;
        const boost = 1 + amplitude * 0.4;
        glow.style.opacity = opacity.toFixed(3);
        glow.style.transform = `scale(${(scale * boost).toFixed(3)})`;
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
