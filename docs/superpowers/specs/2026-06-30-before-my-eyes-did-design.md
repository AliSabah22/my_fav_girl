# Before My Eyes Did — Design

A single-page Next.js love letter for Fizza, synced to "Risk It All" by Bruno Mars. She clicks "Begin," the song plays, and staged text reveals advance with the actual playback position. Partway through, an instrumental break triggers a photo memory sequence. Near the end she types her name and gets a personalized line back, then the experience closes with a fading sequence and a final button.

No backend, no database, no auth, no analytics. Fully static/client-side. Built to ship same-session, not as a maintained product.

## Tech Stack

- Next.js 14+ (App Router), TypeScript, React 18
- Tailwind CSS for styling
- Framer Motion for all transitions (`AnimatePresence` for stage crossfades, line reveals, photo interlude motion) — no hand-rolled CSS/state transition logic
- Hand-rolled `<canvas>` for the particle field and cursor trail — no particle library
- Native HTML5 `<audio>` element — no audio library
- Google Fonts: Fraunces (display/headings, italic for emphasis) + Inter (body/UI). Not Playfair Display or Quicksand.
- No CMS, no env vars

## Folder Structure

```
app/
  layout.tsx
  page.tsx
  globals.css
  data/
    stages.ts          — stage content + timing
    photos.ts           — photo interlude data
  components/
    AudioPlayer.tsx
    FloatingParticles.tsx
    CursorTrail.tsx
    PreExperiencePrompt.tsx
    StageText.tsx
    PhotoInterlude.tsx
    NameEcho.tsx
    ProgressIndicator.tsx
public/
  audio/               — risk-it-all.mp3 added locally, gitignored
  photos/               — 01.jpg..07.jpg added locally, gitignored
```

## Architecture — Audio-Driven State Machine

**The song's actual playback position drives everything. No independent `setInterval` clock.**

```ts
interface StageLine {
  text: string;
  time: number; // seconds into the song this line appears
}

interface Stage {
  id: string;
  title: string;
  windowStart: number; // seconds
  windowEnd: number;   // seconds
  lines: StageLine[];
}

interface PhotoItem {
  src: string;
  caption: string;
}

interface PhotoInterludeData {
  windowStart: number;
  windowEnd: number;
  photos: PhotoItem[];
}
```

In `page.tsx`:
- Listen to the `<audio>` element's `timeupdate` event, read `audio.currentTime`.
- Determine the active stage (or the photo interlude) by checking which `windowStart`–`windowEnd` range `currentTime` falls in.
- Within a stage, reveal each `StageLine` whose `time` has passed (compare against `currentTime`, not elapsed-since-stage-start).
- Manual advance (click) is a fallback/skip — clicking jumps `audio.currentTime` forward to the next stage's `windowStart`, not just UI state, so audio and visuals never desync.
- If audio is paused, everything pauses with it — no separate clock keeps running.

This avoids drift from buffering, autoplay delay, or browser throttling that a fixed-timer approach would be vulnerable to.

## Design Tokens

**Colors:**
```
--bg: #1c1620        (deep plum/charcoal)
--bg-soft: #251c2c
--panel: #2a2032
--line: #3a2e44
--cream: #f3ead9     (primary text)
--gold: #c9a15a      (accent — buttons, highlights)
--rose: #d98a82      (secondary accent — emotional beats, CTAs)
--muted: #9a8aa3
```

**Motion language:**
- Stage transitions: crossfade + slight vertical drift via `AnimatePresence`.
- Particle/cursor-trail intensity scales with stage number; cursor trail color shifts rose → gold across stages.
- Subtle CSS grain/noise overlay for a cinematic, non-flat feel.
- Respect `prefers-reduced-motion`: fall back to simple fades, no parallax/zoom.

## Stage Content

All stage text, timestamps (placeholder estimates — Ali replaces with real values after listening through the actual file), the photo interlude window, `nameEchoOptions`, `closingSequence`, and `finalScreen` content are taken verbatim from the source build prompt Ali supplied. They are not reproduced in full here to avoid drift between two copies of the same content — `app/data/stages.ts` and `app/data/photos.ts` are the source of truth once written.

Known placeholders that ship as explicit, clearly-marked TODOs (not blockers):
- All `time` values in `stages.ts` (currently estimates based on song shape).
- Photo interlude `windowStart`/`windowEnd` (currently 90/115, unconfirmed against the real instrumental break).
- The Stage 3 inside-joke line (currently literal placeholder text).
- `photos[].src` / `caption` (currently 7 placeholder entries, expects 7–10 real files).

## Photo Interlude (`PhotoInterlude.tsx`)

Driven by `progress = (currentTime - windowStart) / (windowEnd - windowStart)`, a 0–1 value, across three phases so the sequence scales to whatever length the real instrumental break turns out to be:

