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
