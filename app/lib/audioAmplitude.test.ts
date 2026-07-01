import { describe, it, expect } from "vitest";
import { averageAmplitude, smoothAmplitude } from "./audioAmplitude";

describe("averageAmplitude", () => {
  it("returns 0 for a silent (all-zero) buffer", () => {
    expect(averageAmplitude(new Uint8Array([0, 0, 0, 0]))).toBe(0);
  });

  it("returns 1 for a maxed-out (all-255) buffer", () => {
    expect(averageAmplitude(new Uint8Array([255, 255, 255, 255]))).toBe(1);
  });

  it("returns the normalized average for a mixed buffer", () => {
    expect(averageAmplitude(new Uint8Array([0, 255, 0, 255]))).toBeCloseTo(0.5);
  });

  it("returns 0 for an empty buffer without dividing by zero", () => {
    expect(averageAmplitude(new Uint8Array([]))).toBe(0);
  });
});

describe("smoothAmplitude", () => {
  it("moves partway from previous toward next, scaled by smoothing", () => {
    expect(smoothAmplitude(0, 1, 0.5)).toBeCloseTo(0.5);
    expect(smoothAmplitude(0.2, 0.2, 0.5)).toBeCloseTo(0.2);
  });

  it("returns exactly next when smoothing is 1", () => {
    expect(smoothAmplitude(0, 0.8, 1)).toBe(0.8);
  });

  it("returns exactly previous when smoothing is 0", () => {
    expect(smoothAmplitude(0.3, 0.9, 0)).toBe(0.3);
  });
});
