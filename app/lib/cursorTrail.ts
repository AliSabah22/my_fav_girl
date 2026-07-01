export function lerpColor(
  from: [number, number, number],
  to: [number, number, number],
  t: number
): [number, number, number] {
  const clamped = Math.min(1, Math.max(0, t));
  return [
    Math.round(from[0] + (to[0] - from[0]) * clamped),
    Math.round(from[1] + (to[1] - from[1]) * clamped),
    Math.round(from[2] + (to[2] - from[2]) * clamped),
  ];
}

export const ROSE_RGB: [number, number, number] = [255, 143, 171];
export const GOLD_RGB: [number, number, number] = [255, 111, 145];

export function trailColorForStage(stageIndex: number, totalStages: number): string {
  const t = totalStages <= 1 ? 0 : stageIndex / (totalStages - 1);
  const [r, g, b] = lerpColor(ROSE_RGB, GOLD_RGB, t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function trailRgbForStage(stageIndex: number, totalStages: number): [number, number, number] {
  const t = totalStages <= 1 ? 0 : stageIndex / (totalStages - 1);
  return lerpColor(ROSE_RGB, GOLD_RGB, t);
}

export function randomTrailRgb(): [number, number, number] {
  return lerpColor(ROSE_RGB, GOLD_RGB, Math.random());
}
