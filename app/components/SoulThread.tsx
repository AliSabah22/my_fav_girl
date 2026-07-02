"use client";
import { useEffect, useRef } from "react";
import { threadPaths } from "../lib/soulThreadPath";

interface SoulThreadProps {
  stageIndex: number;
  totalStages: number;
  getAmplitude: () => number;
  currentTime: number;
  interactiveWindow: { start: number; end: number };
}

const DISTANCE_FOR_FULL_MERGE = 12000;

export default function SoulThread({
  stageIndex,
  totalStages,
  getAmplitude,
  currentTime,
  interactiveWindow,
}: SoulThreadProps) {
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const currentTimeRef = useRef(currentTime);
  const cumulativeDistanceRef = useRef(0);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lockedMergeRef = useRef(false);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

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

    function handlePointerMove(e: PointerEvent) {
      const t = currentTimeRef.current;
      const inWindow = t > interactiveWindow.start && t <= interactiveWindow.end;
      if (!inWindow) {
        lastPointerRef.current = null;
        return;
      }
      const last = lastPointerRef.current;
      if (last) {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        cumulativeDistanceRef.current += Math.sqrt(dx * dx + dy * dy);
      }
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener("pointermove", handlePointerMove);

    function applyOpacity(opacity: number) {
      path1Ref.current?.style.setProperty("opacity", opacity.toFixed(3));
      path2Ref.current?.style.setProperty("opacity", opacity.toFixed(3));
    }

    function computeMergeProgress(): number {
      const t = currentTimeRef.current;
      if (t <= interactiveWindow.start) {
        lockedMergeRef.current = false;
        cumulativeDistanceRef.current = 0;
        lastPointerRef.current = null;
        return 0;
      }
      if (t > interactiveWindow.end) {
        lockedMergeRef.current = true;
        return 1;
      }
      if (lockedMergeRef.current) return 1;
      const baseline = (t - interactiveWindow.start) / (interactiveWindow.end - interactiveWindow.start);
      const pointerProgress = Math.min(1, cumulativeDistanceRef.current / DISTANCE_FOR_FULL_MERGE);
      return Math.min(1, Math.max(baseline, pointerProgress));
    }

    if (reducedMotion) {
      const mergeProgress = computeMergeProgress();
      const { d1, d2 } = threadPaths(0, width, height, mergeProgress);
      path1Ref.current?.setAttribute("d", d1);
      path2Ref.current?.setAttribute("d", d2);
      applyOpacity(stageOpacity);
      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("pointermove", handlePointerMove);
      };
    }

    let frame: number;
    function tick() {
      const t = performance.now() / 1000;
      const mergeProgress = computeMergeProgress();
      const { d1, d2 } = threadPaths(t, width, height, mergeProgress);
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
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [stageIndex, totalStages, getAmplitude, interactiveWindow.start, interactiveWindow.end]);

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
