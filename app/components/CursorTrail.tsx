"use client";
import { useEffect, useRef } from "react";
import { trailRgbForStage } from "../lib/cursorTrail";

interface CursorTrailProps {
  stageIndex: number;
  totalStages: number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

export default function CursorTrail({ stageIndex, totalStages }: CursorTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<TrailPoint[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function handleMove(e: MouseEvent) {
      pointsRef.current.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (pointsRef.current.length > 40) pointsRef.current.shift();
    }
    window.addEventListener("mousemove", handleMove);

    const [r, g, b] = trailRgbForStage(stageIndex, totalStages);
    let frame: number;
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      pointsRef.current = pointsRef.current.map((p) => ({ ...p, age: p.age + 1 })).filter((p) => p.age < 30);
      for (const p of pointsRef.current) {
        const opacity = 1 - p.age / 30;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 6 * opacity, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`;
        ctx!.fill();
      }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
    };
  }, [stageIndex, totalStages]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-10" aria-hidden="true" />;
}
