export function accuracy(hits: number, misses: number): number {
  const strokes = hits + misses;

  return strokes === 0 ? 1 : hits / strokes;
}

export function kpm(hits: number, durationMs: number): number {
  const minutes = durationMs / 60_000;

  return minutes === 0 ? 0 : hits / minutes;
}
