"use client";
import { useEffect, useRef } from "react";
import { randomTrailRgb } from "../lib/cursorTrail";

interface CursorTrailProps {
  getAmplitude: () => number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
  rgb: [number, number, number];
}

const FADE_FRAMES = 70;

export default function CursorTrail({ getAmplitude }: CursorTrailProps) {
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
      pointsRef.current.push({ x: e.clientX, y: e.clientY, age: 0, rgb: randomTrailRgb() });
      if (pointsRef.current.length > 40) pointsRef.current.shift();
    }
    window.addEventListener("mousemove", handleMove);

    let frame: number;
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const amplitude = getAmplitude();
      pointsRef.current = pointsRef.current
        .map((p) => ({ ...p, age: p.age + 1 }))
        .filter((p) => p.age < FADE_FRAMES);
      for (const p of pointsRef.current) {
        const fade = 1 - p.age / FADE_FRAMES;
        const radius = 6 * fade * (1 + amplitude * 0.5);
        ctx!.shadowBlur = 6;
        ctx!.shadowColor = `rgba(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}, ${fade * 0.6})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}, ${fade * 0.5})`;
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
    };
  }, [getAmplitude]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-10" aria-hidden="true" />;
}
