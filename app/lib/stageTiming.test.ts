import { describe, it, expect } from "vitest";
import { scaleStagesToDuration, THREAD_WINDOW } from "./stageTiming";
import type { Stage } from "../types";

const sample: Stage[] = [
  { id: "before", title: "Before", windowStart: 92, windowEnd: 135, lines: [{ time: 100, text: "x" }] },
  { id: "after", title: "After", windowStart: 150, windowEnd: 195, lines: [{ time: 160, text: "y" }] },
];

describe("scaleStagesToDuration", () => {
  it("leaves stages before the thread window completely unchanged", () => {
    const result = scaleStagesToDuration(sample, 204);
    expect(result[0]).toEqual(sample[0]);
  });

  it("leaves stages after the thread window unchanged when duration comfortably fits the reference span", () => {
    const result = scaleStagesToDuration(sample, 204);
    expect(result[1].windowStart).toBe(150);
    expect(result[1].windowEnd).toBe(195);
    expect(result[1].lines[0].time).toBe(160);
  });

  it("shrinks stages after the thread window proportionally when duration is too short for the reference span", () => {
    const result = scaleStagesToDuration(sample, 180);
    const scale = 25 / 45; // available = 180-150-5=25, reference span = 195-150=45
    expect(result[1].windowStart).toBe(150);
    expect(result[1].windowEnd).toBeCloseTo(150 + 45 * scale);
    expect(result[1].lines[0].time).toBeCloseTo(150 + (160 - 150) * scale);
  });

  it("clamps scale at 0 if duration leaves no room at all after the thread window", () => {
    const result = scaleStagesToDuration(sample, 140);
    expect(result[1].windowStart).toBe(150);
    expect(result[1].windowEnd).toBe(150);
  });

  it("exposes the fixed thread window boundaries", () => {
    expect(THREAD_WINDOW).toEqual({ start: 135, end: 150 });
  });
});
