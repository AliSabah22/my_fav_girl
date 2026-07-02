"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { stages as rawStages, closingSequence, finalScreen } from "./data/stages";
import { getActiveStage, getStageIndexForTime } from "./lib/audioState";
import { scaleStagesToDuration, THREAD_WINDOW } from "./lib/stageTiming";
import { useAudioAmplitude } from "./lib/useAudioAmplitude";
import { signatureEase } from "./lib/motion";
import AudioPlayer from "./components/AudioPlayer";
import FloatingParticles from "./components/FloatingParticles";
import CursorTrail from "./components/CursorTrail";
import StageBackdrop from "./components/StageBackdrop";
import SoulThread from "./components/SoulThread";
import PreExperiencePrompt from "./components/PreExperiencePrompt";
import StageText from "./components/StageText";
import ProgressIndicator from "./components/ProgressIndicator";
import ClosingSequence from "./components/ClosingSequence";
import FinalScreen from "./components/FinalScreen";

type Phase = "pre" | "experience" | "closing" | "final";

const FINAL_STAGE_ID = "final";
const REFERENCE_DURATION = 204;

export default function Page() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [phase, setPhase] = useState<Phase>("pre");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(REFERENCE_DURATION);
  const { initAmplitude, getAmplitude } = useAudioAmplitude();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function handleTimeUpdate() {
      setCurrentTime(audio!.currentTime);
    }
    function handleLoadedMetadata() {
      if (audio!.duration && isFinite(audio!.duration)) {
        setDuration(audio!.duration);
      }
    }
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    if (audio.readyState >= 1) handleLoadedMetadata();
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  const stages = scaleStagesToDuration(rawStages, duration);
  const activeStage = getActiveStage(stages, currentTime);
  const stageIndex = getStageIndexForTime(stages, currentTime);

  const finalStage = stages.find((s) => s.id === FINAL_STAGE_ID)!;
  const lastLineTime = finalStage.lines[finalStage.lines.length - 1].time;
  const reachedClosing =
    phase === "experience" && activeStage?.id === FINAL_STAGE_ID && currentTime >= lastLineTime;

  useEffect(() => {
    if (reachedClosing) {
      audioRef.current?.pause();
      setPhase("closing");
    }
  }, [reachedClosing]);

  function handleBegin() {
    setPhase("experience");
    const audio = audioRef.current;
    if (audio) {
      initAmplitude(audio);
      audio.play().catch(() => {});
    }
  }

  function handleAudioEnded() {
    if (phase !== "experience") return;
    audioRef.current?.pause();
    setPhase("closing");
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
    <main className="relative h-screen w-screen overflow-hidden bg-bg">
      <StageBackdrop getAmplitude={getAmplitude} />
      <FloatingParticles stageIndex={stageIndex} totalStages={stages.length} getAmplitude={getAmplitude} />
      <SoulThread
        stageIndex={stageIndex}
        totalStages={stages.length}
        getAmplitude={getAmplitude}
        currentTime={currentTime}
        interactiveWindow={THREAD_WINDOW}
      />
      <CursorTrail getAmplitude={getAmplitude} />
      <AudioPlayer src="/audio/risk-it-all.mp3" audioRef={audioRef} onEnded={handleAudioEnded} />

      <div className="relative z-20 flex h-full w-full items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "pre" && (
            <motion.div key="pre" exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: signatureEase }}>
              <PreExperiencePrompt onBegin={handleBegin} />
            </motion.div>
          )}

          {phase === "experience" && activeStage && (
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.8, ease: signatureEase }}
            >
              <StageText stage={activeStage} currentTime={currentTime} />
            </motion.div>
          )}

          {phase === "closing" && (
            <motion.div
              key="closing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: signatureEase }}
              className="h-full w-full"
            >
              <ClosingSequence lines={closingSequence} onComplete={() => setPhase("final")} />
            </motion.div>
          )}

          {phase === "final" && (
            <motion.div
              key="final"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: signatureEase }}
            >
              <FinalScreen message={finalScreen.message} ctaLabel={finalScreen.ctaLabel} onRestart={handleRestart} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === "experience" && (
        <div className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2">
          <ProgressIndicator progress={currentTime / stages[stages.length - 1].windowEnd} />
        </div>
      )}
    </main>
  );
}
