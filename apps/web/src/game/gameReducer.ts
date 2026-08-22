import { isDone, newPhrase, strike } from "@typing-game/core";
import type { Phrase } from "@typing-game/core";
import type { Challenge } from "../data/challenges.ts";
import { createDeck, draw } from "./deck.ts";
import type { Deck } from "./deck.ts";

export const START_KEY = " ";

export type GameStatus = "ready" | "playing" | "finished";

export type GameState = {
  status: GameStatus;
  challenge: Challenge;
  phrase: Phrase;
  deck: Deck;
  hits: number;
  misses: number;
  cleared: number;
};

export type GameAction = { type: "keyPressed"; key: string } | { type: "timeUp" };

export function createGameState(challenges: readonly Challenge[]): GameState {
  return { status: "ready", ...deal(createDeck(challenges)), hits: 0, misses: 0, cleared: 0 };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "keyPressed":
      if (state.status !== "playing") {
        return action.key === START_KEY ? start(state) : state;
      }
      return typeKey(state, action.key);

    case "timeUp":
      return state.status === "playing" ? { ...state, status: "finished" } : state;
  }
}

function start(state: GameState): GameState {
  return { ...state, ...deal(state.deck), status: "playing", hits: 0, misses: 0, cleared: 0 };
}

function typeKey(state: GameState, key: string): GameState {
  const phrase = strike({ phrase: state.phrase, key });
  if (!phrase) return { ...state, misses: state.misses + 1 };

  const hit = { ...state, phrase, hits: state.hits + 1 };
  if (!isDone(phrase)) return hit;

  return { ...hit, ...deal(hit.deck), cleared: hit.cleared + 1 };
}

function deal(deck: Deck): Pick<GameState, "challenge" | "phrase" | "deck"> {
  const drawn = draw(deck);

  return {
    challenge: drawn.challenge,
    phrase: newPhrase(drawn.challenge.reading, "romaji"),
    deck: drawn.deck,
  };
}
