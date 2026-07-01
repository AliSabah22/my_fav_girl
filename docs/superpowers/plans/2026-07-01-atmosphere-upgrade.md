# Atmosphere & Design Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the shipped "Before My Eyes Did" site's atmosphere, color palette, motion, typography, and chrome so it feels handcrafted rather than merely correctly built, per `docs/superpowers/specs/2026-07-01-atmosphere-upgrade-design.md`.

**Architecture:** Layers new ambient components (`StageBackdrop`, `SoulThread`) and a Web Audio amplitude source onto the existing audio-driven state machine, recolors existing design tokens in place, and unifies every Framer Motion transition onto one easing curve. No changes to the phase state machine, stage data/timestamps, or component responsibilities from the original build.

**Tech Stack:** Same as the existing project — Next.js 14, TypeScript, Tailwind v3, Framer Motion v11, hand-rolled canvas/SVG, native Web Audio API. No new dependencies.

## Global Constraints

- `gold` token value changes from `#c9a15a` to `#ff6f91`; `rose` token value changes from `#d98a82` to `#ff8fab`. **Token names stay `gold`/`rose`** — do not rename them anywhere.
- Floating particles keep their existing cream color (`rgba(243, 234, 217, …)`) — do not recolor particles to pink.
- One shared easing curve, `signatureEase = [0.16, 1, 0.3, 1]` from `app/lib/motion.ts`, replaces every other `ease` value in every Framer Motion `transition` prop in the codebase. Durations stay per-component.
- `AudioContext`/`AnalyserNode` initialize exactly once, inside `handleBegin`, after the user's click — never before, never twice.
- Every amplitude consumer treats amplitude as an *additive* multiplier on top of existing scripted behavior; `getAmplitude()` returning a constant `0` (e.g. analyser unavailable) must degrade gracefully to today's behavior, never a broken state.
- New pure-logic files (`audioAmplitude.ts`, `soulThreadPath.ts`) get Vitest unit tests, following this project's established testing-scope decision; `useAudioAmplitude.ts` (browser-API glue) and all visual/UI changes are verified via a manual Playwright browser pass instead — do not write component-level automated tests.
- `prefers-reduced-motion` must disable every new rAF-driven animation (`StageBackdrop` amplitude loop, `SoulThread` motion) and fall back to a static, single frame — matching the existing project-wide reduced-motion policy already in `app/globals.css` and the canvas components.

---

## Task 1: Design tokens, shared easing constant, and CSS groundwork

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Create: `app/lib/motion.ts`

**Interfaces:**
- Produces: `signatureEase: readonly [number, number, number, number]` from `app/lib/motion.ts`, imported by every later task that touches a Framer Motion `transition`.
- Produces: a global `@keyframes breathe` rule and a `:focus-visible` rule in `app/globals.css`, used by Tasks 5 (`StageBackdrop`) and 8 (`PreExperiencePrompt`).

- [ ] **Step 1: Update `tailwind.config.ts` color values**

Open `tailwind.config.ts` and change exactly two values inside `theme.extend.colors` — leave every other key as-is:

```ts
gold: "#ff6f91",
rose: "#ff8fab",
```

