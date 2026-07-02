# Passive Show Format Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert "Before My Eyes Did" from a click-to-advance experience with a typed-name input into a fully passive show, retime its stages to real audio duration, and add a pointer-interactive "thread merge" moment in place of the shelved photo interlude.

**Architecture:** A new pure function (`scaleStagesToDuration`) transforms the reference stage schedule using the audio element's real `duration`, read once via `loadedmetadata`. `SoulThread` gains a `mergeProgress` value — driven by a fixed baseline auto-advance plus optional pointer-movement acceleration during a fixed 135–150s window — that `threadPaths` uses to visually tighten the two lines from a wide separate wave into a braid. The typed-name phase is removed; "Fizza." becomes a normal scripted emphasis line.

**Tech Stack:** Same as the existing project — Next.js 14, TypeScript, Tailwind v3, Framer Motion v11, hand-rolled canvas/SVG, native Web Audio API, Vitest. No new dependencies.

## Global Constraints

- Click-to-advance is removed entirely — no `onClick` handler on `<main>`, no `handleSkip`.
- The thread-interaction window is always literally `[135, 150]` in real seconds — never scaled by duration.
- Stages before the thread window (`opening`, `stage1`, `stage2`, `stage3`) always occupy exactly `[0, 135]` regardless of duration — their reference numbers already sum to that span, so `scaleStagesToDuration` must leave them completely unchanged.
- Stages after the thread window (`stage4`, `final`) scale proportionally only if `duration` is too short to fit their reference span (45s) plus a 5-second buffer before the track ends; otherwise unchanged.
- `mergeProgress` reaching 1 must be impossible in under ~4 seconds of continuous pointer movement, and must always reach 1 by `currentTime > windowEnd` regardless of pointer activity.
- No changes to `StageBackdrop`, `signatureEase`, typography, `CursorTrail`, `AudioPlayer`, `ProgressIndicator`, or color tokens.
- `PhotoInterlude.tsx` and `app/data/photos.ts` stay in the repository, untouched, simply unreferenced by `page.tsx`.
- Existing stage line text stays verbatim for `opening`/`stage1`/`stage2`/`stage3`/`stage4` — only `time`/`windowStart`/`windowEnd` values change.
- Testing philosophy unchanged: new pure-logic files/functions get Vitest tests; UI/component wiring (pointer listeners, phase transitions) is verified via a manual Playwright browser pass.
- Several tasks in this plan intentionally leave `npm run typecheck` reporting errors that a *later* task in this same plan resolves — each task's steps say exactly which errors are expected at that point. Do not attempt to fix an error outside your own task's file list.

---

## Task 1: `scaleStagesToDuration` pure function

**Files:**
- Create: `app/lib/stageTiming.ts`
- Test: `app/lib/stageTiming.test.ts`

**Interfaces:**
- Produces: `scaleStagesToDuration(stages: Stage[], duration: number): Stage[]` and `THREAD_WINDOW: { start: number; end: number }`, both consumed by `app/page.tsx` (Task 6) and `THREAD_WINDOW` also consumed by `app/components/SoulThread.tsx` (Task 4).

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/lib/stageTiming.test.ts`
Expected: FAIL — `app/lib/stageTiming.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/lib/stageTiming.test.ts`
Expected: PASS, all 5 assertions green.

- [ ] **Step 5: Commit**

```bash
git add app/lib/stageTiming.ts app/lib/stageTiming.test.ts
git commit -m "Add scaleStagesToDuration pure function with tests"
```

---

## Task 2: `threadPaths` gains `mergeProgress`

This modifies previously-shipped, already-tested code. Its only consumer is `SoulThread.tsx`, updated in Task 4 — until then, `npm run typecheck` will report a missing-argument error in `SoulThread.tsx` at both of its `threadPaths(...)` call sites. That is expected and resolved by Task 4; do not touch `SoulThread.tsx` in this task.

**Files:**
- Modify: `app/lib/soulThreadPath.ts`
- Modify: `app/lib/soulThreadPath.test.ts`

**Interfaces:**
- Produces: `threadPaths(t: number, width: number, height: number, mergeProgress: number): { d1: string; d2: string }` — **signature change**, `mergeProgress` is a new required 4th parameter. Consumed by `app/components/SoulThread.tsx` (Task 4).

- [ ] **Step 1: Replace `app/lib/soulThreadPath.test.ts` entirely**

Read the current file first. Replace it with:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/lib/soulThreadPath.test.ts`
Expected: FAIL — the current `threadPaths` only accepts 3 parameters, so calls with a 4th argument are a type/behavior mismatch and the new `mergeProgress`-specific assertions fail.

