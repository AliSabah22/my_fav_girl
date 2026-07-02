import type { Stage } from "../types";

const THREAD_START = 135;
const THREAD_END = 150;
const REF_AFTER_END = 195;
const CLOSING_BUFFER = 5;

export const THREAD_WINDOW = { start: THREAD_START, end: THREAD_END };

export function scaleStagesToDuration(stages: Stage[], duration: number): Stage[] {
  const refAfterSpan = REF_AFTER_END - THREAD_END;
  const availableAfterSpan = duration - THREAD_END - CLOSING_BUFFER;
  const afterScale = Math.min(1, Math.max(0, availableAfterSpan) / refAfterSpan);

  return stages.map((stage) => {
    if (stage.windowStart < THREAD_START) return stage;
    return {
      ...stage,
      windowStart: THREAD_END + (stage.windowStart - THREAD_END) * afterScale,
      windowEnd: THREAD_END + (stage.windowEnd - THREAD_END) * afterScale,
      lines: stage.lines.map((line) => ({
        ...line,
        time: THREAD_END + (line.time - THREAD_END) * afterScale,
      })),
    };
  });
}
