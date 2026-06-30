# Before My Eyes Did Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-page Next.js love letter ("Before My Eyes Did") whose staged text and photo interlude are driven by the actual playback position of an `<audio>` element, ending in a name-echo and closing sequence, then deploy it to an unlisted Vercel URL.

**Architecture:** Pure functions in `app/lib/` compute "what should be visible right now" from `audio.currentTime` plus static data in `app/data/`; `app/page.tsx` is the only component that owns the `<audio>` ref, listens to `timeupdate`, and feeds derived state into otherwise-dumb presentational components. No independent timers drive the song-synced portion. The post-song flow (name input → echo → closing lines → final screen) is explicitly self-paced with its own short timers, since the spec gives those lines no timestamps and the song has effectively ended by then.

**Tech Stack:** Next.js 14 (App Router) + TypeScript + React 18, Tailwind CSS v3, Framer Motion v11, hand-rolled `<canvas>` for ambient effects, native `<audio>`, Vitest for pure-function unit tests.

## Global Constraints

- Next.js 14.2.x, React 18.3.x — do not let installs drift to Next 15 / React 19, several APIs used here (plain `page.tsx` default export, no async `params`) assume the 14.x App Router shape.
- Tailwind v3.4.x specifically (not v4) — v4's config format is CSS-first and incompatible with the `tailwind.config.ts` written in Task 1.
- No backend, no database, no auth, no analytics, no env vars.
- Colors (exact hex): `--bg:#1c1620 --bg-soft:#251c2c --panel:#2a2032 --line:#3a2e44 --cream:#f3ead9 --gold:#c9a15a --rose:#d98a82 --muted:#9a8aa3`.
- Fonts: Fraunces (display/headings, italic for emphasis) + Inter (body/UI) via `next/font/google`. Not Playfair Display, not Quicksand.
- All stage/photo/closing/echo **content text** is copied verbatim from Ali's source document — do not paraphrase or "improve" it.
- `prefers-reduced-motion` must fall back to simple opacity fades, no parallax/zoom/canvas motion.
- The repo is git-initialized locally but must **never** be pushed to GitHub or any git host. `public/audio/*` and `public/photos/*` (real files) are gitignored; deployment goes through the `vercel` CLI directly (confirmed: the Vercel CLI does **not** read `.gitignore` — it only respects its own default ignore list plus `.vercelignore` — so gitignored local files still upload fine).
- **Testing strategy (deliberate scope decision):** this ships same-session, not as a maintained product (per Ali's spec). Automated unit tests (Vitest) are written only for the pure logic in `app/lib/` — the song-sync math is the one place a silent bug would be hard to notice and would break the whole point of the project. UI components are implementation + TypeScript-compile-clean, verified once at the end via an actual browser pass (Task 14), per the standing rule that frontend work is verified by using it in a browser, not by mocking it in a test runner.

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next-env.d.ts`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `.gitignore`, `.vercelignore`
- Create: `app/layout.tsx`, `app/globals.css`, `app/types.ts`
- Create: `public/audio/.gitkeep`, `public/photos/.gitkeep`

**Interfaces:**
- Produces: `Stage`, `StageLine`, `PhotoItem`, `PhotoInterludeData` TypeScript interfaces in `app/types.ts`, imported by every later task.
- Produces: CSS custom properties (`--bg`, `--cream`, etc.) and Tailwind color tokens (`bg-bg`, `text-cream`, `bg-gold`, etc.) usable by every later component.

- [ ] **Step 1: Initialize npm and install pinned dependencies**

```bash
npm init -y
npm install next@14.2.5 react@18.3.1 react-dom@18.3.1 framer-motion@11.3.19
npm install -D typescript@5.4.5 @types/node@20.14.0 @types/react@18.3.3 @types/react-dom@18.3.0 tailwindcss@3.4.4 postcss@8.4.38 autoprefixer@10.4.19 eslint@8.57.0 eslint-config-next@14.2.5 vitest@1.6.0
```

- [ ] **Step 2: Write `package.json` scripts**

Open the generated `package.json` and replace the `"scripts"` block with:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

(Keep the `"dependencies"` / `"devDependencies"` blocks npm already wrote — just merge in `"scripts"` and set `"private": true`.)

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 5: Write `next.config.js`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
```

- [ ] **Step 6: Write `postcss.config.js`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Write `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#1c1620",
        "bg-soft": "#251c2c",
        panel: "#2a2032",
        line: "#3a2e44",
        cream: "#f3ead9",
        gold: "#c9a15a",
        rose: "#d98a82",
        muted: "#9a8aa3",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 8: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
});
```

- [ ] **Step 9: Write `app/types.ts`**

```ts
export interface StageLine {
  text: string;
  time: number; // seconds into the song this line appears
}

export interface Stage {
  id: string;
  title: string;
  windowStart: number; // seconds
  windowEnd: number; // seconds
  lines: StageLine[];
}

export interface PhotoItem {
  src: string;
  caption: string;
}

export interface PhotoInterludeData {
  windowStart: number;
  windowEnd: number;
  photos: PhotoItem[];
}
```

- [ ] **Step 10: Write `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #1c1620;
  --bg-soft: #251c2c;
  --panel: #2a2032;
  --line: #3a2e44;
  --cream: #f3ead9;
  --gold: #c9a15a;
  --rose: #d98a82;
  --muted: #9a8aa3;
}

html,
body {
  background-color: var(--bg);
  color: var(--cream);
  height: 100%;
}

body {
  font-family: var(--font-inter), sans-serif;
}

.grain-overlay {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 5;
  opacity: 0.05;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 11: Write `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Before My Eyes Did",
  description: "A letter, set to a song.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${inter.variable}`}>
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 12: Create placeholder asset folders**

```bash
mkdir -p public/audio public/photos
touch public/audio/.gitkeep public/photos/.gitkeep
```

- [ ] **Step 13: Write `.gitignore`**

```
node_modules
.next/
.env*
public/audio/*
!public/audio/.gitkeep
public/photos/*
!public/photos/.gitkeep
```

- [ ] **Step 14: Write `.vercelignore`**

```
docs
```

(Intentionally minimal — `public/audio` and `public/photos` must NOT be listed here, since the live deploy needs them. Vercel's own default ignore list already covers `node_modules`, `.git`, `.next`.)

- [ ] **Step 15: Verify the scaffold compiles**

Run: `npm run typecheck`
Expected: exits 0, no errors. (`app/page.tsx` doesn't exist yet — that's fine, `tsc --noEmit` only checks files that exist; it doesn't require a Next.js route to be present. Task 12 adds `page.tsx`.)

- [ ] **Step 16: Commit**

```bash
git add package.json package-lock.json tsconfig.json next-env.d.ts next.config.js tailwind.config.ts postcss.config.js vitest.config.ts app .gitignore .vercelignore public
git commit -m "Scaffold Next.js + Tailwind + Vitest project"
```

---

## Task 2: Data layer — stage content and photo placeholders

**Files:**
- Create: `app/data/stages.ts`
- Create: `app/data/photos.ts`

**Interfaces:**
- Consumes: `Stage`, `StageLine`, `PhotoItem`, `PhotoInterludeData` from `app/types.ts` (Task 1).
- Produces: `stages: Stage[]`, `nameEchoOptions: string[]`, `closingSequence: string[]`, `finalScreen: { message: string; ctaLabel: string }` from `app/data/stages.ts`. Produces `photoInterlude: PhotoInterludeData` from `app/data/photos.ts`. Every later task that needs content imports from these two files — never hardcode stage text elsewhere.

- [ ] **Step 1: Write `app/data/stages.ts`**

```ts
import type { Stage } from "../types";

export const stages: Stage[] = [
  {
    id: "opening",
    title: "Before My Eyes Did",
    windowStart: 0,
    windowEnd: 22,
    lines: [
      { time: 0, text: "Some people arrive like weather — slow, you can see them coming." },
      { time: 2, text: "You arrived like déjà vu." },
      { time: 4, text: "A feeling before a fact." },
      { time: 6, text: "I hadn't learned your laugh yet. Hadn't heard your voice catch when something moves you." },
      { time: 8, text: "But some quieter part of me had already exhaled." },
      { time: 10, text: "There she is." },
      { time: 12, text: "Not love at first sight — recognition." },
      { time: 14, text: "Like my soul kept a seat for you, long before my eyes found you in the room." },
    ],
  },
  {
    id: "stage1",
    title: "A Profile, Then a Certainty",
    windowStart: 22,
    windowEnd: 55,
    lines: [
      { time: 22, text: "It started with a swipe — the smallest, most ordinary motion." },
      { time: 24.5, text: "One photo among hundreds I'd already forgotten." },
      { time: 27, text: "I didn't know your favorite color. Your dreams. The sound of your laugh." },
      { time: 29.5, text: "And yet something in your eyes made my thumb stop moving." },
      { time: 32, text: "Not luck." },
      { time: 34.5, text: "Not the algorithm." },
      { time: 37, text: "It felt less like meeting someone new, and more like finally finding who I'd been looking for." },
    ],
  },
  {
    id: "stage2",
    title: "Breakfast, and the Slip",
    windowStart: 55,
    windowEnd: 90,
    lines: [
      { time: 55, text: "Our first date. Breakfast, sunlight, too much coffee." },
      { time: 57.3, text: "We talked like people who'd known each other in some other life." },
      { time: 59.6, text: "I said something — I don't even remember what." },
      { time: 61.9, text: "You laughed." },
      { time: 64.2, text: "And two seconds later, before your mind could catch up to your heart —" },
      { time: 66.5, text: "\"I love you.\"" },
      { time: 68.8, text: "You heard yourself say it." },
      { time: 71.1, text: "Your face did everything words couldn't." },
      { time: 73.4, text: "We laughed it off. But I don't think it was an accident." },
      { time: 75.7, text: "I think your heart just got there first." },
      { time: 78, text: "It's still one of my favorite mornings — not for what you said, but for how completely you it was to say it." },
    ],
  },
  {
    id: "stage3",
    title: "Fizzy",
    windowStart: 115,
    windowEnd: 145,
    lines: [
      { time: 115, text: "Somewhere between every conversation, Fizza became Fizzy." },
      { time: 117.7, text: "Funny, how a nickname can hold this much." },
      { time: 120.4, text: "There are moments now that belong only to us." },
      { time: 123.1, text: "[INSERT YOUR INSIDE JOKE HERE]" },
      { time: 125.8, text: "Small. Ordinary, probably, to anyone else." },
      { time: 128.5, text: "But they're already some of my favorite minutes alive." },
      { time: 131.2, text: "We've only had a month." },
      { time: 133.9, text: "And somehow even the ordinary ones already feel worth keeping." },
    ],
  },
  {
    id: "stage4",
    title: "One Month, Already Home",
    windowStart: 145,
    windowEnd: 175,
    lines: [
      { time: 145, text: "Thirty-some days. On paper, that's nothing." },
      { time: 148, text: "But something about how my days move has changed." },
      { time: 151, text: "Quieter mornings. Better punctuation in my own thoughts." },
      { time: 154, text: "Less noise, somehow, even when nothing's gone quiet." },
      { time: 157, text: "I used to think home was something I'd build eventually." },
      { time: 160, text: "Now I think I just hadn't met it yet." },
      { time: 163, text: "A month in, and you're already the part of my day I look forward to before I'm fully awake." },
    ],
  },
  {
    id: "final",
    title: "Let Me Carry Your Name",
    windowStart: 175,
    windowEnd: 195,
    lines: [
      { time: 175, text: "There's something about your name." },
      { time: 177.5, text: "Not the sound of it." },
      { time: 180, text: "Who it belongs to." },
      { time: 182.5, text: "I want to carry it the way you carry mine." },
      { time: 185, text: "Type it for me — one more time." },
    ],
  },
];

export const nameEchoOptions = [
  "Fizza.\nI think my heart learned your name long before my ears ever did.",
  "Fizza.\nAlready my favorite word — not for how it sounds, but for who it belongs to.",
  "Fizza.\nIf I could only keep one word for the rest of my life, I'd keep yours.",
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

Note: stage windows are intentionally contiguous (`opening` 0–22, `stage1` 22–55, `stage2` 55–90, then a 90–115 gap reserved for the photo interlude, `stage3` 115–145, `stage4` 145–175, `final` 175–195). Keep them contiguous if timestamps are edited later — `page.tsx`'s skip logic (Task 12) assumes `stage3.windowStart === photoInterlude.windowEnd`.

- [ ] **Step 2: Write `app/data/photos.ts`**

```ts
import type { PhotoInterludeData } from "../types";

export const photoInterlude: PhotoInterludeData = {
  windowStart: 90,
  windowEnd: 115,
  photos: [
    { src: "/photos/01.jpg", caption: "" },
    { src: "/photos/02.jpg", caption: "" },
    { src: "/photos/03.jpg", caption: "" },
    { src: "/photos/04.jpg", caption: "" },
    { src: "/photos/05.jpg", caption: "" },
    { src: "/photos/06.jpg", caption: "" },
    { src: "/photos/07.jpg", caption: "" },
  ],
};
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/data
git commit -m "Add stage and photo interlude content"
```

---

## Task 3: Core sync-engine pure functions

**Files:**
- Create: `app/lib/audioState.ts`
- Test: `app/lib/audioState.test.ts`

**Interfaces:**
- Consumes: `Stage`, `PhotoInterludeData` from `app/types.ts`.
- Produces: `getActiveStage`, `getRevealedLines`, `isInPhotoInterlude`, `getPhotoProgress`, `getPhotoPhase` (returns `"burst-in" | "spotlight" | "settle"`), `getSpotlightIndex`, `getNextStageWindowStart`, `getPhotoInterludeExitTarget` — all imported by `PhotoInterlude.tsx`, `StageText.tsx`, and `page.tsx` in later tasks.

- [ ] **Step 1: Write the failing tests**

```ts
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
    expect(getRevealedLines(stages[0], 6)).toEqual(["a0", "a5"]);
  });

  it("includes a line exactly at currentTime", () => {
    expect(getRevealedLines(stages[0], 5)).toEqual(["a0", "a5"]);
  });

  it("excludes lines that haven't happened yet", () => {
    expect(getRevealedLines(stages[0], 2)).toEqual(["a0"]);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/lib/audioState.test.ts`
Expected: FAIL — `app/lib/audioState.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
import type { Stage } from "../types";

export function getActiveStage(stages: Stage[], currentTime: number): Stage | null {
  return stages.find((s) => currentTime >= s.windowStart && currentTime < s.windowEnd) ?? null;
}

export function getRevealedLines(stage: Stage, currentTime: number): string[] {
  return stage.lines.filter((line) => currentTime >= line.time).map((line) => line.text);
}

export function isInPhotoInterlude(
  interlude: { windowStart: number; windowEnd: number },
  currentTime: number
): boolean {
  return currentTime >= interlude.windowStart && currentTime < interlude.windowEnd;
}

export function getPhotoProgress(
  interlude: { windowStart: number; windowEnd: number },
  currentTime: number
): number {
  const { windowStart, windowEnd } = interlude;
  if (windowEnd <= windowStart) return 0;
  const raw = (currentTime - windowStart) / (windowEnd - windowStart);
  return Math.min(1, Math.max(0, raw));
}

export type PhotoPhase = "burst-in" | "spotlight" | "settle";

export function getPhotoPhase(progress: number): PhotoPhase {
  if (progress < 0.15) return "burst-in";
  if (progress < 0.9) return "spotlight";
  return "settle";
}

export function getSpotlightIndex(progress: number, photoCount: number): number {
  if (photoCount <= 0) return 0;
  const cycleProgress = (progress - 0.15) / (0.9 - 0.15);
  const clamped = Math.min(0.999, Math.max(0, cycleProgress));
  return Math.floor(clamped * photoCount);
}

export function getNextStageWindowStart(stages: Stage[], currentStageId: string): number | null {
  const idx = stages.findIndex((s) => s.id === currentStageId);
  if (idx === -1 || idx === stages.length - 1) return null;
  return stages[idx + 1].windowStart;
}

export function getPhotoInterludeExitTarget(
  interlude: { windowEnd: number },
  stages: Stage[]
): number | null {
  const next = stages.find((s) => s.windowStart === interlude.windowEnd);
  return next ? next.windowStart : null;
}
```

(Ignore the stray `"settle" as PhotoPhase,` token in the `getPhotoPhase` draft above — it's a typo. The real line 2 of that function body is simply `if (progress < 0.9) return "spotlight";`. Write it correctly the first time.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/lib/audioState.test.ts`
Expected: PASS, all assertions green. (If you transcribed the `getPhotoPhase` thresholds wrong, this is where it'll show up — its three branches are exercised at the exact boundary values 0.149/0.15/0.899/0.9 above.)

- [ ] **Step 5: Commit**

```bash
git add app/lib/audioState.ts app/lib/audioState.test.ts
git commit -m "Add audio-driven sync engine with tests"
```

---

## Task 4: Ambient canvas pure logic (particles + cursor trail)

**Files:**
- Create: `app/lib/particles.ts`
- Test: `app/lib/particles.test.ts`
- Create: `app/lib/cursorTrail.ts`
- Test: `app/lib/cursorTrail.test.ts`

**Interfaces:**
- Produces: `Particle` type, `particleCountForStage`, `createParticle`, `stepParticle` from `app/lib/particles.ts`. Produces `lerpColor`, `ROSE_RGB`, `GOLD_RGB`, `trailColorForStage` from `app/lib/cursorTrail.ts`. Both consumed by the canvas components in Task 12.

- [ ] **Step 1: Write the failing tests for particles**

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run app/lib/particles.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement `app/lib/particles.ts`**

```ts
export interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  opacity: number;
}

const BASE_COUNT = 18;
const MAX_COUNT = 60;

export function particleCountForStage(stageIndex: number, totalStages: number): number {
  const ratio = totalStages <= 1 ? 1 : stageIndex / (totalStages - 1);
  return Math.round(BASE_COUNT + (MAX_COUNT - BASE_COUNT) * ratio);
}

export function createParticle(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 0.6 + Math.random() * 1.8,
    speed: 0.15 + Math.random() * 0.35,
    drift: (Math.random() - 0.5) * 0.3,
    opacity: 0.15 + Math.random() * 0.35,
  };
}

export function stepParticle(p: Particle, height: number): Particle {
  const next = { ...p, y: p.y - p.speed, x: p.x + p.drift };
  if (next.y < -10) {
    next.y = height + 10;
  }
  return next;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run app/lib/particles.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing tests for cursor trail color**

```ts
import { describe, it, expect } from "vitest";
import { lerpColor, trailColorForStage, ROSE_RGB, GOLD_RGB } from "./cursorTrail";

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
```

- [ ] **Step 6: Run to verify failure**

Run: `npx vitest run app/lib/cursorTrail.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 7: Implement `app/lib/cursorTrail.ts`**

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

export const ROSE_RGB: [number, number, number] = [217, 138, 130];
export const GOLD_RGB: [number, number, number] = [201, 161, 90];

export function trailColorForStage(stageIndex: number, totalStages: number): string {
  const t = totalStages <= 1 ? 0 : stageIndex / (totalStages - 1);
  const [r, g, b] = lerpColor(ROSE_RGB, GOLD_RGB, t);
  return `rgb(${r}, ${g}, ${b})`;
}
```

- [ ] **Step 8: Run to verify pass**

Run: `npx vitest run app/lib/cursorTrail.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add app/lib/particles.ts app/lib/particles.test.ts app/lib/cursorTrail.ts app/lib/cursorTrail.test.ts
git commit -m "Add ambient canvas particle and cursor-trail logic with tests"
```

---

## Task 5: AudioPlayer component

**Files:**
- Create: `app/components/AudioPlayer.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks beyond React types.
- Produces: `AudioPlayer({ src: string; audioRef: React.RefObject<HTMLAudioElement> })`. `page.tsx` (Task 12) creates the `audioRef` via `useRef` and reads `audioRef.current.currentTime` directly for the sync engine — this component only renders the `<audio>` element and play/pause/volume UI, it does not own playback state beyond its own UI.

- [ ] **Step 1: Write the component**

```tsx
"use client";
import { useState } from "react";

interface AudioPlayerProps {
  src: string;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export default function AudioPlayer({ src, audioRef }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [volume, setVolume] = useState(0.8);

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
      className="fixed right-4 top-4 z-30 flex items-center gap-3 rounded-full bg-panel/80 px-4 py-2 backdrop-blur"
      onClick={(e) => e.stopPropagation()}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onError={() => setLoadError(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {loadError ? (
        <span className="text-xs text-muted">Add risk-it-all.mp3 to public/audio</span>
      ) : (
        <>
          <button onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"} className="text-sm text-cream">
            {isPlaying ? "Pause" : "Play"}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
            className="w-16 accent-gold"
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
git commit -m "Add AudioPlayer component with missing-file fallback"
```

---

## Task 6: PreExperiencePrompt component

**Files:**
- Create: `app/components/PreExperiencePrompt.tsx`

**Interfaces:**
- Produces: `PreExperiencePrompt({ onBegin: () => void })`, consumed by `page.tsx` (Task 12) during the `"pre"` phase.

- [ ] **Step 1: Write the component**

```tsx
"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
      <h1 className="font-display text-3xl text-cream sm:text-4xl">Before My Eyes Did</h1>
      <button
        onClick={onBegin}
        className="rounded-full bg-gold px-8 py-3 text-sm font-medium text-bg transition-transform hover:scale-105"
      >
        Begin
      </button>
      <AnimatePresence>
        {hintVisible && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
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
git commit -m "Add PreExperiencePrompt component"
```

---

## Task 7: StageText and ProgressIndicator components

**Files:**
- Create: `app/components/StageText.tsx`
- Create: `app/components/ProgressIndicator.tsx`

**Interfaces:**
- Consumes: `Stage` from `app/types.ts`, `getRevealedLines` from `app/lib/audioState.ts` (Task 3).
- Produces: `StageText({ stage: Stage; currentTime: number })` and `ProgressIndicator({ stages: { id: string }[]; activeStageId: string | null })`, both consumed by `page.tsx` (Task 12).

- [ ] **Step 1: Write `StageText.tsx`**

```tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import type { Stage } from "../types";
import { getRevealedLines } from "../lib/audioState";

interface StageTextProps {
  stage: Stage;
  currentTime: number;
}

export default function StageText({ stage, currentTime }: StageTextProps) {
  const lines = getRevealedLines(stage, currentTime);

  return (
    <div className="flex max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <AnimatePresence mode="popLayout">
        {lines.map((text, i) => (
          <motion.p
            key={`${stage.id}-${i}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-display text-xl text-cream sm:text-2xl md:text-3xl"
          >
            {text}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Write `ProgressIndicator.tsx`**

```tsx
interface ProgressIndicatorProps {
  stages: { id: string }[];
  activeStageId: string | null;
}

export default function ProgressIndicator({ stages, activeStageId }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-label="Experience progress">
      {stages.map((stage) => (
        <span
          key={stage.id}
          className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
            stage.id === activeStageId ? "bg-gold" : "bg-line"
          }`}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/components/StageText.tsx app/components/ProgressIndicator.tsx
git commit -m "Add StageText and ProgressIndicator components"
```

---

## Task 8: PhotoInterlude component

**Files:**
- Create: `app/components/PhotoInterlude.tsx`

**Interfaces:**
- Consumes: `PhotoInterludeData` from `app/types.ts`; `getPhotoProgress`, `getPhotoPhase`, `getSpotlightIndex` from `app/lib/audioState.ts` (Task 3).
- Produces: `PhotoInterlude({ interlude: PhotoInterludeData; currentTime: number })`, consumed by `page.tsx` (Task 12).

- [ ] **Step 1: Write the component**

```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { PhotoInterludeData } from "../types";
import { getPhotoProgress, getPhotoPhase, getSpotlightIndex } from "../lib/audioState";

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
      <div className="grid grid-cols-3 gap-3 p-8 sm:grid-cols-4">
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
              transition={{ duration: 0.6, delay: phase === "burst-in" ? i * 0.1 : 0 }}
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
            transition={{ duration: 5, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90"
          >
            <img
              src={spotlightPhoto.src}
              alt={spotlightPhoto.caption || "memory"}
              className="max-h-[70vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
            />
            {spotlightPhoto.caption && (
              <p className="mt-4 font-display italic text-rose">{spotlightPhoto.caption}</p>
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
git commit -m "Add PhotoInterlude three-phase component"
```

---

## Task 9: NameEcho component

**Files:**
- Create: `app/components/NameEcho.tsx`

**Interfaces:**
- Produces: `NameEcho({ options: string[]; onComplete: () => void; holdMs?: number })`, consumed by `page.tsx` (Task 12). Calls `onComplete` `holdMs` (default 4000) milliseconds after she submits her name, signaling `page.tsx` to advance to the closing sequence.

- [ ] **Step 1: Write the component**

```tsx
"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
            className="flex flex-col items-center gap-4"
          >
            <input
              aria-label="Type your name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="border-b border-gold bg-transparent px-2 py-1 text-center font-display text-2xl text-cream outline-none"
              autoFocus
            />
            <button type="submit" className="rounded-full bg-gold px-6 py-2 text-sm font-medium text-bg">
              Enter
            </button>
          </motion.form>
        ) : (
          <motion.p
            key="echo"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
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

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/components/NameEcho.tsx
git commit -m "Add NameEcho component"
```

---

## Task 10: ClosingSequence and FinalScreen components

**Files:**
- Create: `app/components/ClosingSequence.tsx`
- Create: `app/components/FinalScreen.tsx`

**Interfaces:**
- Produces: `ClosingSequence({ lines: string[]; intervalMs?: number; onComplete: () => void })` — self-paced, calls `onComplete` once every line has shown.
- Produces: `FinalScreen({ message: string; ctaLabel: string; onRestart: () => void })`.
- Both consumed by `page.tsx` (Task 12).

- [ ] **Step 1: Write `ClosingSequence.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ClosingSequenceProps {
  lines: string[];
  intervalMs?: number;
  onComplete: () => void;
}

export default function ClosingSequence({ lines, intervalMs = 3200, onComplete }: ClosingSequenceProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= lines.length) {
      onComplete();
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
            transition={{ duration: 1.2 }}
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

- [ ] **Step 2: Write `FinalScreen.tsx`**

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
        className="rounded-full border border-gold px-8 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-bg"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/components/ClosingSequence.tsx app/components/FinalScreen.tsx
git commit -m "Add ClosingSequence and FinalScreen components"
```

---

## Task 11: Ambient canvas components (FloatingParticles + CursorTrail)

**Files:**
- Create: `app/components/FloatingParticles.tsx`
- Create: `app/components/CursorTrail.tsx`

**Interfaces:**
- Consumes: `particleCountForStage`, `createParticle`, `stepParticle`, `Particle` from `app/lib/particles.ts`; `trailColorForStage` from `app/lib/cursorTrail.ts` (Task 4).
- Produces: `FloatingParticles({ stageIndex: number; totalStages: number })` and `CursorTrail({ stageIndex: number; totalStages: number })`, consumed by `page.tsx` (Task 12).

- [ ] **Step 1: Write `FloatingParticles.tsx`**

```tsx
"use client";
import { useEffect, useRef } from "react";
import { particleCountForStage, createParticle, stepParticle, type Particle } from "../lib/particles";

interface FloatingParticlesProps {
  stageIndex: number;
  totalStages: number;
}

export default function FloatingParticles({ stageIndex, totalStages }: FloatingParticlesProps) {
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
      particlesRef.current = particlesRef.current.map((p) => stepParticle(p, canvas!.height));
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
  }, [stageIndex, totalStages]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />;
}
```

- [ ] **Step 2: Write `CursorTrail.tsx`**

```tsx
"use client";
import { useEffect, useRef } from "react";
import { trailColorForStage } from "../lib/cursorTrail";

interface CursorTrailProps {
  stageIndex: number;
  totalStages: number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

export default function CursorTrail({ stageIndex, totalStages }: CursorTrailProps) {
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
      pointsRef.current.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (pointsRef.current.length > 40) pointsRef.current.shift();
    }
    window.addEventListener("mousemove", handleMove);

    const color = trailColorForStage(stageIndex, totalStages);
    let frame: number;
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      pointsRef.current = pointsRef.current.map((p) => ({ ...p, age: p.age + 1 })).filter((p) => p.age < 30);
      for (const p of pointsRef.current) {
        const opacity = 1 - p.age / 30;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 6 * opacity, 0, Math.PI * 2);
        const [r, g, b] = color.replace("rgb(", "").replace(")", "").split(",").map(Number);
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`;
        ctx!.fill();
      }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
    };
  }, [stageIndex, totalStages]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-10" aria-hidden="true" />;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/components/FloatingParticles.tsx app/components/CursorTrail.tsx
git commit -m "Add ambient canvas particle field and cursor trail"
```

---

## Task 12: page.tsx orchestration

**Files:**
- Create: `app/page.tsx`

**Interfaces:**
- Consumes: `stages`, `nameEchoOptions`, `closingSequence`, `finalScreen` from `app/data/stages.ts`; `photoInterlude` from `app/data/photos.ts`; `getActiveStage`, `isInPhotoInterlude`, `getNextStageWindowStart`, `getPhotoInterludeExitTarget` from `app/lib/audioState.ts`; every component from Tasks 5–11.
- Produces: the default-exported `Page` component — the route entry point, nothing else depends on it.

- [ ] **Step 1: Write the component**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { stages, nameEchoOptions, closingSequence, finalScreen } from "./data/stages";
import { photoInterlude } from "./data/photos";
import { getActiveStage, isInPhotoInterlude, getNextStageWindowStart, getPhotoInterludeExitTarget } from "./lib/audioState";
import AudioPlayer from "./components/AudioPlayer";
import FloatingParticles from "./components/FloatingParticles";
import CursorTrail from "./components/CursorTrail";
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
    audioRef.current?.play().catch(() => {});
  }

  function handleSkip() {
    const audio = audioRef.current;
    if (!audio) return;
    const next = inPhotoInterlude
      ? getPhotoInterludeExitTarget(photoInterlude, stages)
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
    setPhase("pre");
  }

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-bg"
      onClick={phase === "experience" ? handleSkip : undefined}
    >
      <FloatingParticles stageIndex={stageIndex} totalStages={stages.length} />
      <CursorTrail stageIndex={stageIndex} totalStages={stages.length} />
      <AudioPlayer src="/audio/risk-it-all.mp3" audioRef={audioRef} />

      <div className="relative z-20 flex h-full w-full items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "pre" && (
            <motion.div key="pre" exit={{ opacity: 0 }}>
              <PreExperiencePrompt onBegin={handleBegin} />
            </motion.div>
          )}

          {phase === "experience" && inPhotoInterlude && (
            <motion.div
              key="photos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
              transition={{ duration: 0.8 }}
            >
              <StageText stage={activeStage} currentTime={currentTime} />
            </motion.div>
          )}

          {phase === "name" && (
            <motion.div key="name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <NameEcho options={nameEchoOptions} onComplete={() => setPhase("closing")} />
            </motion.div>
          )}

          {phase === "closing" && (
            <motion.div
              key="closing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <ClosingSequence lines={closingSequence} onComplete={() => setPhase("final")} />
            </motion.div>
          )}

          {phase === "final" && (
            <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FinalScreen message={finalScreen.message} ctaLabel={finalScreen.ctaLabel} onRestart={handleRestart} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === "experience" && (
        <div className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2">
          <ProgressIndicator stages={stages} activeStageId={activeStage?.id ?? null} />
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS — all `app/lib/*.test.ts` suites from Tasks 3–4 still pass (this task doesn't touch lib code, this is a regression check).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "Wire page.tsx orchestration: audio-driven phase state machine"
```

---

## Task 13: Mobile responsiveness and reduced-motion pass

**Files:**
- Modify: `app/components/StageText.tsx`, `app/components/PhotoInterlude.tsx`, `app/components/AudioPlayer.tsx`, `app/globals.css`

**Interfaces:** No new interfaces — this task only adjusts Tailwind classes and CSS, no prop/type changes.

- [ ] **Step 1: Add a narrow-viewport check for the photo collage grid**

In `app/components/PhotoInterlude.tsx`, change the grid container class from:
```
className="grid grid-cols-3 gap-3 p-8 sm:grid-cols-4"
```
to:
```
className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 sm:gap-3 sm:p-8 md:grid-cols-4"
```

- [ ] **Step 2: Shrink the AudioPlayer control bar on small screens**

In `app/components/AudioPlayer.tsx`, change the outer wrapper class from:
```
className="fixed right-4 top-4 z-30 flex items-center gap-3 rounded-full bg-panel/80 px-4 py-2 backdrop-blur"
```
to:
```
className="fixed right-2 top-2 z-30 flex items-center gap-2 rounded-full bg-panel/80 px-3 py-1.5 backdrop-blur sm:right-4 sm:top-4 sm:gap-3 sm:px-4 sm:py-2"
```

- [ ] **Step 3: Verify `StageText` line width is readable on a 375px viewport**

`StageText.tsx` already wraps lines in `max-w-2xl px-6 text-center` (set in Task 7) — confirm this is still present, no change needed if so.

- [ ] **Step 4: Confirm the reduced-motion CSS block from Task 1 is in place**

Read `app/globals.css` and confirm the `@media (prefers-reduced-motion: reduce)` block from Task 1, Step 10 is unchanged. This handles the global CSS-transition fallback; `FloatingParticles.tsx` and `CursorTrail.tsx` already check `window.matchMedia("(prefers-reduced-motion: reduce)")` directly (Task 11) to skip canvas animation entirely.

- [ ] **Step 5: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add app/components/PhotoInterlude.tsx app/components/AudioPlayer.tsx
git commit -m "Mobile responsiveness pass for photo collage and audio controls"
```

---

## Task 14: Manual end-to-end browser verification

**Files:** None created or modified — this is a verification-only task.

This is the substitute for the component-level automated tests this plan deliberately skipped (see Global Constraints). Do this in an actual browser, not by reading the code.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: starts on `http://localhost:3000` with no console errors.

- [ ] **Step 2: Open the page and verify the pre-experience state**

Open `http://localhost:3000` in a browser. Confirm: "Before My Eyes Did" title and "Begin" button render, "turn your sound on" hint is visible, and (since `public/audio/risk-it-all.mp3` doesn't exist yet) the AudioPlayer shows the "Add risk-it-all.mp3 to public/audio" fallback message instead of a broken player — confirm no console errors despite the missing file.

- [ ] **Step 3: Click Begin and verify the opening stage**

Click "Begin." Confirm the phase switches to "experience" and the opening stage's first line ("Some people arrive like weather...") appears. Since there's no audio file, `currentTime` stays at 0 — this is expected; later lines won't appear without real audio. This step only confirms the phase transition and first-line render, not full playback (that requires Task 15's real audio file).

- [ ] **Step 4: Force-advance through stages using devtools**

In the browser devtools console, run `document.querySelector('audio').dispatchEvent(new Event('timeupdate'))` after manually setting `document.querySelector('audio').currentTime = 100` (jsdom-free, this works against the real `<audio>` element even without a loaded file, since `currentTime` is a plain settable property). Repeat with values `5`, `30`, `60`, `100` (photo interlude — confirm the collage and spotlight cycle render), `120`, `150`, `185` (confirm phase switches to "name" and the name input appears).

- [ ] **Step 5: Verify the name echo and closing flow**

Type a name into the input and submit. Confirm one of the three `nameEchoOptions` lines renders. Wait ~4 seconds, confirm it auto-advances to the closing sequence, which cycles through all 8 lines roughly every 3.2 seconds, then lands on the final screen with the "Turn the Next Page" button.

- [ ] **Step 6: Verify restart**

Click "Turn the Next Page." Confirm the page returns to the pre-experience prompt with the Begin button, and re-clicking Begin restarts the flow from the opening stage.

- [ ] **Step 7: Verify mobile layout**

Open devtools responsive mode at 375×667 (iPhone SE size). Repeat steps 2-3. Confirm no horizontal scrollbar, text doesn't overflow its container, AudioPlayer controls don't overlap the title.

- [ ] **Step 8: Verify reduced motion**

In devtools, enable "Emulate CSS prefers-reduced-motion: reduce" (Rendering tab). Reload, click Begin. Confirm the particle canvas and cursor trail render no visible motion (static or absent), and stage text still fades in via simple opacity rather than the y-offset slide.

No commit for this task — it's a verification pass. If any step fails, fix the relevant component file and re-run that step before moving on.

---

## Task 15: Vercel deployment

**Files:**
- None created — this task runs commands and confirms an external deployment.

**Important:** this task makes the project reachable at a public (if unlisted) URL. Confirm with Ali before running Step 2 if this plan is being executed unattended — deployment is exactly the kind of "affects shared state outside this machine" action that should get a human's go-ahead at the moment it happens, not just at planning time.

- [ ] **Step 1: Confirm real assets are in place**

Verify `public/audio/risk-it-all.mp3` exists (Ali adds this locally — see the design doc's "Outstanding Inputs" list) and `public/photos/` has real files matching the `src` values in `app/data/photos.ts`. If they're not in place yet, deploying now just means the live site will show the same "add the file" fallback / "photo pending" tiles seen in dev — not a hard blocker, but confirm this is intentional before proceeding.

- [ ] **Step 2: Log in and deploy via the Vercel CLI**

```bash
vercel login
vercel
```

When prompted for a project name, choose something non-descriptive (not "fizza-love-letter" or similar) — per the design doc, the live URL should not broadcast what the site is. Accept the default settings for framework detection (Next.js auto-detected) and build command.

- [ ] **Step 3: Verify the live deployment**

Open the URL the CLI prints. Confirm: the song actually plays (proves `public/audio` made it into the deploy despite being gitignored — the Vercel CLI doesn't read `.gitignore`, only `.vercelignore` and its own defaults, confirmed during planning), the photo interlude shows real photos if they were added, and there are no console errors.

- [ ] **Step 4: Promote to production if it looks right**

```bash
vercel --prod
```

Confirm the production URL (without a preview-deployment suffix) also works end-to-end.

No commit for this task (nothing in the working tree changes — `.vercel/` project-link metadata gets created locally; leave it untracked, it's already covered by no `.gitignore` change needed since the repo is never pushed anyway, but add it to `.gitignore` for tidiness if `vercel` creates it):

```bash
echo ".vercel" >> .gitignore
git add .gitignore
git commit -m "Ignore local Vercel project-link metadata"
```
