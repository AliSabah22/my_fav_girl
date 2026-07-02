"use client";
import { useEffect, useRef } from "react";
import { threadPaths } from "../lib/soulThreadPath";

interface SoulThreadProps {
  stageIndex: number;
  totalStages: number;
  getAmplitude: () => number;
}

export default function SoulThread({ stageIndex, totalStages, getAmplitude }: SoulThreadProps) {
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const stageOpacity = 0.4 + 0.4 * (totalStages <= 1 ? 0 : stageIndex / (totalStages - 1));

    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    window.addEventListener("resize", handleResize);

    function applyOpacity(opacity: number) {
      path1Ref.current?.style.setProperty("opacity", opacity.toFixed(3));
      path2Ref.current?.style.setProperty("opacity", opacity.toFixed(3));
    }

    if (reducedMotion) {
      const { d1, d2 } = threadPaths(0, width, height);
      path1Ref.current?.setAttribute("d", d1);
      path2Ref.current?.setAttribute("d", d2);
      applyOpacity(stageOpacity);
      return () => window.removeEventListener("resize", handleResize);
    }

    let frame: number;
    function tick() {
      const t = performance.now() / 1000;
      const { d1, d2 } = threadPaths(t, width, height);
      path1Ref.current?.setAttribute("d", d1);
      path2Ref.current?.setAttribute("d", d2);
      const amplitude = getAmplitude();
      applyOpacity(stageOpacity * (1 + amplitude * 0.3));
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [stageIndex, totalStages, getAmplitude]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[8]" aria-hidden="true">
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <path
          ref={path1Ref}
          fill="none"
          stroke="#ff8fab"
          strokeWidth={1.6}
          style={{ filter: "drop-shadow(0 0 8px #ff8fab)" }}
        />
        <path
          ref={path2Ref}
          fill="none"
          stroke="#ff6f91"
          strokeWidth={1.6}
          style={{ filter: "drop-shadow(0 0 8px #ff6f91)" }}
        />
      </svg>
    </div>
  );
}
