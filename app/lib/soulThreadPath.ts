export function threadPaths(t: number, width: number, height: number): { d1: string; d2: string } {
  const midY = height / 2;
  const amplitude = height * 0.35;
  const startX = width * 0.1;
  const endX = width * 0.9;
  const segments = 8;

  function buildPath(phaseOffset: number): string {
    const points: string[] = [];
    for (let i = 0; i <= segments; i++) {
      const x = startX + ((endX - startX) * i) / segments;
      const y = midY + Math.sin(t * 0.6 + phaseOffset + i * 1.4) * amplitude * (0.5 + i / segments / 2);
      points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    const [first, ...rest] = points;
    return `M ${first} L ${rest.join(" L ")}`;
  }

  return {
    d1: buildPath(0),
    d2: buildPath(Math.PI),
  };
}
