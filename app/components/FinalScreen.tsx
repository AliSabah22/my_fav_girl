interface FinalScreenProps {
  message: string;
  ctaLabel: string;
  onRestart: () => void;
}

export default function FinalScreen({ message, ctaLabel, onRestart }: FinalScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="font-display text-2xl text-cream sm:text-3xl">{message}</p>
      <button
        onClick={onRestart}
        className="rounded-full border border-gold px-8 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-bg"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
