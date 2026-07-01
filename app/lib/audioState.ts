import type { Stage } from "../types";

export function getActiveStage(stages: Stage[], currentTime: number): Stage | null {
  return stages.find((s) => currentTime >= s.windowStart && currentTime < s.windowEnd) ?? null;
}

export function getRevealedLines(
  stage: Stage,
  currentTime: number
): { text: string; emphasis: boolean }[] {
  return stage.lines
    .filter((line) => currentTime >= line.time)
    .map((line) => ({ text: line.text, emphasis: line.emphasis ?? false }));
}

export function isInPhotoInterlude(
  interlude: { windowStart: number; windowEnd: number },
  currentTime: number
): boolean {
  return currentTime >= interlude.windowStart && currentTime < interlude.windowEnd;
}

export function getPhotoProgress(
  interlude: { windowStart: number; windowEnd: number },
  currentTime: number
): number {
  const { windowStart, windowEnd } = interlude;
  if (windowEnd <= windowStart) return 0;
  const raw = (currentTime - windowStart) / (windowEnd - windowStart);
  return Math.min(1, Math.max(0, raw));
}

export type PhotoPhase = "burst-in" | "spotlight" | "settle";

export function getPhotoPhase(progress: number): PhotoPhase {
  if (progress < 0.15) return "burst-in";
  if (progress < 0.9) return "spotlight";
  return "settle";
}

export function getSpotlightIndex(progress: number, photoCount: number): number {
  if (photoCount <= 0) return 0;
  const cycleProgress = (progress - 0.15) / (0.9 - 0.15);
  const clamped = Math.min(0.999, Math.max(0, cycleProgress));
  return Math.floor(clamped * photoCount);
}

export function getNextStageWindowStart(stages: Stage[], currentStageId: string): number | null {
  const idx = stages.findIndex((s) => s.id === currentStageId);
  if (idx === -1 || idx === stages.length - 1) return null;
  return stages[idx + 1].windowStart;
}

export function getPhotoInterludeExitTarget(
  interlude: { windowEnd: number },
  stages: Stage[]
): number | null {
  const next = stages.find((s) => s.windowStart === interlude.windowEnd);
  return next ? next.windowStart : null;
}
