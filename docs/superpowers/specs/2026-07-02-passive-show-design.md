# Passive Show Format + Thread Interaction

Builds on the existing architecture and the atmosphere/design upgrade already implemented. Changes the interaction model, photo interlude scheduling, the name-moment mechanic, and stage timing. No changes to `StageBackdrop`, `signatureEase`, typography, cursor trail, or chrome — those stay as shipped.

Validated with the user via the brainstorming visual companion: the thread merge/braid visual concept (phase offset shrinking, frequency tightening, amplitude reduction) was shown live as an interactive scrub demo and approved before this doc was written.

## Interaction Model — Passive by Default

Click-to-advance is removed. `page.tsx`'s `handleSkip` function and the `onClick={phase === "experience" ? handleSkip : undefined}` on `<main>` are deleted entirely. The only two moments the visitor acts:
1. Clicking "Begin" (required — browser autoplay policy needs a user gesture).
2. Optionally moving the pointer during the 135–150s thread window (never required — see below).

Everything else plays on its own, driven entirely by `audio.currentTime`.

## Photo Interlude — Shelved, Not Deleted

`app/components/PhotoInterlude.tsx` and `app/data/photos.ts` stay in the repository untouched. `page.tsx` stops importing `PhotoInterlude`, stops calling `isInPhotoInterlude`, and stops branching on it in the render tree. Nothing schedules it. Re-enabling later means adding a window back into the schedule and restoring the import/branch — no component work needed.

## Stage Timing — Computed From Real Duration

`page.tsx` adds a `duration` state (`number`, default `204`, the reference assumption), set once via the audio element's `loadedmetadata` event reading `audio.duration`. Everything that currently reads `stages` (the static array) instead reads the output of a new pure function, `scaleStagesToDuration(stages, duration)`, called once per render with the current `duration` value.

**Why a scaling function instead of just hardcoding new numbers:** the thread-interaction window is anchored to a specific real moment in the track (135–150s) and must never move, regardless of total duration. Given that anchor is fixed, the segments *before* it (opening → stage3, reference span 0–135s) always fill exactly that same 0–135s span no matter what `duration` is — there's nothing to scale there, the reference numbers already sum to exactly 135. The segments *after* it (stage4, final; reference span 150–195s, i.e. 45s) are where duration actually matters: if the real audio were unusually short, they need to shrink to leave room for `closing` before the track ends, rather than overflowing past `duration`.