- [ ] **Step 3: Update `app/lib/soulThreadPath.ts`**

Read the current file first. Replace the entire file with:

```ts
export function threadPaths(
  t: number,
  width: number,
  height: number,
  mergeProgress: number
): { d1: string; d2: string } {
  const midY = height / 2;
  const baseAmplitude = height * 0.18;
  const startX = width * 0.1;
  const endX = width * 0.9;
  const segments = 48;
  const clampedMerge = Math.min(1, Math.max(0, mergeProgress));
  const freqMultiplier = 1 + clampedMerge * 1.5;
  const amplitude = baseAmplitude * (1 - clampedMerge * 0.3);

  function buildPath(phaseOffset: number): string {
    const points: string[] = [];
    for (let i = 0; i <= segments; i++) {
      const x = startX + ((endX - startX) * i) / segments;
      const y =
        midY +
        Math.sin(t * 0.6 * freqMultiplier + phaseOffset + ((i * (1.4 * 8)) / segments) * freqMultiplier) *
          amplitude *
          (0.5 + i / segments / 2);
      points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    const [first, ...rest] = points;
    return `M ${first} L ${rest.join(" L ")}`;
  }

  const phase2 = Math.PI + (Math.PI / 6 - Math.PI) * clampedMerge; // π → π/6 as merge rises, never fully overlapping

  return {
    d1: buildPath(0),
    d2: buildPath(phase2),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/lib/soulThreadPath.test.ts`
Expected: PASS, all 10 assertions green.

- [ ] **Step 5: Verify the expected, known interim typecheck error**

Run: `npm run typecheck`
Expected: reports errors in `app/components/SoulThread.tsx` about `threadPaths` being called with too few arguments (2 call sites). This is expected — Task 4 fixes it. Confirm there are no OTHER errors beyond this.

- [ ] **Step 6: Commit**

```bash
git add app/lib/soulThreadPath.ts app/lib/soulThreadPath.test.ts
git commit -m "Add mergeProgress parameter to threadPaths for the thread interaction feature"
```

---

## Task 3: Retime `app/data/stages.ts` and rewrite the final stage

This modifies `app/data/stages.ts`, whose `nameEchoOptions` export is removed — `app/page.tsx` still imports it until Task 6. Until then, `npm run typecheck` will report a missing-export error in `page.tsx`. That is expected and resolved by Task 6; do not touch `page.tsx` in this task.

**Files:**
- Modify: `app/data/stages.ts`

**Interfaces:**
- Produces: `stages: Stage[]` (same shape, new `windowStart`/`windowEnd`/`time` values, new `final` stage content), `closingSequence: string[]` (unchanged), `finalScreen` (unchanged). **Removes** the `nameEchoOptions` export entirely.

- [ ] **Step 1: Replace the entire file**

Read the current file first. Replace it with:

