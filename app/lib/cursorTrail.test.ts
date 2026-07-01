import { describe, it, expect } from "vitest";
import { lerpColor, trailColorForStage, trailRgbForStage, ROSE_RGB, GOLD_RGB } from "./cursorTrail";

describe("lerpColor", () => {
  it("returns the start color at t=0 and end color at t=1", () => {
    expect(lerpColor([0, 0, 0], [100, 100, 100], 0)).toEqual([0, 0, 0]);
    expect(lerpColor([0, 0, 0], [100, 100, 100], 1)).toEqual([100, 100, 100]);
  });

  it("clamps t outside 0-1", () => {
    expect(lerpColor([0, 0, 0], [100, 100, 100], -1)).toEqual([0, 0, 0]);
    expect(lerpColor([0, 0, 0], [100, 100, 100], 2)).toEqual([100, 100, 100]);
  });
});

describe("trailColorForStage", () => {
  it("is rose at the first stage and gold at the last", () => {
    expect(trailColorForStage(0, 6)).toBe(`rgb(${ROSE_RGB[0]}, ${ROSE_RGB[1]}, ${ROSE_RGB[2]})`);
    expect(trailColorForStage(5, 6)).toBe(`rgb(${GOLD_RGB[0]}, ${GOLD_RGB[1]}, ${GOLD_RGB[2]})`);
  });
});

describe("trailRgbForStage", () => {
  it("returns the raw rose tuple at the first stage and gold tuple at the last", () => {
    expect(trailRgbForStage(0, 6)).toEqual(ROSE_RGB);
    expect(trailRgbForStage(5, 6)).toEqual(GOLD_RGB);
  });
});
