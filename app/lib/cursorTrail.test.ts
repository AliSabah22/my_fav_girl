import { describe, it, expect } from "vitest";
import { lerpColor, trailColorForStage, trailRgbForStage, randomTrailRgb, ROSE_RGB, GOLD_RGB } from "./cursorTrail";

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
  it("returns the same values trailColorForStage's string encodes", () => {
    const [r, g, b] = trailRgbForStage(0, 6);
    expect([r, g, b]).toEqual(ROSE_RGB);
  });
});

describe("randomTrailRgb", () => {
  it("returns a tuple whose channels fall between the rose and gold endpoints", () => {
    const [r, g, b] = randomTrailRgb();
    const minR = Math.min(ROSE_RGB[0], GOLD_RGB[0]);
    const maxR = Math.max(ROSE_RGB[0], GOLD_RGB[0]);
    expect(r).toBeGreaterThanOrEqual(minR);
    expect(r).toBeLessThanOrEqual(maxR);
    expect(g).toBeGreaterThanOrEqual(Math.min(ROSE_RGB[1], GOLD_RGB[1]));
    expect(b).toBeGreaterThanOrEqual(Math.min(ROSE_RGB[2], GOLD_RGB[2]));
  });
});

describe("pink palette endpoints", () => {
  it("uses the new bold-pink values, not the old gold/dusty-rose ones", () => {
    expect(ROSE_RGB).toEqual([255, 143, 171]);
    expect(GOLD_RGB).toEqual([255, 111, 145]);
  });
});