```ts
import type { Stage } from "../types";

export const stages: Stage[] = [
  {
    id: "opening",
    title: "Before My Eyes Did",
    windowStart: 0,
    windowEnd: 20,
    lines: [
      { time: 0, text: "Some people arrive like weather — slow, you can see them coming." },
      { time: 1.8, text: "You arrived like déjà vu." },
      { time: 3.6, text: "A feeling before a fact." },
      { time: 5.5, text: "I hadn't learned your laugh yet. Hadn't heard your voice catch when something moves you." },
      { time: 7.3, text: "But some quieter part of me had already exhaled." },
      { time: 9.1, text: "There she is.", emphasis: true },
      { time: 10.9, text: "Not love at first sight — recognition." },
      { time: 12.7, text: "Like my soul kept a seat for you, long before my eyes found you in the room." },
    ],
  },
  {
    id: "stage1",
    title: "A Profile, Then a Certainty",
    windowStart: 20,
    windowEnd: 52,
    lines: [
      { time: 20, text: "It started with a swipe — the smallest, most ordinary motion." },
      { time: 22.4, text: "One photo among hundreds I'd already forgotten." },
      { time: 24.8, text: "I didn't know your favorite color. Your dreams. The sound of your laugh." },
      { time: 27.3, text: "And yet something in your eyes made my thumb stop moving." },
      { time: 29.7, text: "Not luck." },
      { time: 32.1, text: "Not the algorithm." },
      { time: 34.5, text: "It felt less like meeting someone new, and more like finally finding who I'd been looking for." },
    ],
  },
  {
    id: "stage2",
    title: "Breakfast, and the Slip",
    windowStart: 52,
    windowEnd: 92,
    lines: [
      { time: 52, text: "Our first date. Breakfast, sunlight, too much coffee." },
      { time: 54.6, text: "We talked like people who'd known each other in some other life." },
      { time: 57.3, text: "I said something — I don't even remember what." },
      { time: 59.9, text: "You laughed." },
      { time: 62.5, text: "And two seconds later, before your mind could catch up to your heart —" },
      { time: 65.1, text: "\"I love you.\"", emphasis: true },
      { time: 67.8, text: "You heard yourself say it." },
      { time: 70.4, text: "Your face did everything words couldn't." },
      { time: 73.0, text: "We laughed it off. But I don't think it was an accident." },
      { time: 75.7, text: "I think your heart just got there first." },
      {
        time: 78.3,
        text: "It's still one of my favorite mornings — not for what you said, but for how completely you it was to say it.",
      },
    ],
  },
  {
    id: "stage3",
    title: "Fizzy",
    windowStart: 92,
    windowEnd: 135,
    lines: [
      { time: 92, text: "Somewhere between every conversation, Fizza became Fizzy." },
      { time: 95.9, text: "Funny, how a nickname can hold this much." },
      { time: 99.7, text: "There are moments now that belong only to us." },
      { time: 107.5, text: "Small. Ordinary, probably, to anyone else." },
      { time: 111.4, text: "But they're already some of my favorite minutes alive." },
      { time: 115.2, text: "We've only had a month." },
      { time: 119.1, text: "And somehow even the ordinary ones already feel worth keeping." },
    ],
  },
  {
    id: "stage4",
    title: "One Month, Already Home",
    windowStart: 150,
    windowEnd: 178,
    lines: [
      { time: 150, text: "Thirty-some days. On paper, that's nothing." },
      { time: 152.8, text: "But something about how my days move has changed." },
      { time: 155.6, text: "Quieter mornings. Better punctuation in my own thoughts." },
      { time: 158.4, text: "Less noise, somehow, even when nothing's gone quiet." },
      { time: 161.2, text: "I used to think home was something I'd build eventually." },
      { time: 164, text: "Now I think I just hadn't met it yet." },
      { time: 166.8, text: "A month in, and you're already the part of my day I look forward to before I'm fully awake." },
    ],
  },
  {
    id: "final",
    title: "Let Me Carry Your Name",
    windowStart: 178,
    windowEnd: 195,
    lines: [
      { time: 178, text: "There's something about your name." },
      { time: 181, text: "Not the sound of it." },
      { time: 184, text: "Who it belongs to." },
      { time: 187, text: "I want to carry it the way you carry mine." },
      { time: 190, text: "Fizza.", emphasis: true },
      { time: 193, text: "Already my favorite word — not for how it sounds, but for who it belongs to." },
    ],
  },
];

export const closingSequence = [
  "One swipe.",
  "One breakfast, and a love that slipped out before it was ready.",
  "One month that already feels like the start of something long.",
  "I don't know everything that's coming.",
  "But I know I want you in all of it —",
  "every ordinary Tuesday, every sunrise, every chapter we haven't written yet.",
  "This was never a goodbye.",
  "It's just where this letter ends. Not where we do.",
];

export const finalScreen = {
  message: "Thank you for letting me say all of this out loud.",
  ctaLabel: "Turn the Next Page",
};
```