(Full block for reference — only `gold`/`rose` change, `bg`, `bg-soft`, `panel`, `line`, `cream`, `muted` stay identical to what's already there:)

```ts
colors: {
  bg: "#1c1620",
  "bg-soft": "#251c2c",
  panel: "#2a2032",
  line: "#3a2e44",
  cream: "#f3ead9",
  gold: "#ff6f91",
  rose: "#ff8fab",
  muted: "#9a8aa3",
},
```

- [ ] **Step 2: Update `app/globals.css` custom properties, add the shared `breathe` keyframe and a focus-visible rule**

In the `:root` block, change exactly two lines:

```css
--gold: #ff6f91;
--rose: #ff8fab;
```

Then add this new block anywhere after the `:root` block (e.g. right after it, before the `html, body` rule):

```css
@keyframes breathe {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.05); }
}

:focus-visible {
  outline: 2px solid var(--rose);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Write `app/lib/motion.ts`**

```ts
export const signatureEase = [0.16, 1, 0.3, 1] as const;
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Verify colors actually changed by grepping**

Run: `grep -rn "c9a15a\|d98a82" tailwind.config.ts app/globals.css`
Expected: no output (both old hex values are gone from both files).

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts app/globals.css app/lib/motion.ts
git commit -m "Recolor gold/rose tokens to pink palette, add shared ease constant and breathe keyframe"
```

---

## Task 2: Audio amplitude pure functions

**Files:**
- Create: `app/lib/audioAmplitude.ts`
- Test: `app/lib/audioAmplitude.test.ts`

**Interfaces:**
- Produces: `averageAmplitude(data: Uint8Array): number` and `smoothAmplitude(previous: number, next: number, smoothing: number): number`, both consumed by `app/lib/useAudioAmplitude.ts` (Task 3).

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/lib/audioAmplitude.test.ts`
Expected: FAIL — `app/lib/audioAmplitude.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
export function averageAmplitude(data: Uint8Array): number {
  if (data.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum / data.length / 255;
}

export function smoothAmplitude(previous: number, next: number, smoothing: number): number {
  return previous + (next - previous) * smoothing;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/lib/audioAmplitude.test.ts`
Expected: PASS, all assertions green.

- [ ] **Step 5: Commit**

```bash
git add app/lib/audioAmplitude.ts app/lib/audioAmplitude.test.ts
git commit -m "Add audio amplitude pure functions with tests"
```

---

## Task 3: `useAudioAmplitude` hook

**Files:**
- Create: `app/lib/useAudioAmplitude.ts`

**Interfaces:**
- Consumes: `averageAmplitude`, `smoothAmplitude` from `app/lib/audioAmplitude.ts` (Task 2).
- Produces: `useAudioAmplitude()` returning `{ initAmplitude: (audioEl: HTMLAudioElement) => void; getAmplitude: () => number }`, consumed by `page.tsx` (Task 14) and passed down to `StageBackdrop` (Task 5), `FloatingParticles` (Task 14 wiring), `CursorTrail` (Task 9), and `SoulThread` (Task 6).

- [ ] **Step 1: Write the hook**

```ts
"use client";
import { useRef } from "react";
import { averageAmplitude, smoothAmplitude } from "./audioAmplitude";

export function useAudioAmplitude() {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const smoothedRef = useRef(0);
  const initializedRef = useRef(false);

  function initAmplitude(audioEl: HTMLAudioElement) {
    if (initializedRef.current) return;
    initializedRef.current = true;
    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextCtor();
      const source = audioCtx.createMediaElementSource(audioEl);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      analyserRef.current = null;
    }
  }

  function getAmplitude(): number {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return 0;
    analyser.getByteFrequencyData(data);
    const next = averageAmplitude(data);
    smoothedRef.current = smoothAmplitude(smoothedRef.current, next, 0.3);
    return smoothedRef.current;
  }

  return { initAmplitude, getAmplitude };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/lib/useAudioAmplitude.ts
git commit -m "Add useAudioAmplitude hook for Web Audio analyser lifecycle"
```

---

## Task 4: Soul-thread path math

**Files:**
- Create: `app/lib/soulThreadPath.ts`
- Test: `app/lib/soulThreadPath.test.ts`

**Interfaces:**
- Produces: `threadPaths(t: number, width: number, height: number): { d1: string; d2: string }`, consumed by `SoulThread.tsx` (Task 6).

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/lib/soulThreadPath.test.ts`
Expected: FAIL — `app/lib/soulThreadPath.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
export function threadPaths(t: number, width: number, height: number): { d1: string; d2: string } {
  const midY = height / 2;
  const amplitude = height * 0.35;
  const startX = width * 0.1;
  const endX = width * 0.9;
  const segments = 8;

  function buildPath(phaseOffset: number): string {
    const points: string[] = [];
    for (let i = 0; i <= segments; i++) {
      const x = startX + ((endX - startX) * i) / segments;
      const y = midY + Math.sin(t * 0.6 + phaseOffset + i * 1.4) * amplitude * (0.5 + i / segments / 2);
      points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    const [first, ...rest] = points;
    return `M ${first} L ${rest.join(" L ")}`;
  }

  return {
    d1: buildPath(0),
    d2: buildPath(Math.PI),
  };
}
```

Note: this uses straight-line (`L`) segments through 8 sample points rather than bezier curves — simpler to construct correctly, and since `t` advances continuously frame-to-frame in the rAF loop (Task 6), the path still reads as smooth, organic motion in practice rather than a static jagged polyline. If it looks too faceted during the Task 15 browser pass, that's a one-line follow-up (swap `L`/`join(" L ")` for a smoothing technique), not a redesign.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/lib/soulThreadPath.test.ts`
Expected: PASS, all assertions green.

- [ ] **Step 5: Commit**

```bash
git add app/lib/soulThreadPath.ts app/lib/soulThreadPath.test.ts
git commit -m "Add soul-thread path math with tests"
```

---

## Task 5: `StageBackdrop` component

**Files:**
- Create: `app/components/StageBackdrop.tsx`

**Interfaces:**
- Consumes: `app/globals.css`'s `breathe` keyframe (Task 1).
- Produces: `StageBackdrop({ getAmplitude: () => number })`, mounted once in `page.tsx` (Task 14).

- [ ] **Step 1: Write the component**

```tsx
"use client";
import { useEffect, useRef } from "react";

interface StageBackdropProps {
  getAmplitude: () => number;
}

export default function StageBackdrop({ getAmplitude }: StageBackdropProps) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let frame: number;
    function tick() {
      const glow = glowRef.current;
      if (glow) {
        const amplitude = getAmplitude();
        const boost = 1 + amplitude * 0.4;
        glow.style.setProperty("--amp-boost", boost.toFixed(3));
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [getAmplitude]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div
        ref={glowRef}
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(255,111,145,0.14), rgba(255,143,171,0.08) 35%, transparent 65%)",
          animation: "breathe 6s ease-in-out infinite",
          transform: "scale(var(--amp-boost, 1))",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/StageBackdrop.tsx
git commit -m "Add StageBackdrop breathing glow and vignette component"
```

---

## Task 6: `SoulThread` component

**Files:**
- Create: `app/components/SoulThread.tsx`

**Interfaces:**
- Consumes: `threadPaths` from `app/lib/soulThreadPath.ts` (Task 4).
- Produces: `SoulThread({ stageIndex: number; totalStages: number; getAmplitude: () => number })`, mounted once in `page.tsx` (Task 14).

- [ ] **Step 1: Write the component**

```tsx
"use client";
import { useEffect, useRef } from "react";
import { threadPaths } from "../lib/soulThreadPath";

interface SoulThreadProps {
  stageIndex: number;
  totalStages: number;
  getAmplitude: () => number;
}

export default function SoulThread({ stageIndex, totalStages, getAmplitude }: SoulThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const stageOpacity = 0.4 + 0.4 * (totalStages <= 1 ? 0 : stageIndex / (totalStages - 1));

    function applyOpacity(opacity: number) {
      path1Ref.current?.style.setProperty("opacity", opacity.toFixed(3));
      path2Ref.current?.style.setProperty("opacity", opacity.toFixed(3));
    }

    if (reducedMotion) {
      const { d1, d2 } = threadPaths(0, width, height);
      path1Ref.current?.setAttribute("d", d1);
      path2Ref.current?.setAttribute("d", d2);
      applyOpacity(stageOpacity);
      return;
    }

    let frame: number;
    function tick() {
      const t = performance.now() / 1000;
      const { d1, d2 } = threadPaths(t, width, height);
      path1Ref.current?.setAttribute("d", d1);
      path2Ref.current?.setAttribute("d", d2);
      const amplitude = getAmplitude();
      applyOpacity(stageOpacity * (1 + amplitude * 0.3));
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [stageIndex, totalStages, getAmplitude]);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-[8]" aria-hidden="true">
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

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/SoulThread.tsx
git commit -m "Add SoulThread animated motif component"
```

---

## Task 7: Emphasis-line data model, sync-engine update, and StageText blur-to-focus reveal

This task modifies previously-shipped, already-tested code (`getRevealedLines` in `app/lib/audioState.ts`) — its only consumer is `StageText.tsx`, so the change is contained, but existing tests must be updated (TDD: update the test first, watch it fail, then update the implementation).

**Files:**
- Modify: `app/types.ts`
- Modify: `app/data/stages.ts`
- Modify: `app/lib/audioState.ts`
- Modify: `app/lib/audioState.test.ts`
- Modify: `app/components/StageText.tsx`

**Interfaces:**
- Consumes: `signatureEase` from `app/lib/motion.ts` (Task 1).
- Produces: `getRevealedLines(stage: Stage, currentTime: number): { text: string; emphasis: boolean }[]` (return type changed from `string[]`) — the only consumer, `StageText.tsx`, is updated in this same task.

- [ ] **Step 1: Add the `emphasis` field to `StageLine` in `app/types.ts`**

Read the current file first. Change the `StageLine` interface from:

```ts
export interface StageLine {
  text: string;
  time: number; // seconds into the song this line appears
}
```

to:

```ts
export interface StageLine {
  text: string;
  time: number; // seconds into the song this line appears
  emphasis?: boolean; // renders larger/italic and holds longer in StageText
}
```

- [ ] **Step 2: Mark exactly three lines `emphasis: true` in `app/data/stages.ts`**

Read the current file first. Make exactly these three changes (find each line by its exact current text and add `, emphasis: true` before the closing brace):

In the `opening` stage, change:
```ts
{ time: 10, text: "There she is." },
```
to:
```ts
{ time: 10, text: "There she is.", emphasis: true },
```

In the `stage2` stage, change:
```ts
{ time: 66.5, text: "\"I love you.\"" },
```
to:
```ts
{ time: 66.5, text: "\"I love you.\"", emphasis: true },
```

In the `final` stage, change:
```ts
{ time: 185, text: "Type it for me — one more time." },
```
to:
```ts
{ time: 185, text: "Type it for me — one more time.", emphasis: true },
```

No other lines change.

- [ ] **Step 3: Update the existing `getRevealedLines` tests in `app/lib/audioState.test.ts` to expect the new return shape**

Read the current file first. Replace the entire existing `describe("getRevealedLines", ...)` block with:

```ts
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
```

- [ ] **Step 4: Run tests to verify the updated expectations fail against the current implementation**

Run: `npx vitest run app/lib/audioState.test.ts`
Expected: FAIL on the `getRevealedLines` tests — current implementation still returns plain strings, not `{ text, emphasis }` objects.

- [ ] **Step 5: Update `getRevealedLines` in `app/lib/audioState.ts`**

Read the current file first. Replace:

```ts
export function getRevealedLines(stage: Stage, currentTime: number): string[] {
  return stage.lines.filter((line) => currentTime >= line.time).map((line) => line.text);
}
```

with:

```ts
export function getRevealedLines(
  stage: Stage,
  currentTime: number
): { text: string; emphasis: boolean }[] {
  return stage.lines
    .filter((line) => currentTime >= line.time)
    .map((line) => ({ text: line.text, emphasis: line.emphasis ?? false }));
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run app/lib/audioState.test.ts`
Expected: PASS, all assertions green (including the other, unrelated `describe` blocks in this file — confirm they're unaffected).

- [ ] **Step 7: Rewrite `app/components/StageText.tsx`**

Replace the entire file with:

```tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import type { Stage } from "../types";
import { getRevealedLines } from "../lib/audioState";
import { signatureEase } from "../lib/motion";

interface StageTextProps {
  stage: Stage;
  currentTime: number;
}

const lineVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function StageText({ stage, currentTime }: StageTextProps) {
  const lines = getRevealedLines(stage, currentTime);

  return (
    <div className="flex max-h-[70vh] max-w-[600px] flex-col items-center justify-center gap-8 overflow-y-auto px-6 text-center">
      <AnimatePresence mode="popLayout">
        {lines.map((line, i) => (
          <motion.p
            key={`${stage.id}-${i}`}
            variants={lineVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: line.emphasis ? 1.7 : 1.1, ease: signatureEase }}
            className={
              line.emphasis
                ? "font-display text-[clamp(1.5625rem,3.125vw,2.1875rem)] italic text-cream"
                : "font-display text-[clamp(1.25rem,2.5vw,1.75rem)] leading-[1.6] text-cream"
            }
          >
            {line.text}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

(This preserves the `max-h-[70vh] overflow-y-auto` bound added during the original build's final review — do not drop it.)

- [ ] **Step 8: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 9: Run the full test suite as a regression check**

Run: `npm test`
Expected: all suites pass (this task touches `audioState.ts`/`.test.ts` — confirm no other test in the file regressed).

- [ ] **Step 10: Commit**

```bash
git add app/types.ts app/data/stages.ts app/lib/audioState.ts app/lib/audioState.test.ts app/components/StageText.tsx
git commit -m "Add emphasis-line data model and blur-to-focus StageText reveal"
```

---

## Task 8: `PreExperiencePrompt` redesign — opening gate as its own moment

**Files:**
- Modify: `app/components/PreExperiencePrompt.tsx`

**Interfaces:**
- Consumes: `signatureEase` from `app/lib/motion.ts` (Task 1), the global `breathe` keyframe from `app/globals.css` (Task 1).
- Produces: no interface change — still `PreExperiencePrompt({ onBegin: () => void })`, same as before.

- [ ] **Step 1: Rewrite the component**

Replace the entire file with:

```tsx
"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signatureEase } from "../lib/motion";

interface PreExperiencePromptProps {
  onBegin: () => void;
}

export default function PreExperiencePrompt({ onBegin }: PreExperiencePromptProps) {
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setHintVisible(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 px-6 text-center">
      <h1 className="font-display italic text-[clamp(2.5rem,6vw,4.5rem)] tracking-[-0.01em] text-cream">
        Before My Eyes Did
      </h1>
      <p className="max-w-[360px] text-sm text-muted">turn the sound on, and give this a few minutes</p>
      <button
        onClick={onBegin}
        style={{
          animation: "breathe 4s ease-in-out infinite",
          boxShadow: "0 0 24px rgba(255,111,145,0.4)",
        }}
        className="rounded-full bg-gold px-8 py-3 text-sm font-medium text-bg"
      >
        Begin
      </button>
      <AnimatePresence>
        {hintVisible && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: signatureEase }}
            className="text-xs text-muted"
          >
            turn your sound on
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/PreExperiencePrompt.tsx
git commit -m "Redesign opening gate: title scale, subtitle, glowing pulsing Begin button"
```

---

## Task 9: Cursor trail ember upgrade

**Files:**
- Modify: `app/lib/cursorTrail.ts`
- Modify: `app/lib/cursorTrail.test.ts`
- Modify: `app/components/CursorTrail.tsx`

**Interfaces:**
- Produces: `ROSE_RGB`/`GOLD_RGB` now hold the new pink values; adds `randomTrailRgb(): [number, number, number]` to `app/lib/cursorTrail.ts`, consumed by `CursorTrail.tsx`.
- Consumes: `getAmplitude: () => number`, threaded in from `page.tsx` (Task 14).

- [ ] **Step 1: Update the failing/changed tests in `app/lib/cursorTrail.test.ts`**

Read the current file first. The existing `ROSE_RGB`/`GOLD_RGB` assertions need new expected values, and a new test covers the added `randomTrailRgb` export. Replace the entire file with:

```ts
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
```

- [ ] **Step 2: Run tests to verify the new/changed assertions fail**

Run: `npx vitest run app/lib/cursorTrail.test.ts`
Expected: FAIL — `randomTrailRgb` doesn't exist yet, and `ROSE_RGB`/`GOLD_RGB` still hold the old values.

- [ ] **Step 3: Update `app/lib/cursorTrail.ts`**

Read the current file first. Replace the entire file with:

```ts
export function lerpColor(
  from: [number, number, number],
  to: [number, number, number],
  t: number
): [number, number, number] {
  const clamped = Math.min(1, Math.max(0, t));
  return [
    Math.round(from[0] + (to[0] - from[0]) * clamped),
    Math.round(from[1] + (to[1] - from[1]) * clamped),
    Math.round(from[2] + (to[2] - from[2]) * clamped),
  ];
}

export const ROSE_RGB: [number, number, number] = [255, 143, 171];
export const GOLD_RGB: [number, number, number] = [255, 111, 145];

export function trailColorForStage(stageIndex: number, totalStages: number): string {
  const t = totalStages <= 1 ? 0 : stageIndex / (totalStages - 1);
  const [r, g, b] = lerpColor(ROSE_RGB, GOLD_RGB, t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function trailRgbForStage(stageIndex: number, totalStages: number): [number, number, number] {
  const t = totalStages <= 1 ? 0 : stageIndex / (totalStages - 1);
  return lerpColor(ROSE_RGB, GOLD_RGB, t);
}

export function randomTrailRgb(): [number, number, number] {
  return lerpColor(ROSE_RGB, GOLD_RGB, Math.random());
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/lib/cursorTrail.test.ts`
Expected: PASS, all assertions green.

- [ ] **Step 5: Rewrite `app/components/CursorTrail.tsx`**

Read the current file first. Replace the entire file with:

```tsx
"use client";
import { useEffect, useRef } from "react";
import { randomTrailRgb } from "../lib/cursorTrail";

interface CursorTrailProps {
  getAmplitude: () => number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
  rgb: [number, number, number];
}

const FADE_FRAMES = 70;

export default function CursorTrail({ getAmplitude }: CursorTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<TrailPoint[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function handleMove(e: MouseEvent) {
      pointsRef.current.push({ x: e.clientX, y: e.clientY, age: 0, rgb: randomTrailRgb() });
      if (pointsRef.current.length > 40) pointsRef.current.shift();
    }
    window.addEventListener("mousemove", handleMove);

    let frame: number;
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const amplitude = getAmplitude();
      pointsRef.current = pointsRef.current
        .map((p) => ({ ...p, age: p.age + 1 }))
        .filter((p) => p.age < FADE_FRAMES);
      for (const p of pointsRef.current) {
        const fade = 1 - p.age / FADE_FRAMES;
        const radius = 6 * fade * (1 + amplitude * 0.5);
        ctx!.shadowBlur = 6;
        ctx!.shadowColor = `rgba(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}, ${fade * 0.6})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}, ${fade * 0.5})`;
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
    };
  }, [getAmplitude]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-10" aria-hidden="true" />;
}
```

Note: `stageIndex`/`totalStages` are removed from `CursorTrailProps` entirely — the per-stage color switch is replaced by per-particle random blending via `randomTrailRgb()`, so there's nothing left in this component that reads them. `page.tsx` (Task 14) calls this component as `<CursorTrail getAmplitude={getAmplitude} />`, with no `stageIndex`/`totalStages` props.

- [ ] **Step 6: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add app/lib/cursorTrail.ts app/lib/cursorTrail.test.ts app/components/CursorTrail.tsx
git commit -m "Upgrade cursor trail to blurred, per-particle pink ember style with amplitude reactivity"
```

---

## Task 10: Photo interlude — physical-print framing

**Files:**
- Modify: `app/components/PhotoInterlude.tsx`

**Interfaces:**
- Consumes: `signatureEase` from `app/lib/motion.ts` (Task 1).
- Produces: no interface change — still `PhotoInterlude({ interlude: PhotoInterludeData; currentTime: number })`.

- [ ] **Step 1: Rewrite the component**

Replace the entire file with:

```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { PhotoInterludeData } from "../types";
import { getPhotoProgress, getPhotoPhase, getSpotlightIndex } from "../lib/audioState";
import { signatureEase } from "../lib/motion";

interface PhotoInterludeProps {
  interlude: PhotoInterludeData;
  currentTime: number;
}

export default function PhotoInterlude({ interlude, currentTime }: PhotoInterludeProps) {
  const progress = getPhotoProgress(interlude, currentTime);
  const phase = getPhotoPhase(progress);
  const spotlightIndex = getSpotlightIndex(progress, interlude.photos.length);
  const spotlightPhoto = interlude.photos[spotlightIndex];

  return (
    <div className="relative h-full w-full" data-phase={phase}>
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 sm:gap-3 sm:p-8 md:grid-cols-4">
        {interlude.photos.map((photo, i) => {
          const rotation = (i % 2 === 0 ? -1 : 1) * (4 + (i % 3) * 2);
          const isSpotlit = phase === "spotlight" && i === spotlightIndex;
          return (
            <motion.div
              key={photo.src}
              initial={{ opacity: 0, scale: 0.8, rotate: rotation }}
              animate={{
                opacity: phase === "burst-in" || phase === "settle" || isSpotlit ? 1 : 0.4,
                scale: 1,
                rotate: rotation,
              }}
              transition={{ duration: 0.6, delay: phase === "burst-in" ? i * 0.1 : 0, ease: signatureEase }}
              style={{
                border: "6px solid rgba(243,234,217,0.4)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}
              className="relative aspect-[4/5] overflow-hidden rounded-md bg-panel"
            >
              {photo.src ? (
                <img src={photo.src} alt={photo.caption || "memory"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted">photo pending</div>
              )}
            </motion.div>
          );
        })}
      </div>
      <AnimatePresence>
        {phase === "spotlight" && spotlightPhoto && (
          <motion.div
            key={spotlightPhoto.src}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 5, ease: signatureEase }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90"
          >
            <img
              src={spotlightPhoto.src}
              alt={spotlightPhoto.caption || "memory"}
              style={{ boxShadow: "0 0 60px rgba(255,111,145,0.15), 0 25px 50px -12px rgba(0,0,0,0.5)" }}
              className="max-h-[70vh] max-w-[85vw] rounded-lg object-contain"
            />
            {spotlightPhoto.caption && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6, ease: signatureEase }}
                className="mt-4 font-display italic text-rose"
              >
                {spotlightPhoto.caption}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/PhotoInterlude.tsx
git commit -m "Add physical-print framing, spotlight glow, and two-beat caption to PhotoInterlude"
```

---

## Task 11: `AudioPlayer` custom chrome

**Files:**
- Modify: `app/components/AudioPlayer.tsx`

**Interfaces:**
- Produces: no interface change — still `AudioPlayer({ src: string; audioRef: React.RefObject<HTMLAudioElement>; onEnded?: () => void })`, matching the version already shipped (with the `onEnded` prop and mount-only volume-init `useEffect` from the original build's final review — both must be preserved, not dropped).

- [ ] **Step 1: Read the current file, then replace it entirely**

Read `app/components/AudioPlayer.tsx` first to confirm its current shape, then replace the whole file with:

```tsx
"use client";
import { useEffect, useState } from "react";

interface AudioPlayerProps {
  src: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  onEnded?: () => void;
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M3 1.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="2" y="1.5" width="3.5" height="11" />
      <rect x="8.5" y="1.5" width="3.5" height="11" />
    </svg>
  );
}

export default function AudioPlayer({ src, audioRef, onEnded }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => setLoadError(true));
    } else {
      audio.pause();
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    setVolume(next);
    if (audioRef.current) audioRef.current.volume = next;
  }

  return (
    <div
      className="fixed right-2 top-2 z-30 flex items-center gap-2 rounded-full bg-panel/80 px-3 py-1.5 backdrop-blur sm:right-4 sm:top-4 sm:gap-3 sm:px-4 sm:py-2"
      onClick={(e) => e.stopPropagation()}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onError={() => setLoadError(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
      />
      {loadError ? (
        <span className="text-xs text-muted">Add risk-it-all.mp3 to public/audio</span>
      ) : (
        <>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-6 w-6 items-center justify-center text-cream"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
            className="h-1 w-16 appearance-none rounded-full bg-line [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-gold [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/AudioPlayer.tsx
git commit -m "Replace text play/pause labels and native slider styling with custom pink chrome"
```

---

## Task 12: `ProgressIndicator` — dots to glowing fill-line

**Files:**
- Modify: `app/components/ProgressIndicator.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `ProgressIndicator({ progress: number })` — **interface change**: replaces `{ stages: { id: string }[]; activeStageId: string | null }` entirely. `progress` is a 0-1 value.
- Consumes (in `page.tsx`'s call site update only): `currentTime` and the last stage's `windowEnd`, already available in `page.tsx`.

- [ ] **Step 1: Rewrite `app/components/ProgressIndicator.tsx`**

Replace the entire file with:

```tsx
interface ProgressIndicatorProps {
  progress: number; // 0-1
}

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <div
      role="progressbar"
      aria-label="Experience progress"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-[2px] w-48 overflow-hidden rounded-full bg-line"
    >
      <div
        style={{
          width: `${clamped * 100}%`,
          boxShadow: "0 0 8px rgba(255,111,145,0.6)",
        }}
        className="h-full bg-gold transition-[width] duration-300 ease-out"
      />
    </div>
  );
}
```

- [ ] **Step 2: Update the one call site in `app/page.tsx`**

Read the current file first. This is a small, targeted change — do not touch anything else in `page.tsx` (the rest of the wiring for this upgrade happens in Task 14). Find the existing block:

```tsx
      {phase === "experience" && (
        <div className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2">
          <ProgressIndicator stages={stages} activeStageId={activeStage?.id ?? null} />
        </div>
      )}
```

Replace it with:

```tsx
      {phase === "experience" && (
        <div className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2">
          <ProgressIndicator progress={currentTime / stages[stages.length - 1].windowEnd} />
        </div>
      )}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/components/ProgressIndicator.tsx app/page.tsx
git commit -m "Replace ProgressIndicator dots with a thin glowing fill-line"
```

---

## Task 13: Remaining easing audit — `NameEcho`, `ClosingSequence`, `FinalScreen`

`page.tsx`'s own `AnimatePresence` wrapper transitions are deliberately handled in Task 14 instead of here, since that task already does a full rewrite of the file for the amplitude/backdrop/thread wiring — updating its easing here first would just get touched again immediately after.

**Files:**
- Modify: `app/components/NameEcho.tsx`
- Modify: `app/components/ClosingSequence.tsx`
- Modify: `app/components/FinalScreen.tsx`

**Interfaces:**
- Consumes: `signatureEase` from `app/lib/motion.ts` (Task 1).
- Produces: no interface changes to any of the three components.

- [ ] **Step 1: Rewrite `app/components/NameEcho.tsx`**

Read the current file first. Replace the entire file with:

```tsx
"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signatureEase } from "../lib/motion";

interface NameEchoProps {
  options: string[];
  onComplete: () => void;
  holdMs?: number;
}

export default function NameEcho({ options, onComplete, holdMs = 4000 }: NameEchoProps) {
  const [submitted, setSubmitted] = useState(false);
  const [value, setValue] = useState("");
  const [echo] = useState(() => options[Math.floor(Math.random() * options.length)]);

  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(onComplete, holdMs);
    return () => clearTimeout(timer);
  }, [submitted, onComplete, holdMs]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim().length === 0) return;
    setSubmitted(true);
  }

  return (
    <div className="flex flex-col items-center gap-6 px-6 text-center">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: signatureEase }}
            className="flex flex-col items-center gap-4"
          >
            <input
              aria-label="Type your name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="border-b border-gold bg-transparent px-2 py-1 text-center font-display text-2xl text-cream outline-none"
              autoFocus
            />
            <button
              type="submit"
              style={{ boxShadow: "0 0 24px rgba(255,111,145,0.4)" }}
              className="rounded-full bg-gold px-6 py-2 text-sm font-medium text-bg transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
            >
              Enter
            </button>
          </motion.form>
        ) : (
          <motion.p
            key="echo"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: signatureEase }}
            className="whitespace-pre-line font-display text-2xl italic text-rose sm:text-3xl"
          >
            {echo}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `app/components/ClosingSequence.tsx`**

Read the current file first. Replace the entire file with:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signatureEase } from "../lib/motion";

