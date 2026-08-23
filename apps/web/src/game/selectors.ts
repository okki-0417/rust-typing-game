import { remaining, restSource, typedSource } from "@typing-game/core";
import { FULL_BREATH } from "./breath.ts";
import type { GameState } from "./gameReducer.ts";
import { ahead, metersRun, passed } from "./course.ts";
import type { Checkpoint } from "./course.ts";
import { recentPace, requiredPace } from "./pace.ts";

const CELEBRATION_MS = 2_500;

export function typedReading(state: GameState): string {
  return typedSource(state.phrase);
}

export function restReading(state: GameState): string {
  return restSource(state.phrase);
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

export function nextCheckpoint(state: GameState): Checkpoint | undefined {
  return ahead(distance(state));
}

export function justPassed(state: GameState): Checkpoint | undefined {
  return state.now - state.checkpointAt < CELEBRATION_MS ? passed(distance(state)) : undefined;
}
