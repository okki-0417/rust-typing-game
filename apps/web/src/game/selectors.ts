import { cursor, remaining } from "@typing-game/core";
import type { GameState } from "./gameReducer.ts";

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