- [ ] **Step 2: Run the full test suite as a regression check**

Run: `npm test`
Expected: all suites still pass (no test file imports from `app/data/stages.ts`, so this only confirms nothing else broke).

- [ ] **Step 3: Verify the expected, known interim typecheck errors**

Run: `npm run typecheck`
Expected: reports the Task 2 error (`SoulThread.tsx` missing-argument, still unresolved) plus a new error in `page.tsx` about `nameEchoOptions` no longer being exported from `./data/stages`. Both are expected — resolved by Tasks 4 and 6 respectively. Confirm there are no OTHER errors.

- [ ] **Step 4: Commit**

```bash
git add app/data/stages.ts
git commit -m "Retime stages to real audio duration and rewrite final stage for passive name reveal"
```

---

## Task 4: `SoulThread` gains pointer-driven merge interaction

**Files:**
- Modify: `app/components/SoulThread.tsx`

**Interfaces:**
- Consumes: `threadPaths(t, width, height, mergeProgress)` from `app/lib/soulThreadPath.ts` (Task 2); `THREAD_WINDOW` shape from `app/lib/stageTiming.ts` (Task 1, used only as the *type shape* for `interactiveWindow` — the actual value is passed in by `page.tsx` in Task 6).
- Produces: `SoulThread({ stageIndex: number; totalStages: number; getAmplitude: () => number; currentTime: number; interactiveWindow: { start: number; end: number } })` — **interface change**, adds two new required props. `page.tsx`'s existing call site (missing these two props) shows an expected, known interim typecheck error until Task 6.

- [ ] **Step 1: Read the current file, then replace it entirely**

Read `app/components/SoulThread.tsx` first to confirm its current shape. Replace the whole file with:

```tsx
"use client";
import { useEffect, useRef } from "react";
import { threadPaths } from "../lib/soulThreadPath";

interface SoulThreadProps {
  stageIndex: number;
  totalStages: number;
  getAmplitude: () => number;
  currentTime: number;
  interactiveWindow: { start: number; end: number };
}

const DISTANCE_FOR_FULL_MERGE = 12000;

export default function SoulThread({
  stageIndex,
  totalStages,
  getAmplitude,
  currentTime,
  interactiveWindow,
}: SoulThreadProps) {
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const currentTimeRef = useRef(currentTime);
  const cumulativeDistanceRef = useRef(0);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lockedMergeRef = useRef(false);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const stageOpacity = 0.4 + 0.4 * (totalStages <= 1 ? 0 : stageIndex / (totalStages - 1));

    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    window.addEventListener("resize", handleResize);

    function handlePointerMove(e: PointerEvent) {
      const t = currentTimeRef.current;
      const inWindow = t > interactiveWindow.start && t <= interactiveWindow.end;
      if (!inWindow) {
        lastPointerRef.current = null;
        return;
      }
      const last = lastPointerRef.current;
      if (last) {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        cumulativeDistanceRef.current += Math.sqrt(dx * dx + dy * dy);
      }
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener("pointermove", handlePointerMove);

    function applyOpacity(opacity: number) {
      path1Ref.current?.style.setProperty("opacity", opacity.toFixed(3));
      path2Ref.current?.style.setProperty("opacity", opacity.toFixed(3));
    }

    function computeMergeProgress(): number {
      const t = currentTimeRef.current;
      if (t <= interactiveWindow.start) return 0;
      if (t > interactiveWindow.end) {
        lockedMergeRef.current = true;
        return 1;
      }
      if (lockedMergeRef.current) return 1;
      const baseline = (t - interactiveWindow.start) / (interactiveWindow.end - interactiveWindow.start);
      const pointerProgress = Math.min(1, cumulativeDistanceRef.current / DISTANCE_FOR_FULL_MERGE);
      return Math.min(1, Math.max(baseline, pointerProgress));
    }

    if (reducedMotion) {
      const mergeProgress = computeMergeProgress();
      const { d1, d2 } = threadPaths(0, width, height, mergeProgress);
      path1Ref.current?.setAttribute("d", d1);
      path2Ref.current?.setAttribute("d", d2);
      applyOpacity(stageOpacity);
      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("pointermove", handlePointerMove);
      };
    }

    let frame: number;
    function tick() {
      const t = performance.now() / 1000;
      const mergeProgress = computeMergeProgress();
      const { d1, d2 } = threadPaths(t, width, height, mergeProgress);
      path1Ref.current?.setAttribute("d", d1);
      path2Ref.current?.setAttribute("d", d2);
      const amplitude = getAmplitude();
      applyOpacity(stageOpacity * (1 + amplitude * 0.3));
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [stageIndex, totalStages, getAmplitude, interactiveWindow.start, interactiveWindow.end]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[8]" aria-hidden="true">
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <path
          ref={path1Ref}
          fill="none"
          stroke="#ff8fab"
          strokeWidth={1.6}
          style={{ filter: "drop-shadow(0 0 8px #ff8fab)" }}
        />
        <path
          ref={path2Ref}
          fill="none"
          stroke="#ff6f91"
          strokeWidth={1.6}
          style={{ filter: "drop-shadow(0 0 8px #ff6f91)" }}
        />
      </svg>
    </div>
  );
}
```

