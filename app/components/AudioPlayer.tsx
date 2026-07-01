"use client";
import { useEffect, useState } from "react";

interface AudioPlayerProps {
  src: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  onEnded?: () => void;
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M3 1.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="2" y="1.5" width="3.5" height="11" />
      <rect x="8.5" y="1.5" width="3.5" height="11" />
    </svg>
  );
}

export default function AudioPlayer({ src, audioRef, onEnded }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => setLoadError(true));
    } else {
      audio.pause();
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    setVolume(next);
    if (audioRef.current) audioRef.current.volume = next;
  }

  return (
    <div
      className="fixed right-2 top-2 z-30 flex items-center gap-2 rounded-full bg-panel/80 px-3 py-1.5 backdrop-blur sm:right-4 sm:top-4 sm:gap-3 sm:px-4 sm:py-2"
      onClick={(e) => e.stopPropagation()}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onError={() => setLoadError(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
      />
      {loadError ? (
        <span className="text-xs text-muted">Add risk-it-all.mp3 to public/audio</span>
      ) : (
        <>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-6 w-6 items-center justify-center text-cream"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
            className="h-1 w-16 appearance-none rounded-full bg-line [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-gold [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
          />
        </>
      )}
    </div>
  );
}
