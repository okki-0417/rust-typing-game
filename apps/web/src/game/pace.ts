const OPENING_PACE = 60;
const CHECKPOINT_MS = 100_000;
const CHECKPOINT_PACE = 400;
const RECENT_WINDOW_MS = 5_000;

export function requiredPace(elapsedMs: number): number {
  const climbed = elapsedMs / CHECKPOINT_MS;

  return OPENING_PACE + (CHECKPOINT_PACE - OPENING_PACE) * climbed * climbed;
}

export function recentPace(strokeTimes: readonly number[], now: number, elapsedMs: number): number {
  const windowMs = Math.min(RECENT_WINDOW_MS, elapsedMs);
  if (windowMs <= 0) return 0;

  const since = now - windowMs;

  return strokeTimes.filter((at) => at > since).length / (windowMs / 60_000);
}

export function paceOf(strokes: number, elapsedMs: number): number {
  return elapsedMs === 0 ? 0 : strokes / (elapsedMs / 60_000);
}
