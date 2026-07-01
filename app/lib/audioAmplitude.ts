export function averageAmplitude(data: Uint8Array): number {
  if (data.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum / data.length / 255;
}

export function smoothAmplitude(previous: number, next: number, smoothing: number): number {
  return previous + (next - previous) * smoothing;
}
