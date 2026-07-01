# Atmosphere & Design Upgrade — Before My Eyes Did

An upgrade pass on the already-shipped site (see `2026-06-30-before-my-eyes-did-design.md`), moving it from "correctly built" to "feels handcrafted and intimate." This is atmosphere, motion, typography, and chrome work layered onto the existing architecture — the audio-driven phase state machine, stage data model, and component responsibilities from the original design doc are unchanged unless explicitly called out below.

Validated with the user via the brainstorming visual companion: the atmosphere/typography/blur-reveal direction, the final pink color palette (with real swatches), the soul-thread motif concept, and the redesigned opening gate were all shown live and approved before this doc was written.

## Color System Change

- `--gold` value changes from `#c9a15a` to `#ff6f91` (bold romantic pink). `--rose` value changes from `#d98a82` to `#ff8fab` (lighter pink).
- **Token names stay `gold` and `rose`** — deliberate choice, not an oversight. Renaming would touch every `bg-gold`/`text-gold`/`border-gold`/`accent-gold`/`text-rose` reference across ~10 components for a same-session project; changing just the hex values gets the same visual result with a far smaller, lower-risk diff. Worth revisiting the names if this ever becomes a longer-lived codebase.
- Role split is unchanged from the original design: `gold` = primary accent (buttons, CTAs, progress fill, the deeper soul-thread line, the deep end of the cursor-trail blend). `rose` = secondary/emphasis accent (NameEcho echo text, emphasis-line color, the lighter soul-thread line, the light end of the cursor-trail blend).
- Floating particles (`FloatingParticles.tsx`) keep their existing warm white/cream color (`rgba(243, 234, 217, …)`, unchanged) — a deliberate contrast choice so the whole screen doesn't read as one flat pink tone. Everything else (glow, thread, trail, buttons, progress line) carries the pink identity; particles stay the neutral warm-white counterpoint.
- Both `tailwind.config.ts`'s `colors.gold`/`colors.rose` and the CSS custom properties in `globals.css` get the two value updates. No other tokens change.

## Motion System — One Signature Ease

New `app/lib/motion.ts`:

```ts
export const signatureEase = [0.16, 1, 0.3, 1] as const;
```

Every Framer Motion `transition` prop across every existing component gets audited and switched to `ease: signatureEase`, replacing whatever local value it used before (`"easeOut"`, `"easeInOut"`, ad hoc arrays). Durations stay per-component and per-purpose — a button press is still snappier than a line reveal — only the curve itself is unified.

## Atmosphere — `StageBackdrop` Component

New `app/components/StageBackdrop.tsx`, mounted once in `page.tsx`, always present (not phase-gated), stacked below the existing `FloatingParticles`/`CursorTrail` canvases.

Two layers, both new:
1. **Breathing glow** — a radial gradient blending `rose` and `gold`, animated via a `6s` ease-in-out CSS `breathe` keyframe (opacity 0.7→1, scale 1→1.05) as the idle/base case.
2. **Vignette** — a static radial gradient darkening the edges, always on, no animation.

The existing global grain overlay (`globals.css` `.grain-overlay`, rendered unconditionally in `layout.tsx`) is left exactly where it is — it's already correct project-wide, and folding it into `StageBackdrop` would add risk for no benefit. `StageBackdrop` only adds the two new layers.

**Amplitude reactivity:** `StageBackdrop` accepts `getAmplitude: () => number` (a stable function reference, not React state). It runs its own `requestAnimationFrame` loop — same pattern as `FloatingParticles` — reading `getAmplitude()` each frame and applying it as a multiplier on top of the base CSS breathing, via direct style mutation on a ref'd element (`glowRef.current.style.opacity = …`), bypassing React state entirely to avoid driving 60fps re-renders. Before the analyser initializes (i.e. during the `"pre"` phase, before "Begin" is clicked) or when `prefers-reduced-motion` is set, no rAF loop starts and the layer falls back to the static/CSS-only breathing.

## Web Audio Amplitude

New `app/lib/audioAmplitude.ts` — pure, unit-tested:

```ts
export function averageAmplitude(data: Uint8Array): number; // 0-1 normalized average
export function smoothAmplitude(previous: number, next: number, smoothing: number): number; // exponential smoothing
```

New `app/lib/useAudioAmplitude.ts` — a hook that owns the Web Audio lifecycle (not pure, not unit-tested — this is browser-API glue, verified via the manual browser pass instead):

