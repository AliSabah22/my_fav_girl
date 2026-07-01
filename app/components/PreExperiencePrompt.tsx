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
