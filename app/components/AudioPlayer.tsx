"use client";
import { useEffect, useState } from "react";

interface AudioPlayerProps {
  src: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  onEnded?: () => void;
}

export default function AudioPlayer({ src, audioRef, onEnded }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <button onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"} className="text-sm text-cream">
            {isPlaying ? "Pause" : "Play"}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
            className="w-16 accent-gold"
          />
        </>
      )}
    </div>
  );
}
