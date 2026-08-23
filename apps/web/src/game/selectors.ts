import { cursor, remaining } from "@typing-game/core";
import { FULL_BREATH } from "./breath.ts";
import type { GameState } from "./gameReducer.ts";
import { recentPace, requiredPace } from "./pace.ts";
import { metersRun } from "./score.ts";

export function typedReading(state: GameState): string {
  return state.phrase.source.slice(0, cursor(state.phrase));
}

export function restReading(state: GameState): string {
  return state.phrase.source.slice(cursor(state.phrase));
}

export function typedKeys(state: GameState): string {
  return state.phrase.typed;
}

export function restKeys(state: GameState): string {
  return remaining(state.phrase);
}

export function elapsedMs(state: GameState): number {
  return state.now - state.startedAt;
}

export function strokes(state: GameState): number {
  return state.strokeTimes.length;
}

export function distance(state: GameState): number {
  return metersRun(strokes(state));
}

export function breathRatio(state: GameState): number {
  return state.breath / FULL_BREATH;
}

export function currentPace(state: GameState): number {
  return recentPace(state.strokeTimes, state.now, elapsedMs(state));
}

export function targetPace(state: GameState): number {
  return requiredPace(elapsedMs(state));
}