- `initAmplitude(audioEl: HTMLAudioElement): void` — called exactly once, from `page.tsx`'s `handleBegin`, after the user's click. `AudioContext` requires a user gesture to start, and `createMediaElementSource` throws if called twice on the same element, so this must run once, post-click, guarded against re-invocation. Creates the `AudioContext`, the `MediaElementSource`, and an `AnalyserNode` (`fftSize = 256`), and wires `source → analyser → audioCtx.destination`. **The connection to `destination` is required** — skipping it would silence playback entirely, since attaching a `MediaElementSource` reroutes the element's audio through the Web Audio graph.
- `getAmplitude(): number` — a stable callback that reads `analyser.getByteFrequencyData()` into a reused `Uint8Array`, runs it through `averageAmplitude` + `smoothAmplitude`, and returns the current smoothed value. Safe to call before `initAmplitude` has run (returns `0`).

`page.tsx` calls `initAmplitude` inside `handleBegin` and passes `getAmplitude` down to four consumers, each using it as a small multiplier on top of behavior it already has:

- `StageBackdrop`: multiplies the breathing glow's opacity/scale (detailed above).
- `FloatingParticles`: multiplies each particle's effective speed in `stepParticle` (e.g. `speed * (1 + amplitude * 0.6)`) — louder moments drift particles slightly faster, quieter moments slow back toward the existing scripted per-stage speed.
- `CursorTrail`: multiplies each trail point's drawn radius (detailed below).
- `SoulThread`: multiplies the stroke opacity / drop-shadow radius on top of the existing stage-based brightening (detailed below) — louder moments make the thread glow a little brighter, independent of which stage is active.

**Fallback:** if `AudioContext`/`createMediaElementSource` throws or isn't available, `getAmplitude()` simply always returns `0`. Every consumer above treats amplitude as an *additive* multiplier on top of its existing scripted per-stage behavior, so a constant `0` degrades gracefully to exactly today's behavior — never a broken or blank state.

## Soul-Thread Motif — `SoulThread` Component

New `app/lib/soulThreadPath.ts` — pure, unit-tested:

```ts
export function threadPaths(t: number, width: number, height: number): { d1: string; d2: string };
```

Returns two SVG path `d` strings whose control points are offset by sine functions of `t`, so the two paths drift and cross organically over time rather than looping mechanically.

New `app/components/SoulThread.tsx` — renders an SVG with two `<path>` elements (`stroke: rose` / `stroke: gold`, `filter: drop-shadow(0 0 8px currentColor)`), driven by a `requestAnimationFrame` loop calling `threadPaths(performance.now() / 1000, …)` and setting each path's `d` attribute directly via a ref — same direct-DOM-mutation pattern the canvas components already use, not React state. Takes `stageIndex`/`totalStages`, and `getAmplitude` props; base glow intensity (stroke opacity, `0.4` at `stageIndex 0` rising linearly to `0.8` at the last stage) increases toward the Final stage, and `getAmplitude()` is read on the same rAF tick and added as a further multiplier (`opacity * (1 + amplitude * 0.3)`) so louder moments brighten the thread independent of stage. Respects `prefers-reduced-motion` (renders one static pair of paths at the stage-based opacity, no rAF loop, no amplitude read). Mounted once in `page.tsx` as a persistent, low-opacity element sitting behind the stage text, above the backdrop glow — not tied to any single stage's mount/unmount cycle.

## Line Reveals — Blur-to-Focus + Emphasis Lines

`app/types.ts` — `StageLine` gains an optional field:

```ts
export interface StageLine {
  text: string;
  time: number;
  emphasis?: boolean;
}
```

`app/data/stages.ts` — exactly three lines get `emphasis: true`, matching what the user's spec named as the emotionally loaded ones:
- `opening` stage, time `10`: "There she is."
- `stage2`, time `66.5`: `"\"I love you.\""`
- `final` stage, time `185`: "Type it for me — one more time."

No other lines change.

`app/components/StageText.tsx` — reveal variant changes from the current opacity+y fade to:

```ts
const lineVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.1, ease: signatureEase } },
};
```

Emphasis lines render 25% larger and italic, and their `visible` transition uses `duration: 1.7` (the base `1.1` plus a `0.6`s hold) instead of the standard `1.1`, so they read as a held beat rather than passing at the same pace as neighboring lines — implemented as a per-line transition override, not a separate timer.

## Typography

