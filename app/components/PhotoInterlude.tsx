"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { PhotoInterludeData } from "../types";
import { getPhotoProgress, getPhotoPhase, getSpotlightIndex } from "../lib/audioState";

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
              transition={{ duration: 0.6, delay: phase === "burst-in" ? i * 0.1 : 0 }}
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
            transition={{ duration: 5, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90"
          >
            <img
              src={spotlightPhoto.src}
              alt={spotlightPhoto.caption || "memory"}
              className="max-h-[70vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
            />
            {spotlightPhoto.caption && (
              <p className="mt-4 font-display italic text-rose">{spotlightPhoto.caption}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
