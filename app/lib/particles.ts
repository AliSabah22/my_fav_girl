export interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  opacity: number;
}

const BASE_COUNT = 18;
const MAX_COUNT = 60;

export function particleCountForStage(stageIndex: number, totalStages: number): number {
  const ratio = totalStages <= 1 ? 0 : stageIndex / (totalStages - 1);
  return Math.round(BASE_COUNT + (MAX_COUNT - BASE_COUNT) * ratio);
}

export function createParticle(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 0.6 + Math.random() * 1.8,
    speed: 0.15 + Math.random() * 0.35,
    drift: (Math.random() - 0.5) * 0.3,
    opacity: 0.15 + Math.random() * 0.35,
  };
}

export function stepParticle(p: Particle, height: number): Particle {
  const next = { ...p, y: p.y - p.speed, x: p.x + p.drift };
  if (next.y < 0) {
    next.y = height + 10;
  }
  return next;
}