1. **Burst-in** (progress 0–0.15): photos fade/scale into a scattered, slightly-rotated collage, staggered ~100ms apart.
2. **Spotlight cycle** (progress 0.15–0.9): one photo at a time lifts to full-bleed center with a slow Ken Burns zoom/pan (~4–6s each), caption fades in beneath it, then settles back as the next lifts out. Cycles through all photos across this window.
3. **Settle** (progress 0.9–1): full collage holds with subtle parallax drift, then clears as the next stage begins.

## Component Responsibilities

| Component | Job |
|---|---|
| `AudioPlayer.tsx` | Fixed player UI (play/pause, volume), owns the `<audio>` ref used by the state machine |
| `FloatingParticles.tsx` | Canvas ambient particles, intensity scales with stage number |
| `CursorTrail.tsx` | Canvas glow trail following the mouse, color shifts rose→gold across stages |
| `PreExperiencePrompt.tsx` | Pre-start overlay pointing at "Begin," auto-dismisses after 8s |
| `StageText.tsx` | Reusable Framer Motion line-reveal — takes a `Stage` and current `audio.currentTime`, renders revealed lines |
| `PhotoInterlude.tsx` | The three-phase photo sequence above |
| `NameEcho.tsx` | Name input + personalized echo line (rotates through `nameEchoOptions`) |
| `ProgressIndicator.tsx` | Subtle dot/line showing overall progress through the experience |

## Asset Handling Before Real Files Exist

Ali will add `public/audio/risk-it-all.mp3` and `public/photos/*` locally after the build is otherwise done; they won't exist for most of the build/dev process. The app must not crash or dead-end without them:
- If the audio file 404s or fails to load, `AudioPlayer` shows a quiet inline message ("Add risk-it-all.mp3 to public/audio") instead of a broken/silent player, and the "Begin" flow doesn't hard-fail.
- Missing photo files render as empty placeholder tiles (using the existing collage layout) rather than broken-image icons or a crashed `PhotoInterlude`.
- Once the real files are dropped in, behavior is exactly per spec — this only affects the pre-asset dev window.

## Deployment & Privacy

- Fizza will view this via a deployed link, not a local handoff.
- Local git repo for version control, but **never pushed to GitHub or any git host**. `public/audio/*.mp3` and `public/photos/*` stay gitignored per the `.gitignore` below.
- Deployment happens via the `vercel` CLI directly from the local project folder. The CLI uploads the working directory (respecting `.vercelignore`, not `.gitignore`), so the gitignored audio/photo files still get deployed even though they're never committed. A `.vercelignore` will explicitly allow `public/audio` and `public/photos` (i.e. only excludes `node_modules`, `.next`, etc.) so this works correctly.
- The Vercel project is given a non-descriptive name so the resulting `*.vercel.app` URL doesn't broadcast what the site is. No passcode/auth gate — unlisted-by-obscurity only, matching the "no auth" requirement. Ali shares the URL directly with Fizza.

## `.gitignore`

```
node_modules
.next/
.env*
public/audio/*.mp3
public/photos/*
```

(Keep the song file and her photos local-only — never commit them, especially since the project may be inspected/shared as code later even though it's never pushed.)

## Build Order

1. Scaffold: Next.js + TS + Tailwind, fonts, layout shell, color tokens.
2. Content layer: `data/stages.ts`, `data/photos.ts`, the `timeupdate`-driven state machine.
3. Visual layer: particles, cursor trail, Framer Motion transitions, `AudioPlayer` (including missing-asset fallback states).
4. `PhotoInterlude` component (three-phase sequence).
5. Ending flow: `NameEcho`, closing sequence, final screen + CTA.
6. Polish: mobile responsiveness, reduced-motion fallback, timing pass once real timestamps are in.
7. Deployment: `.vercelignore`, `vercel` CLI deploy with a non-descriptive project name, confirm the live URL works end-to-end including audio/photos.

## Outstanding Inputs Needed From Ali (do not block the build on these)

- Real timestamps for all `time` values, once he's listened through the actual file.
- Confirmed start/end of the instrumental break for the photo interlude.
- The inside joke for Stage 3.
- 7–10 actual photos in `public/photos/` + one short caption each.
- The actual `risk-it-all.mp3` file in `public/audio/`.

## Definition of Done (MVP)

- Loads, plays the song, advances through all six text stages synced to real playback time.
- Photo interlude triggers correctly in its window and cycles all photos before handing back to text.
- Name input works and renders a personalized echo.
- Closing sequence + final screen render, "Turn the Next Page" restarts cleanly (resets audio to 0, returns to the pre-experience prompt).
- Mobile-responsive, no console errors.
- Gracefully handles a missing mp3/photos during dev without crashing.
- Deployed to a Vercel URL with the real audio/photos working, repo never pushed to a git host.
