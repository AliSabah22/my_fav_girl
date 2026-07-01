import { describe, it, expect } from "vitest";
import { particleCountForStage, createParticle, stepParticle } from "./particles";

describe("particleCountForStage", () => {
  it("scales from a base count at stage 0 to a max count at the last stage", () => {
    expect(particleCountForStage(0, 6)).toBe(18);
    expect(particleCountForStage(5, 6)).toBe(60);
  });

  it("handles a single-stage edge case without dividing by zero", () => {
    expect(particleCountForStage(0, 1)).toBe(18);
  });
});

describe("createParticle", () => {
  it("places a particle within the given bounds", () => {
    const p = createParticle(800, 600);
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.x).toBeLessThanOrEqual(800);
    expect(p.y).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeLessThanOrEqual(600);
  });
});

describe("stepParticle", () => {
  it("moves the particle upward by its speed", () => {
    const p = { x: 100, y: 100, radius: 1, speed: 2, drift: 0, opacity: 0.5 };
    const next = stepParticle(p, 600);
    expect(next.y).toBe(98);
  });

  it("wraps to the bottom once it drifts above the top", () => {
    const p = { x: 100, y: -5, radius: 1, speed: 2, drift: 0, opacity: 0.5 };
    const next = stepParticle(p, 600);
    expect(next.y).toBe(610);
  });
});
