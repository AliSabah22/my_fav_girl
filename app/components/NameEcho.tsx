"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface NameEchoProps {
  options: string[];
  onComplete: () => void;
  holdMs?: number;
}

export default function NameEcho({ options, onComplete, holdMs = 4000 }: NameEchoProps) {
  const [submitted, setSubmitted] = useState(false);
  const [value, setValue] = useState("");
  const [echo] = useState(() => options[Math.floor(Math.random() * options.length)]);

  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(onComplete, holdMs);
    return () => clearTimeout(timer);
  }, [submitted, onComplete, holdMs]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim().length === 0) return;
    setSubmitted(true);
  }

  return (
    <div className="flex flex-col items-center gap-6 px-6 text-center">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <input
              aria-label="Type your name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="border-b border-gold bg-transparent px-2 py-1 text-center font-display text-2xl text-cream outline-none"
              autoFocus
            />
            <button type="submit" className="rounded-full bg-gold px-6 py-2 text-sm font-medium text-bg">
              Enter
            </button>
          </motion.form>
        ) : (
          <motion.p
            key="echo"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="whitespace-pre-line font-display text-2xl italic text-rose sm:text-3xl"
          >
            {echo}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