interface ClosingSequenceProps {
  lines: string[];
  intervalMs?: number;
  onComplete: () => void;
}

export default function ClosingSequence({ lines, intervalMs = 3200, onComplete }: ClosingSequenceProps) {
  const [index, setIndex] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    if (index >= lines.length) {
      if (!firedRef.current) {
        firedRef.current = true;
        onComplete();
      }
      return;
    }
    const timer = setTimeout(() => setIndex((i) => i + 1), intervalMs);
    return () => clearTimeout(timer);
  }, [index, lines.length, intervalMs, onComplete]);

  const visible = lines[index];

  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <AnimatePresence mode="wait">
        {visible && (
          <motion.p
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: signatureEase }}
            className="font-display text-xl italic text-cream sm:text-2xl"
          >
            {visible}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
```

(Preserves the `firedRef` duplicate-fire guard added during the original build's final review — do not drop it.)

- [ ] **Step 3: Rewrite `app/components/FinalScreen.tsx`**

Read the current file first. Replace the entire file with:

```tsx
interface FinalScreenProps {
  message: string;
  ctaLabel: string;
  onRestart: () => void;
}

export default function FinalScreen({ message, ctaLabel, onRestart }: FinalScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="font-display text-2xl text-cream sm:text-3xl">{message}</p>
      <button
        onClick={onRestart}
        style={{ boxShadow: "0 0 16px rgba(255,111,145,0.25)" }}
        className="rounded-full border border-gold px-8 py-3 text-sm font-medium text-gold transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-gold hover:text-bg"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Run the full test suite as a regression check**

Run: `npm test`
Expected: all suites still pass (none of these three files have their own tests, but confirm nothing else broke).

- [ ] **Step 6: Commit**

```bash
git add app/components/NameEcho.tsx app/components/ClosingSequence.tsx app/components/FinalScreen.tsx
git commit -m "Apply signature ease and consistent button glow to NameEcho, ClosingSequence, FinalScreen"
```

---

## Task 14: `FloatingParticles` amplitude reactivity

**Files:**
- Modify: `app/lib/particles.ts`
- Modify: `app/lib/particles.test.ts`
- Modify: `app/components/FloatingParticles.tsx`

**Interfaces:**
- Produces: `stepParticle(p: Particle, height: number, speedMultiplier?: number): Particle` — **signature change**, adds an optional third parameter defaulting to `1` (fully backward compatible; existing two-argument call sites are unaffected).
- Consumes: `getAmplitude: () => number`, threaded in from `page.tsx` (Task 15).

Care point: the amplitude multiplier must scale how far a particle moves *this frame only* — it must never get written into the particle's stored `speed` field, or the boost would compound every subsequent frame instead of tracking the current amplitude.

- [ ] **Step 1: Add the failing test for the new parameter**

Read `app/lib/particles.test.ts` first. Add this test inside the existing `describe("stepParticle", ...)` block (don't remove the two tests already there):

```ts
  it("applies an optional speed multiplier to this frame's displacement only, without changing stored speed", () => {
    const p = { x: 100, y: 100, radius: 1, speed: 2, drift: 0, opacity: 0.5 };
    const next = stepParticle(p, 600, 2);
    expect(next.y).toBe(96); // moved twice as far this frame (speed 2 * multiplier 2 = 4)
    expect(next.speed).toBe(2); // stored speed itself is unchanged, so it won't compound next frame
  });
```

- [ ] **Step 2: Run tests to verify the new test fails**

Run: `npx vitest run app/lib/particles.test.ts`
Expected: FAIL — `stepParticle` doesn't yet accept a third argument, so `next.y` comes out as `98` (unboosted), not `96`.

- [ ] **Step 3: Update `stepParticle` in `app/lib/particles.ts`**

Read the current file first. Replace:

```ts
export function stepParticle(p: Particle, height: number): Particle {
  const next = { ...p, y: p.y - p.speed, x: p.x + p.drift };
  if (next.y < 0) {
    next.y = height + 10;
  }
  return next;
}
```

with:

```ts
export function stepParticle(p: Particle, height: number, speedMultiplier: number = 1): Particle {
  const next = { ...p, y: p.y - p.speed * speedMultiplier, x: p.x + p.drift };
  if (next.y < 0) {
    next.y = height + 10;
  }
  return next;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/lib/particles.test.ts`
Expected: PASS, all assertions green (including the two pre-existing tests, confirming the default `speedMultiplier = 1` preserves prior behavior exactly).

- [ ] **Step 5: Update `app/components/FloatingParticles.tsx`**

Read the current file first. Replace the entire file with:

```tsx
"use client";
import { useEffect, useRef } from "react";
import { particleCountForStage, createParticle, stepParticle, type Particle } from "../lib/particles";

interface FloatingParticlesProps {
  stageIndex: number;
  totalStages: number;
  getAmplitude: () => number;
}

export default function FloatingParticles({ stageIndex, totalStages, getAmplitude }: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const count = particleCountForStage(stageIndex, totalStages);
    particlesRef.current = Array.from({ length: count }, () => createParticle(canvas.width, canvas.height));

    if (reducedMotion) {
      return () => window.removeEventListener("resize", resize);
    }

    let frame: number;
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const speedMultiplier = 1 + getAmplitude() * 0.6;
      particlesRef.current = particlesRef.current.map((p) => stepParticle(p, canvas!.height, speedMultiplier));
      for (const p of particlesRef.current) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(243, 234, 217, ${p.opacity})`;
        ctx!.fill();
      }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [stageIndex, totalStages, getAmplitude]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />;
}
```

- [ ] **Step 6: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add app/lib/particles.ts app/lib/particles.test.ts app/components/FloatingParticles.tsx
git commit -m "Add amplitude-reactive particle speed boost"
```

