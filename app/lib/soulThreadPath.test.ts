import { describe, it, expect } from "vitest";
import { threadPaths } from "./soulThreadPath";

describe("threadPaths", () => {
  it("returns two non-empty SVG path strings starting with M", () => {
    const { d1, d2 } = threadPaths(0, 400, 200);
    expect(d1.startsWith("M")).toBe(true);
    expect(d2.startsWith("M")).toBe(true);
  });

  it("produces different paths for the two lines at the same t", () => {
    const { d1, d2 } = threadPaths(1, 400, 200);
    expect(d1).not.toBe(d2);
  });

  it("varies over time (different t produces different paths)", () => {
    const a = threadPaths(0, 400, 200);
    const b = threadPaths(3, 400, 200);
    expect(a.d1).not.toBe(b.d1);
  });

  it("is deterministic for the same inputs", () => {
    const a = threadPaths(2.5, 400, 200);
    const b = threadPaths(2.5, 400, 200);
    expect(a).toEqual(b);
  });

  it("scales with the given width and height", () => {
    const small = threadPaths(1, 100, 50);
    const large = threadPaths(1, 800, 400);
    expect(small.d1).not.toBe(large.d1);
  });
});
