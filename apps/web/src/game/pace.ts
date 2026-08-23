const OPENING_PACE = 60;
const PACE_GAIN_PER_MINUTE = 60;
const RECENT_WINDOW_MS = 5_000;

export function requiredPace(elapsedMs: number): number {
  return OPENING_PACE + PACE_GAIN_PER_MINUTE * (elapsedMs / 60_000);
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
