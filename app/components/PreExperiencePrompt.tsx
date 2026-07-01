"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signatureEase } from "../lib/motion";

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
      <h1 className="font-display italic text-[clamp(2.5rem,6vw,4.5rem)] tracking-[-0.01em] text-cream">
        Before My Eyes Did
      </h1>
      <p className="max-w-[360px] text-sm text-muted">turn the sound on, and give this a few minutes</p>
      <button
        onClick={onBegin}
        style={{
          animation: "breathe 4s ease-in-out infinite",
          boxShadow: "0 0 24px rgba(255,111,145,0.4)",
        }}
        className="rounded-full bg-gold px-8 py-3 text-sm font-medium text-bg"
      >
        Begin
      </button>
      <AnimatePresence>
        {hintVisible && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: signatureEase }}
            className="text-xs text-muted"
          >
            turn your sound on
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