Note on the `handlePointerMove` scoping: the listener is registered for the component's whole lifetime (same as `resize`), but it only *accumulates* distance while `currentTimeRef.current` is inside `interactiveWindow` — movement before or after the window is ignored, and `lastPointerRef` resets to `null` whenever outside the window so the first sample after entering doesn't count a stale jump from wherever the pointer happened to be. This satisfies "listeners scoped to the window's active lifetime" without the complexity of dynamically adding/removing the listener at exact window boundaries.

Note on `interactiveWindow` in the effect's dependency array: it depends on `interactiveWindow.start`/`interactiveWindow.end` (primitive numbers), not the `interactiveWindow` object itself — this avoids the referential-instability bug class already fixed once in this project (see the `useAudioAmplitude` `useCallback` fix from the prior atmosphere-upgrade review).

- [ ] **Step 2: Verify the expected, known interim typecheck error**

Run: `npm run typecheck`
Expected: the Task 2 `SoulThread.tsx` error is now gone (this file's own `threadPaths` calls are correct). A NEW error appears in `page.tsx`: its existing `<SoulThread stageIndex={...} totalStages={...} getAmplitude={...} />` call site is now missing the required `currentTime`/`interactiveWindow` props. This is expected — Task 6 resolves it. The `nameEchoOptions` error from Task 3 should still be present too (unrelated, also resolved in Task 6). Confirm there are no OTHER errors beyond these two.

- [ ] **Step 3: Commit**

```bash
git add app/components/SoulThread.tsx
git commit -m "Add pointer-driven merge interaction to SoulThread"
```

---

## Task 5: Delete `NameEcho.tsx`

**Files:**
- Delete: `app/components/NameEcho.tsx`

**Interfaces:**
- Removes the `NameEcho` component entirely. `page.tsx` still imports it until Task 6 — an expected, known interim typecheck error (module not found) until then.

- [ ] **Step 1: Delete the file**

```bash
git rm app/components/NameEcho.tsx
```

- [ ] **Step 2: Verify the expected, known interim typecheck errors**

Run: `npm run typecheck`
Expected: a NEW error in `page.tsx` — `Cannot find module './components/NameEcho'`. This is expected, resolved by Task 6. The `nameEchoOptions` error (Task 3) and the `SoulThread` missing-props error (Task 4) should still both be present too. Confirm there are no OTHER errors beyond these three.

- [ ] **Step 3: Commit**

```bash
git commit -m "Delete NameEcho component — passive final stage replaces typed-name input"
```

---

## Task 6: `page.tsx` — passive interaction, dynamic duration, simplified phases

This task resolves every interim typecheck error left by Tasks 2–5. After this task, `npm run typecheck` must report zero errors.

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `scaleStagesToDuration`, `THREAD_WINDOW` from `app/lib/stageTiming.ts` (Task 1); `SoulThread`'s new props (Task 4); `stages`/`closingSequence`/`finalScreen` from `app/data/stages.ts` (Task 3, no more `nameEchoOptions`).
- Produces: no external interface change — still the default-exported route entry point.

- [ ] **Step 1: Read the current file, then replace it entirely**

Read `app/page.tsx` first. Replace the whole file with:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { stages as rawStages, closingSequence, finalScreen } from "./data/stages";
import { getActiveStage } from "./lib/audioState";
import { scaleStagesToDuration, THREAD_WINDOW } from "./lib/stageTiming";
import { useAudioAmplitude } from "./lib/useAudioAmplitude";
import { signatureEase } from "./lib/motion";
import AudioPlayer from "./components/AudioPlayer";
import FloatingParticles from "./components/FloatingParticles";
import CursorTrail from "./components/CursorTrail";
import StageBackdrop from "./components/StageBackdrop";
import SoulThread from "./components/SoulThread";
import PreExperiencePrompt from "./components/PreExperiencePrompt";
import StageText from "./components/StageText";
import ProgressIndicator from "./components/ProgressIndicator";
import ClosingSequence from "./components/ClosingSequence";
import FinalScreen from "./components/FinalScreen";

type Phase = "pre" | "experience" | "closing" | "final";

const FINAL_STAGE_ID = "final";
const REFERENCE_DURATION = 204;

export default function Page() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [phase, setPhase] = useState<Phase>("pre");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(REFERENCE_DURATION);
  const { initAmplitude, getAmplitude } = useAudioAmplitude();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function handleTimeUpdate() {
      setCurrentTime(audio!.currentTime);
    }
    function handleLoadedMetadata() {
      if (audio!.duration && isFinite(audio!.duration)) {
        setDuration(audio!.duration);
      }
    }
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  const stages = scaleStagesToDuration(rawStages, duration);
  const activeStage = getActiveStage(stages, currentTime);
  const stageIndex = activeStage ? stages.findIndex((s) => s.id === activeStage.id) : 0;

  const finalStage = stages.find((s) => s.id === FINAL_STAGE_ID)!;
  const lastLineTime = finalStage.lines[finalStage.lines.length - 1].time;
  const reachedClosing =
    phase === "experience" && activeStage?.id === FINAL_STAGE_ID && currentTime >= lastLineTime;

  useEffect(() => {
    if (reachedClosing) {
      audioRef.current?.pause();
      setPhase("closing");
    }
  }, [reachedClosing]);

  function handleBegin() {
    setPhase("experience");
    const audio = audioRef.current;
    if (audio) {
      initAmplitude(audio);
      audio.play().catch(() => {});
    }
  }

  function handleAudioEnded() {
    if (phase !== "experience") return;
    audioRef.current?.pause();
    setPhase("closing");
  }

  function handleRestart() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setCurrentTime(0);
    setPhase("pre");
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-bg">
      <StageBackdrop getAmplitude={getAmplitude} />
      <FloatingParticles stageIndex={stageIndex} totalStages={stages.length} getAmplitude={getAmplitude} />
      <SoulThread
        stageIndex={stageIndex}
        totalStages={stages.length}
        getAmplitude={getAmplitude}
        currentTime={currentTime}
        interactiveWindow={THREAD_WINDOW}
      />
      <CursorTrail getAmplitude={getAmplitude} />
      <AudioPlayer src="/audio/risk-it-all.mp3" audioRef={audioRef} onEnded={handleAudioEnded} />

      <div className="relative z-20 flex h-full w-full items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "pre" && (
            <motion.div key="pre" exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: signatureEase }}>
              <PreExperiencePrompt onBegin={handleBegin} />
            </motion.div>
          )}

          {phase === "experience" && activeStage && (
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.8, ease: signatureEase }}
            >
              <StageText stage={activeStage} currentTime={currentTime} />
            </motion.div>
          )}

          {phase === "closing" && (
            <motion.div
              key="closing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: signatureEase }}
              className="h-full w-full"
            >
              <ClosingSequence lines={closingSequence} onComplete={() => setPhase("final")} />
            </motion.div>
          )}

          {phase === "final" && (
            <motion.div
              key="final"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: signatureEase }}
            >
              <FinalScreen message={finalScreen.message} ctaLabel={finalScreen.ctaLabel} onRestart={handleRestart} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === "experience" && (
        <div className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2">
          <ProgressIndicator progress={currentTime / stages[stages.length - 1].windowEnd} />
        </div>
      )}
    </main>
  );
}
```

Note what's gone versus the pre-this-plan version: the `photoInterlude` import and `isInPhotoInterlude`/`getNextStageWindowStart`/`getPhotoInterludeExitTarget` imports (photo interlude shelved, click-to-skip removed entirely — those two lib functions stay defined in `app/lib/audioState.ts`, just unused here now); the `inPhotoInterlude` branch in the render tree; `handleSkip` and the `onClick` on `<main>`; the `"name"` phase and the `NameEcho` import/render; `nameEchoOptions` from the `stages.ts` import.

- [ ] **Step 2: Verify typecheck is fully clean**

Run: `npm run typecheck`
Expected: exits 0, zero errors — every interim error from Tasks 2–5 is now resolved.

- [ ] **Step 3: Run the full test suite as a regression check**

Run: `npm test`
Expected: all suites pass (this task doesn't touch any `.test.ts` file, pure regression check).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "Wire passive interaction model, dynamic duration, and simplified phase machine into page.tsx"
```