```ts
// app/lib/stageTiming.ts
const THREAD_START = 135;
const THREAD_END = 150;
const REF_AFTER_END = 195; // reference end of the "final" stage
const CLOSING_BUFFER = 5; // seconds always left for the closing sequence before audio end

export function scaleStagesToDuration(stages: Stage[], duration: number): Stage[] {
  const refAfterSpan = REF_AFTER_END - THREAD_END; // 45
  const availableAfterSpan = duration - THREAD_END - CLOSING_BUFFER;
  const afterScale = Math.min(1, Math.max(0, availableAfterSpan) / refAfterSpan);

  return stages.map((stage) => {
    if (stage.windowStart < THREAD_START) return stage; // opening/stage1/stage2/stage3: unchanged, always fits exactly
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

For the real, current audio file (204.09s), `afterScale` evaluates to `1` (available span 49.09s exceeds the reference 45s), so this is a no-op in practice today — the function exists so the architecture is genuinely duration-driven, not because today's specific file needs adjusting.

**`closing` needs no explicit window.** Unlike the other stages, `ClosingSequence` was never audio-time-driven — it's already self-paced (cycles its own lines on an internal `setTimeout`, independent of `currentTime`), triggered once `phase` becomes `"closing"`. It doesn't appear in the `stages` array and doesn't need a `[195, duration]` entry computed anywhere; the `duration` figure in the addendum's reference table is descriptive (roughly when the audio actually ends relative to the rest of the schedule), not something the code needs to compute or act on directly.

`app/data/stages.ts` itself is rewritten with new reference absolute times (see below) — this is a one-time content update, not a runtime transform. `scaleStagesToDuration` is the runtime transform applied on top of that reference data.

### New reference stage windows and retimed lines

Existing line text is unchanged (verbatim, per the established no-paraphrase rule) for `opening`, `stage1`, `stage2`, `stage3`, `stage4` — only each line's `time` value and each stage's `windowStart`/`windowEnd` move, proportionally rescaled from the old reference windows to the new ones:

| Stage | Old window | New window |
|---|---|---|
| opening | [0, 22] | [0, 20] |
| stage1 | [22, 55] | [20, 52] |
| stage2 | [55, 90] | [52, 92] |
| stage3 | [115, 145] | [92, 135] |
| *(thread window)* | *(none — new)* | *[135, 150]* |
| stage4 | [145, 175] | [150, 178] |
| final | [175, 195] | [178, 195] *(content replaced, see below)* |

Each line's new time = `newWindowStart + (oldTime - oldWindowStart) * (newWindowDuration / oldWindowDuration)`, rounded to 1 decimal. The exact resulting values for every line are given as complete code in the implementation plan — not reproduced here to avoid two sources of truth.

The `final` stage's content is fully replaced per the addendum:

```ts
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
```

## Thread Interaction — `SoulThread` Extension

**`threadPaths` gains a `mergeProgress` parameter** (0 = today's separate-drifting state, 1 = fully merged/braided):

```ts
export function threadPaths(t: number, width: number, height: number, mergeProgress: number): { d1: string; d2: string };
```

At `mergeProgress = 0`, behavior is identical to today (phase offset π between the two lines, current amplitude/frequency). As `mergeProgress` rises to 1: path2's phase offset shrinks from π toward π/6 (never fully overlapping — the two threads stay visually distinct even fully "braided"), the oscillation frequency multiplies by up to 2.5×, and amplitude tightens by up to 30%. This combination reads as the wide, separate wave visually tightening into a braid — validated live in the visual companion.

**`SoulThread` gains three props:**

```ts
interface SoulThreadProps {
  stageIndex: number;
  totalStages: number;
  getAmplitude: () => number;
  currentTime: number;
  interactiveWindow: { start: number; end: number }; // { start: 135, end: 150 }
}
```

**Mechanic, computed each rAF tick while `currentTime` is within `interactiveWindow`:**
- `baselineProgress = clamp01((currentTime - windowStart) / (windowEnd - windowStart))` — reaches 1 naturally at `windowEnd` with zero pointer interaction.
- `pointerProgress = clamp01(cumulativeDistance / DISTANCE_FOR_FULL_MERGE)`, where `cumulativeDistance` is the sum of pointer movement (in pixels) since the window was entered, tracked via `pointermove` listeners added on entry and removed on exit, and `DISTANCE_FOR_FULL_MERGE = 12000` — calibrated so continuous, deliberate movement takes at least ~4 seconds to reach 1 (sustained fast movement is roughly 2500–3000px/s; 12000px requires ~4-5s of that), so it can never resolve in an anticlimactic instant flick.
- `mergeProgress = max(baselineProgress, pointerProgress)`, clamped to [0, 1].
- Once `currentTime > windowEnd`, `mergeProgress` locks at `1` for the rest of the show (the existing stage-based brightening, opacity 0.4→0.8 toward Final, continues to apply multiplicatively on top, unchanged from the current implementation).
- Outside the interactive window entirely (before it starts, or after it's locked), `mergeProgress` is `0` before the window and `1` after — no interpolation happens outside `[start, end]`.

No whisper line — the moment stays wordless, consistent with "you don't have to do anything."

## Final Stage — Passive Name Reveal

The typed-name-input flow is removed entirely:
- `app/components/NameEcho.tsx` is deleted.
- `app/data/stages.ts`'s `nameEchoOptions` export is deleted (no longer used).
- The `Phase` type in `page.tsx` shrinks from `"pre" | "experience" | "name" | "closing" | "final"` to `"pre" | "experience" | "closing" | "final"`.
- The existing dual-trigger pattern that used to move `experience → name` (reaching the final stage's last line, or the audio `ended` event — both already implemented and reviewed in the prior upgrade) is retargeted to move `experience → closing` directly. No new trigger logic — same conditions, same guard-against-double-fire behavior, different destination phase.
- "Fizza." plays as a normal `StageText` emphasis line within the final stage's own line sequence — no new component behavior, reuses the emphasis treatment (25% larger, italic, longer hold) already shipped.

## Out of Scope for This Pass

- No changes to `StageBackdrop`, cursor trail, typography, chrome, or color tokens from the prior atmosphere upgrade.
- Photo interlude code stays in the repo, unscheduled — not a deletion.
- No changes to deployment or privacy setup.

## Testing Scope

Same established philosophy: `scaleStagesToDuration` and the amplitude/pointer-progress math inside `SoulThread` that can be extracted as pure functions get Vitest unit tests (edge cases: duration shorter than the reference needs, duration exactly at reference, duration much longer). `threadPaths`' new `mergeProgress` parameter gets tests extending the existing `soulThreadPath.test.ts` suite (boundary behavior at 0 and 1, monotonic tightening in between). The interaction wiring itself (pointer listeners, rAF loop, phase transitions) is UI/browser-API glue verified via a manual Playwright pass, matching how the rest of this project has been verified.
