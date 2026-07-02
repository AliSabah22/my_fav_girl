"use client";
import { useCallback, useRef } from "react";
import { averageAmplitude, smoothAmplitude } from "./audioAmplitude";

export function useAudioAmplitude() {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const smoothedRef = useRef(0);
  const initializedRef = useRef(false);

  const initAmplitude = useCallback((audioEl: HTMLAudioElement) => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextCtor();
      const source = audioCtx.createMediaElementSource(audioEl);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      analyserRef.current = null;
    }
  }, []);

  const getAmplitude = useCallback((): number => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return 0;
    analyser.getByteFrequencyData(data);
    const next = averageAmplitude(data);
    smoothedRef.current = smoothAmplitude(smoothedRef.current, next, 0.3);
    return smoothedRef.current;
  }, []);

  return { initAmplitude, getAmplitude };
}
