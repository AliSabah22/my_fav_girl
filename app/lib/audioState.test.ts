import { describe, it, expect } from "vitest";
import {
  getActiveStage,
  getRevealedLines,
  isInPhotoInterlude,
  getPhotoProgress,
  getPhotoPhase,
  getSpotlightIndex,
  getNextStageWindowStart,
  getPhotoInterludeExitTarget,
  getStageIndexForTime,
} from "./audioState";
import type { Stage } from "../types";

const stages: Stage[] = [
  { id: "a", title: "A", windowStart: 0, windowEnd: 10, lines: [{ time: 0, text: "a0" }, { time: 5, text: "a5" }] },
  { id: "b", title: "B", windowStart: 10, windowEnd: 20, lines: [{ time: 10, text: "b0" }] },
  { id: "c", title: "C", windowStart: 25, windowEnd: 35, lines: [] },
];

describe("getActiveStage", () => {
  it("returns the stage whose window contains currentTime", () => {
    expect(getActiveStage(stages, 3)?.id).toBe("a");
    expect(getActiveStage(stages, 15)?.id).toBe("b");
  });

  it("includes windowStart but excludes windowEnd", () => {
    expect(getActiveStage(stages, 10)?.id).toBe("b");
    expect(getActiveStage(stages, 20)).toBeNull();
  });

  it("returns null for a gap between stages", () => {
    expect(getActiveStage(stages, 22)).toBeNull();
  });
});

describe("getRevealedLines", () => {
  it("includes lines whose time has passed, in order", () => {
    expect(getRevealedLines(stages[0], 6)).toEqual([
      { text: "a0", emphasis: false },
      { text: "a5", emphasis: false },
    ]);
  });

  it("includes a line exactly at currentTime", () => {
    expect(getRevealedLines(stages[0], 5)).toEqual([
      { text: "a0", emphasis: false },
      { text: "a5", emphasis: false },
    ]);
  });

  it("excludes lines that haven't happened yet", () => {
    expect(getRevealedLines(stages[0], 2)).toEqual([{ text: "a0", emphasis: false }]);
  });

  it("marks emphasis lines correctly and defaults missing emphasis to false", () => {
    const emphasisStage: Stage = {
      id: "e",
      title: "E",
      windowStart: 0,
      windowEnd: 10,
      lines: [
        { time: 0, text: "normal" },
        { time: 1, text: "big moment", emphasis: true },
      ],
    };
    expect(getRevealedLines(emphasisStage, 5)).toEqual([
      { text: "normal", emphasis: false },
      { text: "big moment", emphasis: true },
    ]);
  });
});

describe("isInPhotoInterlude / getPhotoProgress / getPhotoPhase", () => {
  const interlude = { windowStart: 90, windowEnd: 115 };

  it("detects whether currentTime is inside the window", () => {
    expect(isInPhotoInterlude(interlude, 100)).toBe(true);
    expect(isInPhotoInterlude(interlude, 89)).toBe(false);
    expect(isInPhotoInterlude(interlude, 115)).toBe(false);
  });

  it("computes 0-1 progress and clamps outside the window", () => {
    expect(getPhotoProgress(interlude, 90)).toBe(0);
    expect(getPhotoProgress(interlude, 102.5)).toBeCloseTo(0.5);
    expect(getPhotoProgress(interlude, 115)).toBe(1);
    expect(getPhotoProgress(interlude, 200)).toBe(1);
    expect(getPhotoProgress(interlude, 0)).toBe(0);
  });

  it("maps progress to the three phases at the documented thresholds", () => {
    expect(getPhotoPhase(0)).toBe("burst-in");
    expect(getPhotoPhase(0.149)).toBe("burst-in");
    expect(getPhotoPhase(0.15)).toBe("spotlight");
    expect(getPhotoPhase(0.899)).toBe("spotlight");
    expect(getPhotoPhase(0.9)).toBe("settle");
    expect(getPhotoPhase(1)).toBe("settle");
  });
});

describe("getSpotlightIndex", () => {
  it("spreads photos evenly across the spotlight phase (0.15-0.9)", () => {
    expect(getSpotlightIndex(0.15, 7)).toBe(0);
    expect(getSpotlightIndex(0.899, 7)).toBe(6);
  });

  it("returns 0 when there are no photos", () => {
    expect(getSpotlightIndex(0.5, 0)).toBe(0);
  });
});

describe("getStageIndexForTime", () => {
  it("returns 0 for a time before the first stage's windowStart", () => {
    expect(getStageIndexForTime(stages, -5)).toBe(0);
  });

  it("returns the index of the stage whose window contains currentTime", () => {
    expect(getStageIndexForTime(stages, 3)).toBe(0);
    expect(getStageIndexForTime(stages, 15)).toBe(1);
  });

  it("carries the earlier stage's index forward through a gap between stages", () => {
    // stages[1] ("b") ends at windowEnd 20; stages[2] ("c") doesn't start until
    // windowStart 25 — currentTime 22 falls in that gap and should stay on "b"
    // (index 1), not fall back to 0.
    expect(getStageIndexForTime(stages, 22)).toBe(1);
  });

  it("returns the last index at and after the last stage's windowStart, including past all windows", () => {
    expect(getStageIndexForTime(stages, 25)).toBe(2);
    expect(getStageIndexForTime(stages, 30)).toBe(2);
    expect(getStageIndexForTime(stages, 1000)).toBe(2);
  });
});

describe("getNextStageWindowStart", () => {
  it("returns the next stage's windowStart", () => {
    expect(getNextStageWindowStart(stages, "a")).toBe(10);
  });

  it("returns null for the last stage", () => {
    expect(getNextStageWindowStart(stages, "c")).toBeNull();
  });

  it("returns null for an unknown stage id", () => {
    expect(getNextStageWindowStart(stages, "nope")).toBeNull();
  });
});

describe("getPhotoInterludeExitTarget", () => {
  it("returns the windowStart of the stage that begins where the interlude ends", () => {
    const interlude = { windowEnd: 25 };
    expect(getPhotoInterludeExitTarget(interlude, stages)).toBe(25);
  });

  it("returns null if no stage starts exactly there", () => {
    const interlude = { windowEnd: 999 };
    expect(getPhotoInterludeExitTarget(interlude, stages)).toBeNull();
  });
});
