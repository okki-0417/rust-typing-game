const METERS_PER_STROKE = 30;

const HALF_MARATHON = 21_097;
const FULL_MARATHON = 42_195;

export function metersRun(strokes: number): number {
  return strokes * METERS_PER_STROKE;
}

export function accuracy(hits: number, misses: number): number {
  const strokes = hits + misses;

  return strokes === 0 ? 1 : hits / strokes;
}

export function rankOf(meters: number): string {
  if (meters === 0) return "スタートラインで力尽きた";
  if (meters < 1_000) return "準備運動";
  if (meters < 5_000) return "散歩";
  if (meters < 10_000) return "ジョギング";
  if (meters < HALF_MARATHON) return "市民ランナー";
  if (meters < FULL_MARATHON) return "ハーフ走破";
  return "フルマラソン完走";
}
