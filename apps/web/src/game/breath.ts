import { requiredPace } from "./pace.ts";

export const FULL_BREATH = 30;

const BREATH_PER_STROKE = 1;
const GASPING_RATIO = 0.5;

export function inhale(breath: number): number {
  return Math.min(FULL_BREATH, breath + BREATH_PER_STROKE);
}

export function exhale(breath: number, fromMs: number, toMs: number): number {
  const minutes = Math.max(0, toMs - fromMs) / 60_000;
  const pace = (requiredPace(fromMs) + requiredPace(toMs)) / 2;

  return Math.max(0, breath - pace * minutes);
}

export function isWinded(breath: number): boolean {
  return breath <= 0;
}

export function isGasping(breath: number): boolean {
  return breath / FULL_BREATH < GASPING_RATIO;
}
