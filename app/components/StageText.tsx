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
    <div className="flex max-h-[70vh] max-w-2xl flex-col items-center justify-center gap-4 overflow-y-auto px-6 text-center">
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
