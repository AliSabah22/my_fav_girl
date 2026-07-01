"use client";
import { useEffect, useRef } from "react";
import { particleCountForStage, createParticle, stepParticle, type Particle } from "../lib/particles";

interface FloatingParticlesProps {
  stageIndex: number;
  totalStages: number;
  getAmplitude: () => number;
}

export default function FloatingParticles({ stageIndex, totalStages, getAmplitude }: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const count = particleCountForStage(stageIndex, totalStages);
    particlesRef.current = Array.from({ length: count }, () => createParticle(canvas.width, canvas.height));

    if (reducedMotion) {
      return () => window.removeEventListener("resize", resize);
    }

    let frame: number;
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const speedMultiplier = 1 + getAmplitude() * 0.6;
      particlesRef.current = particlesRef.current.map((p) => stepParticle(p, canvas!.height, speedMultiplier));
      for (const p of particlesRef.current) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(243, 234, 217, ${p.opacity})`;
        ctx!.fill();
      }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [stageIndex, totalStages, getAmplitude]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />;
}
