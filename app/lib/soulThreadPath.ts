export function threadPaths(
  t: number,
  width: number,
  height: number,
  mergeProgress: number
): { d1: string; d2: string } {
  const midY = height / 2;
  const baseAmplitude = height * 0.18;
  const startX = width * 0.1;
  const endX = width * 0.9;
  const segments = 48;
  const clampedMerge = Math.min(1, Math.max(0, mergeProgress));
  const freqMultiplier = 1 + clampedMerge * 1.5;
  const amplitude = baseAmplitude * (1 - clampedMerge * 0.3);

  function buildPath(phaseOffset: number): string {
    const points: string[] = [];
    for (let i = 0; i <= segments; i++) {
      const x = startX + ((endX - startX) * i) / segments;
      const y =
        midY +
        Math.sin(t * 0.6 * freqMultiplier + phaseOffset + ((i * (1.4 * 8)) / segments) * freqMultiplier) *
          amplitude *
          (0.5 + i / segments / 2);
      points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    const [first, ...rest] = points;
    return `M ${first} L ${rest.join(" L ")}`;
  }

  const phase2 = Math.PI + (Math.PI / 6 - Math.PI) * clampedMerge; // π → π/6 as merge rises, never fully overlapping

  return {
    d1: buildPath(0),
    d2: buildPath(phase2),
  };
}
