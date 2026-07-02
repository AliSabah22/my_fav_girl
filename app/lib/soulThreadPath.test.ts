import { describe, it, expect } from "vitest";
import { threadPaths } from "./soulThreadPath";

describe("threadPaths", () => {
  it("returns two non-empty SVG path strings starting with M", () => {
    const { d1, d2 } = threadPaths(0, 400, 200, 0);
    expect(d1.startsWith("M")).toBe(true);
    expect(d2.startsWith("M")).toBe(true);
  });

  it("produces different paths for the two lines at the same t", () => {
    const { d1, d2 } = threadPaths(1, 400, 200, 0);
    expect(d1).not.toBe(d2);
  });

  it("varies over time (different t produces different paths)", () => {
    const a = threadPaths(0, 400, 200, 0);
    const b = threadPaths(3, 400, 200, 0);
    expect(a.d1).not.toBe(b.d1);
  });

  it("is deterministic for the same inputs", () => {
    const a = threadPaths(2.5, 400, 200, 0);
    const b = threadPaths(2.5, 400, 200, 0);
    expect(a).toEqual(b);
  });

  it("scales with the given width and height", () => {
    const small = threadPaths(1, 100, 50, 0);
    const large = threadPaths(1, 800, 400, 0);
    expect(small.d1).not.toBe(large.d1);
  });
});

describe("threadPaths mergeProgress", () => {
  it("produces different output as mergeProgress changes, holding t/width/height fixed", () => {
    const atZero = threadPaths(1, 400, 200, 0);
    const atOne = threadPaths(1, 400, 200, 1);
    expect(atOne.d1).not.toBe(atZero.d1);
    expect(atOne.d2).not.toBe(atZero.d2);
  });

  it("still produces two visually distinct (non-identical) paths at full merge", () => {
    const { d1, d2 } = threadPaths(1, 400, 200, 1);
    expect(d1).not.toBe(d2);
  });

  it("clamps mergeProgress below 0 to the same result as 0", () => {
    const belowZero = threadPaths(1, 400, 200, -5);
    const atZero = threadPaths(1, 400, 200, 0);
    expect(belowZero).toEqual(atZero);
  });

  it("clamps mergeProgress above 1 to the same result as 1", () => {
    const aboveOne = threadPaths(1, 400, 200, 5);
    const atOne = threadPaths(1, 400, 200, 1);
    expect(aboveOne).toEqual(atOne);
  });

  it("is deterministic for the same inputs including mergeProgress", () => {
    const a = threadPaths(2.5, 400, 200, 0.5);
    const b = threadPaths(2.5, 400, 200, 0.5);
    expect(a).toEqual(b);
  });
});
