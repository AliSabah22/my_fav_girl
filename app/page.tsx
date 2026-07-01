"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { stages, nameEchoOptions, closingSequence, finalScreen } from "./data/stages";
import { photoInterlude } from "./data/photos";
import { getActiveStage, isInPhotoInterlude, getNextStageWindowStart, getPhotoInterludeExitTarget } from "./lib/audioState";
import AudioPlayer from "./components/AudioPlayer";
import FloatingParticles from "./components/FloatingParticles";
import CursorTrail from "./components/CursorTrail";
import PreExperiencePrompt from "./components/PreExperiencePrompt";
import StageText from "./components/StageText";
import PhotoInterlude from "./components/PhotoInterlude";
import ProgressIndicator from "./components/ProgressIndicator";
import NameEcho from "./components/NameEcho";
import ClosingSequence from "./components/ClosingSequence";
import FinalScreen from "./components/FinalScreen";

type Phase = "pre" | "experience" | "name" | "closing" | "final";

const FINAL_STAGE_ID = "final";

export default function Page() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [phase, setPhase] = useState<Phase>("pre");
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function handleTimeUpdate() {
      setCurrentTime(audio!.currentTime);
    }
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  const activeStage = getActiveStage(stages, currentTime);
  const inPhotoInterlude = isInPhotoInterlude(photoInterlude, currentTime);
  const stageIndex = activeStage ? stages.findIndex((s) => s.id === activeStage.id) : 0;

  const finalStage = stages.find((s) => s.id === FINAL_STAGE_ID)!;
  const lastLineTime = finalStage.lines[finalStage.lines.length - 1].time;
  const reachedNamePrompt =
    phase === "experience" && activeStage?.id === FINAL_STAGE_ID && currentTime >= lastLineTime;

  useEffect(() => {
    if (reachedNamePrompt) {
      audioRef.current?.pause();
      setPhase("name");
    }
  }, [reachedNamePrompt]);

  function handleBegin() {
    setPhase("experience");
    audioRef.current?.play().catch(() => {});
  }

  function handleSkip() {
    const audio = audioRef.current;
    if (!audio) return;
    const next = inPhotoInterlude
      ? getPhotoInterludeExitTarget(photoInterlude, stages)
      : activeStage
      ? getNextStageWindowStart(stages, activeStage.id)
      : null;
    if (next !== null) {
      audio.currentTime = next;
    }
  }

  function handleRestart() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setCurrentTime(0);
    setPhase("pre");
  }

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-bg"
      onClick={phase === "experience" ? handleSkip : undefined}
    >
      <FloatingParticles stageIndex={stageIndex} totalStages={stages.length} />
      <CursorTrail stageIndex={stageIndex} totalStages={stages.length} />
      <AudioPlayer src="/audio/risk-it-all.mp3" audioRef={audioRef} />

      <div className="relative z-20 flex h-full w-full items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "pre" && (
            <motion.div key="pre" exit={{ opacity: 0 }}>
              <PreExperiencePrompt onBegin={handleBegin} />
            </motion.div>
          )}

          {phase === "experience" && inPhotoInterlude && (
            <motion.div
              key="photos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <PhotoInterlude interlude={photoInterlude} currentTime={currentTime} />
            </motion.div>
          )}

          {phase === "experience" && !inPhotoInterlude && activeStage && (
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.8 }}
            >
              <StageText stage={activeStage} currentTime={currentTime} />
            </motion.div>
          )}

          {phase === "name" && (
            <motion.div key="name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <NameEcho options={nameEchoOptions} onComplete={() => setPhase("closing")} />
            </motion.div>
          )}

          {phase === "closing" && (
            <motion.div
              key="closing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <ClosingSequence lines={closingSequence} onComplete={() => setPhase("final")} />
            </motion.div>
          )}

          {phase === "final" && (
            <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FinalScreen message={finalScreen.message} ctaLabel={finalScreen.ctaLabel} onRestart={handleRestart} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === "experience" && (
        <div className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2">
          <ProgressIndicator stages={stages} activeStageId={activeStage?.id ?? null} />
        </div>
      )}
    </main>
  );
}