---

## Task 15: `page.tsx` orchestration — wire in the backdrop, soul-thread, and amplitude source

By the time this task runs, `page.tsx` already has the `ProgressIndicator` call site updated (Task 12). This task rewrites the whole file once more to add `StageBackdrop`, `SoulThread`, the `useAudioAmplitude` hook, the updated `CursorTrail`/`FloatingParticles` call sites, and `signatureEase` on this file's own `AnimatePresence` wrapper transitions — all in one pass, since touching the file a third time separately would be wasted work.

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `useAudioAmplitude` from `app/lib/useAudioAmplitude.ts` (Task 3); `StageBackdrop` from `app/components/StageBackdrop.tsx` (Task 5); `SoulThread` from `app/components/SoulThread.tsx` (Task 6); `signatureEase` from `app/lib/motion.ts` (Task 1); the updated `CursorTrail({ getAmplitude })` (Task 9) and `FloatingParticles({ stageIndex, totalStages, getAmplitude })` (Task 14) signatures.
- Produces: no external interface change — still the default-exported route entry point.

- [ ] **Step 1: Read the current file, then replace it entirely**

Read `app/page.tsx` first to confirm its current shape (it should already reflect Task 12's `ProgressIndicator` change). Replace the whole file with:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { stages, nameEchoOptions, closingSequence, finalScreen } from "./data/stages";
import { photoInterlude } from "./data/photos";
import { getActiveStage, isInPhotoInterlude, getNextStageWindowStart, getPhotoInterludeExitTarget } from "./lib/audioState";
import { useAudioAmplitude } from "./lib/useAudioAmplitude";
import { signatureEase } from "./lib/motion";
import AudioPlayer from "./components/AudioPlayer";
import FloatingParticles from "./components/FloatingParticles";
import CursorTrail from "./components/CursorTrail";
import StageBackdrop from "./components/StageBackdrop";
import SoulThread from "./components/SoulThread";
import PreExperiencePrompt from "./components/PreExperiencePrompt";
import StageText from "./components/StageText";
import PhotoInterlude from "./components/PhotoInterlude";
import ProgressIndicator from "./components/ProgressIndicator";
import NameEcho from "./components/NameEcho";
import ClosingSequence from "./components/ClosingSequence";
import FinalScreen from "./components/FinalScreen";

type Phase = "pre" | "experience" | "name" | "closing" | "final";

const FINAL_STAGE_ID = "final";

export default function Page() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [phase, setPhase] = useState<Phase>("pre");
  const [currentTime, setCurrentTime] = useState(0);
  const { initAmplitude, getAmplitude } = useAudioAmplitude();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function handleTimeUpdate() {
      setCurrentTime(audio!.currentTime);
    }
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  const activeStage = getActiveStage(stages, currentTime);
  const inPhotoInterlude = isInPhotoInterlude(photoInterlude, currentTime);
  const stageIndex = activeStage ? stages.findIndex((s) => s.id === activeStage.id) : 0;

  const finalStage = stages.find((s) => s.id === FINAL_STAGE_ID)!;
  const lastLineTime = finalStage.lines[finalStage.lines.length - 1].time;
  const reachedNamePrompt =
    phase === "experience" && activeStage?.id === FINAL_STAGE_ID && currentTime >= lastLineTime;

  useEffect(() => {
    if (reachedNamePrompt) {
      audioRef.current?.pause();
      setPhase("name");
    }
  }, [reachedNamePrompt]);

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
    setPhase("name");
  }

  function handleSkip() {
    const audio = audioRef.current;
    if (!audio) return;
    const next = inPhotoInterlude
      ? getPhotoInterludeExitTarget(photoInterlude, stages)
      : activeStage?.id === "stage2"
      ? photoInterlude.windowStart
      : activeStage
      ? getNextStageWindowStart(stages, activeStage.id)
      : null;
    if (next !== null) {
      audio.currentTime = next;
    }
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
    <main
      className="relative h-screen w-screen overflow-hidden bg-bg"
      onClick={phase === "experience" ? handleSkip : undefined}
    >
      <StageBackdrop getAmplitude={getAmplitude} />
      <FloatingParticles stageIndex={stageIndex} totalStages={stages.length} getAmplitude={getAmplitude} />
      <SoulThread stageIndex={stageIndex} totalStages={stages.length} getAmplitude={getAmplitude} />
      <CursorTrail getAmplitude={getAmplitude} />
      <AudioPlayer src="/audio/risk-it-all.mp3" audioRef={audioRef} onEnded={handleAudioEnded} />

      <div className="relative z-20 flex h-full w-full items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "pre" && (
            <motion.div key="pre" exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: signatureEase }}>
              <PreExperiencePrompt onBegin={handleBegin} />
            </motion.div>
          )}

          {phase === "experience" && inPhotoInterlude && (
            <motion.div
              key="photos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: signatureEase }}
              className="h-full w-full"
            >
              <PhotoInterlude interlude={photoInterlude} currentTime={currentTime} />
            </motion.div>
          )}

          {phase === "experience" && !inPhotoInterlude && activeStage && (
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

          {phase === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: signatureEase }}
            >
              <NameEcho options={nameEchoOptions} onComplete={() => setPhase("closing")} />
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

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Run the full test suite as a regression check**

Run: `npm test`
Expected: all suites pass (this task doesn't touch any `.test.ts` file, so this is purely a regression check on everything touched by Tasks 1-14).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "Wire StageBackdrop, SoulThread, and Web Audio amplitude into page.tsx orchestration"
```

---

## Task 16: Manual end-to-end browser verification

**Files:** None created or modified — this is a verification-only task, same philosophy as the original build's final manual pass.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: starts with no console errors.

- [ ] **Step 2: Verify the opening gate**

Open the app. Confirm: breathing pink glow + vignette + grain visible behind the content, large italic title, the new subtitle line ("turn the sound on, and give this a few minutes") between title and button, the Begin button has a visible soft pink glow and a slow pulsing scale, the existing 8-second hint still fades out on schedule.

- [ ] **Step 3: Click Begin and verify no console errors from the Web Audio setup**

Click Begin. In devtools console, confirm there are no errors or warnings related to `AudioContext`/`createMediaElementSource`/`AnalyserNode`. Confirm the soul-thread motif (two faint glowing lines) is visible and drifting slowly. Confirm the audio player shows real play/pause icons (not text) and a thin custom-styled volume slider.

- [ ] **Step 4: Verify the blur-to-focus reveal and emphasis lines**

Let the opening stage play (or seek via `document.querySelector('audio').currentTime = X; document.querySelector('audio').dispatchEvent(new Event('timeupdate'))` in devtools, as in the original build's verification). Confirm lines fade in with a blur-to-sharp transition rather than a plain fade. Seek to `currentTime = 10` (`"There she is."`) and confirm it renders noticeably larger and italic compared to surrounding lines. Repeat for `currentTime = 66.5` (the "I love you" line) and `currentTime = 185` (the "Type it for me" line in the final stage).

- [ ] **Step 5: Verify the photo interlude framing**

Seek to `currentTime = 100` (inside the 90-115 photo interlude window). Confirm each photo tile has a visible warm-white border and shadow (or, since real photos aren't added yet, the same framing visible around the broken-image/alt-text placeholders — confirm no crash). Confirm the spotlighted photo has a soft pink glow behind it, and that its caption (if present) fades in slightly after the photo itself rather than simultaneously.

- [ ] **Step 6: Verify the cursor trail**

Move the mouse around the screen during the experience phase. Confirm the trail reads as a soft blurred glow (not sharp dots), shows a visible mix of light and deep pink across different points in the same trail, and lingers noticeably longer than a quick flick (roughly ~1 second fade).

- [ ] **Step 7: Verify the progress indicator**

Confirm the bottom-of-screen progress indicator is now a single thin glowing horizontal line whose fill grows left-to-right as `currentTime` advances, not a row of dots.

- [ ] **Step 8: Verify amplitude reactivity doesn't break anything**

While the track plays, watch the backdrop glow, particle speed, cursor trail, and soul-thread brightness for a period. Confirm they don't need to visibly "pulse with the beat" precisely to pass this check — the bar is: no console errors, no visual glitching/flickering, and the ambient effects still look like calm, continuous motion (not jarring jumps) even as amplitude varies.

- [ ] **Step 9: Regression pass on the full flow**

Repeat the full click-through from the original build's verification: Begin → opening stage → stage1 → stage2 → photo interlude → stage3 → stage4 → final stage → name prompt → name echo → closing sequence → final screen → restart. Confirm every transition still works exactly as before (this upgrade changed a lot of styling and several prop interfaces — this step exists to catch anything that broke).

- [ ] **Step 10: Verify mobile viewport**

Open devtools responsive mode at 375×667. Confirm the opening gate, stage text (including a fully-revealed dense stage like `stage2`), and photo interlude all still fit without horizontal overflow or clipped content, and the audio player's custom chrome doesn't overlap other UI at this width.

- [ ] **Step 11: Verify reduced motion**

Enable "Emulate CSS prefers-reduced-motion: reduce" in devtools. Reload, click Begin. Confirm: the backdrop glow shows no breathing/amplitude pulsing (static), the soul-thread motif renders one static frame (no drift), the particle canvas and cursor trail show no motion (per the existing project-wide policy), and stage text still fades in via simple opacity per the global reduced-motion CSS rule.

No commit for this task — it's a verification pass. If any step fails, fix the relevant file and re-run that step before moving on.
