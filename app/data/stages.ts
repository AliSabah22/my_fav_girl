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
