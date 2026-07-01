interface ProgressIndicatorProps {
  progress: number; // 0-1
}

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <div
      role="progressbar"
      aria-label="Experience progress"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-[2px] w-48 overflow-hidden rounded-full bg-line"
    >
      <div
        style={{
          width: `${clamped * 100}%`,
          boxShadow: "0 0 8px rgba(255,111,145,0.6)",
        }}
        className="h-full bg-gold transition-[width] duration-300 ease-out"
      />
    </div>
  );
}
