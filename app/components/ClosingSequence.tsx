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
