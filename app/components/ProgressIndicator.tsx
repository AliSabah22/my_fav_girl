interface ProgressIndicatorProps {
  stages: { id: string }[];
  activeStageId: string | null;
}

export default function ProgressIndicator({ stages, activeStageId }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-label="Experience progress">
      {stages.map((stage) => (
        <span
          key={stage.id}
          className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
            stage.id === activeStageId ? "bg-gold" : "bg-line"
          }`}
        />
      ))}
    </div>
  );
}
