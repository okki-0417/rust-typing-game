import { passed } from "./course.ts";

export function accuracy(hits: number, misses: number): number {
  const strokes = hits + misses;

  return strokes === 0 ? 1 : hits / strokes;
}

export function rankOf(meters: number): string {
  return passed(meters)?.name ?? "スタートラインで力尽きた";
}
