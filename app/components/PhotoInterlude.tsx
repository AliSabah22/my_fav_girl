"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { PhotoInterludeData } from "../types";
import { getPhotoProgress, getPhotoPhase, getSpotlightIndex } from "../lib/audioState";
import { signatureEase } from "../lib/motion";

interface PhotoInterludeProps {
  interlude: PhotoInterludeData;
  currentTime: number;
}

export default function PhotoInterlude({ interlude, currentTime }: PhotoInterludeProps) {
  const progress = getPhotoProgress(interlude, currentTime);
  const phase = getPhotoPhase(progress);
  const spotlightIndex = getSpotlightIndex(progress, interlude.photos.length);
  const spotlightPhoto = interlude.photos[spotlightIndex];

  return (
    <div className="relative h-full w-full" data-phase={phase}>
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 sm:gap-3 sm:p-8 md:grid-cols-4">
        {interlude.photos.map((photo, i) => {
          const rotation = (i % 2 === 0 ? -1 : 1) * (4 + (i % 3) * 2);
          const isSpotlit = phase === "spotlight" && i === spotlightIndex;
          return (
            <motion.div
              key={photo.src}
              initial={{ opacity: 0, scale: 0.8, rotate: rotation }}
              animate={{
                opacity: phase === "burst-in" || phase === "settle" || isSpotlit ? 1 : 0.4,
                scale: 1,
                rotate: rotation,
              }}
              transition={{ duration: 0.6, delay: phase === "burst-in" ? i * 0.1 : 0, ease: signatureEase }}
              style={{
                border: "6px solid rgba(243,234,217,0.4)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}
              className="relative aspect-[4/5] overflow-hidden rounded-md bg-panel"
            >
              {photo.src ? (
                <img src={photo.src} alt={photo.caption || "memory"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted">photo pending</div>
              )}
            </motion.div>
          );
        })}
      </div>
      <AnimatePresence>
        {phase === "spotlight" && spotlightPhoto && (
          <motion.div
            key={spotlightPhoto.src}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 5, ease: signatureEase }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90"
          >
            <img
              src={spotlightPhoto.src}
              alt={spotlightPhoto.caption || "memory"}
              style={{ boxShadow: "0 0 60px rgba(255,111,145,0.15), 0 25px 50px -12px rgba(0,0,0,0.5)" }}
              className="max-h-[70vh] max-w-[85vw] rounded-lg object-contain"
            />
            {spotlightPhoto.caption && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6, ease: signatureEase }}
                className="mt-4 font-display italic text-rose"
              >
                {spotlightPhoto.caption}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
