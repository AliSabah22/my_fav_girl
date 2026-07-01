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