---

## Task 7: Manual end-to-end browser verification

**Files:** None created or modified — verification-only task.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: starts with no console errors (a bare `curl` check that `/` returns HTTP 200 twice a couple seconds apart is a good sanity check before opening a browser against it — Next.js dev mode has been observed to intermittently 404 immediately after a fresh `.next` rebuild in this project; if that happens, stop the server, delete `.next`, and restart before proceeding).

- [ ] **Step 2: Verify Begin still works and no click-to-skip remains**

Click Begin. Confirm the opening stage plays. Click anywhere on the screen during playback — confirm nothing happens (no stage skip). This is the core passive-by-default requirement.

- [ ] **Step 3: Verify the photo interlude is gone**

Let playback continue (or seek) through where the old photo interlude used to be (around 90–115s pre-this-plan). Confirm stage3 ("Fizzy") plays directly after stage2 with no photo collage ever appearing, and no console errors about `PhotoInterlude` or `photos.ts`.

- [ ] **Step 4: Verify the thread interaction window**

Seek to `currentTime = 135` (via `document.querySelector('audio').currentTime = 135; document.querySelector('audio').dispatchEvent(new Event('timeupdate'))` in devtools). Confirm the two thread lines are visible and drifting in their normal (unmerged) state. Move the mouse around rapidly and continuously for several seconds while watching — confirm the threads visibly tighten toward a braided state faster than they would with no movement. Then stop moving the mouse entirely and seek to `currentTime = 140` — confirm the threads have still progressed toward merged (baseline auto-advance) even without any pointer movement. Seek to `currentTime = 151` (just past the window) — confirm the threads are fully merged/braided and stay that way.

- [ ] **Step 5: Verify the passive final stage**

Seek to `currentTime = 190`. Confirm "Fizza." renders as a normal stage line in the larger/italic emphasis treatment — no input field, no typing prompt anywhere. Let it continue (or seek past 195) — confirm it transitions directly to the closing sequence with no intermediate name-entry screen.

- [ ] **Step 6: Regression pass on the rest of the flow**

Confirm: Begin → opening → stage1 → stage2 → stage3 → (thread window) → stage4 → final (including "Fizza.") → closing sequence → final screen → restart, all play through with no console errors, matching the passive, hands-off behavior throughout.

- [ ] **Step 7: Verify reduced motion**

Enable "Emulate CSS prefers-reduced-motion: reduce" in devtools. Reload, click Begin, seek into the thread window. Confirm the thread renders a single static frame (no rAF-driven motion) reflecting whatever `mergeProgress` value applies at that `currentTime`, per the existing reduced-motion policy — no crash, no motion.

No commit for this task — it's a verification pass. If any step fails, fix the relevant file and re-run that step before moving on.