- Body lines: `font-size: clamp(1.25rem, 2.5vw, 1.75rem)`, `line-height: 1.6`, `max-width: 600px`, centered (adjusts `StageText`'s existing centered/capped wrapper to these exact values).
- Titles (site title on the opening gate): `clamp(2.5rem, 6vw, 4.5rem)`, Fraunces italic, `letter-spacing: -0.01em`.
- Emphasis lines: 25% larger than surrounding body text (see above).
- Looser vertical rhythm: `StageText`'s line gap increases from the current `gap-4` to a looser spacing (`gap-8`/`gap-10` equivalent) so each line reads as its own held breath rather than a paragraph.

## Opening Gate — `PreExperiencePrompt` Redesign

Per the approved mockup: title in the new large italic Fraunces scale, a new subtitle line ("turn the sound on, and give this a few minutes") between the title and the Begin button, the Begin button gets a soft pink `box-shadow` glow and a slow (`4s`) scale-pulse (the same `breathe`-style keyframe as the backdrop glow, different target/speed), and the existing 8-second-fade hint text stays underneath, unchanged. `StageBackdrop`'s glow/grain/vignette are already active behind this screen since `StageBackdrop` is unconditionally mounted, not phase-gated.

## Cursor Trail — Ember Style

`app/lib/cursorTrail.ts` — `lerpColor`/`trailColorForStage`/`trailRgbForStage` stay structurally unchanged; only the `ROSE_RGB`/`GOLD_RGB` endpoint constants update to the new pink values. New behavior: each trail point gets its own randomly chosen blend position between the two endpoints at creation time (rather than every point in a given stage sharing one `trailRgbForStage(stageIndex, …)` color), so a single trail shows a mix of light and deep pink instead of one flat tone.

`app/components/CursorTrail.tsx` — increase the canvas shadow-blur radius per point to `6` (up from the implicit `0`) for a softer glow, less "dot"; extend the fade window from the current 30-frame cutoff to 70 frames (~1.15s at 60fps) so trails linger longer; read `getAmplitude()` and add it (scaled, e.g. `radius * (1 + amplitude * 0.5)`) to each point's drawn radius so louder moments in the track visibly widen the trail.

## Photo Interlude — Physical-Print Framing

`app/components/PhotoInterlude.tsx`:
- Each photo tile gets a warm-white border (`border: 6px solid rgba(243,234,217,0.4)`) and a soft drop shadow (`box-shadow: 0 4px 20px rgba(0,0,0,0.4)`). Existing deterministic per-index collage rotation is unchanged.
- The spotlight overlay gets a soft pink glow behind the image (`box-shadow` using the new `gold` value at low opacity).
- Caption reveal becomes two-beat: the photo's own fade/scale-in completes first, then the caption gets an explicit `delay: 0.4` on its own transition, rather than appearing simultaneously with the photo.

## Chrome / Micro-UI

- `AudioPlayer.tsx`: replace the text "Play"/"Pause" labels with small inline SVG icons in the palette; restyle the volume `<input type="range">` with custom track/thumb styling via Tailwind arbitrary-variant classes (`[&::-webkit-slider-thumb]` / `[&::-moz-range-thumb]`) — no new dependency needed.
- `ProgressIndicator.tsx`: replace the row of dots with a single thin horizontal glowing fill-line. Needs a new `progress: number` (0-1) prop, computed in `page.tsx` from `currentTime` and the final stage's `windowEnd`.
- New `:focus-visible` rule in `globals.css`: soft pink outline on interactive elements instead of the browser default.
- All buttons (Begin, restart) get the same glow + `signatureEase` treatment on hover/press.

## Testing Scope (same philosophy as the original build)

Automated Vitest tests only for the new pure functions: `app/lib/audioAmplitude.ts` (`averageAmplitude`/`smoothAmplitude` — fully testable against plain `Uint8Array` fixtures) and `app/lib/soulThreadPath.ts` (`threadPaths` — testable by asserting the returned path strings vary correctly with `t` and stay well-formed SVG path data). Everything visual — `StageBackdrop`, `SoulThread` rendering, every recolored component, the new typography scale, the opening gate, cursor trail, photo framing, and chrome — gets verified the same way as the original build: a Playwright-driven browser pass at the end, screenshotted and checked against what was approved in the visual companion mockups during brainstorming.

## Out of Scope for This Pass

- No changes to the phase state machine, stage timestamps, stage content, or any already-approved architectural decision from the original design doc.
- No changes to deployment strategy, `.gitignore`/`.vercelignore` setup, or privacy handling.
- The `AudioContext`/analyser only ever initializes after "Begin" is clicked — never before — keeping the pre-experience screen exactly as lightweight as today until the visitor commits to starting.
