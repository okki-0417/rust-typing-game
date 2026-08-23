import { isDone, newPhrase, strike } from "@typing-game/core";
import type { Phrase } from "@typing-game/core";
import type { Challenge } from "../data/challenges.ts";
import { exhale, FULL_BREATH, inhale, isWinded } from "./breath.ts";
import { createDeck, draw } from "./deck.ts";
import type { Deck } from "./deck.ts";

export const START_KEY = " ";

const UPCOMING_COUNT = 2;

export type GameStatus = "ready" | "playing" | "finished";

export type GameState = {
  status: GameStatus;
  challenge: Challenge;
  phrase: Phrase;
  upcoming: readonly Challenge[];
  deck: Deck;
  strokeTimes: readonly number[];
  misses: number;
  cleared: number;
  breath: number;
  startedAt: number;
  now: number;
};

export type GameAction =
  | { type: "keyPressed"; key: string; at: number }
  | { type: "tick"; at: number };

export function createGameState(challenges: readonly Challenge[]): GameState {
  return { status: "ready", ...deal(createDeck(challenges), []), ...atStartLine(0) };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "keyPressed": {
      if (state.status !== "playing") {
        return action.key === START_KEY ? start(state, action.at) : state;
      }

      const running = breathe(state, action.at);
      return running.status === "playing" ? typeKey(running, action.key, action.at) : running;
    }

    case "tick":
      return state.status === "playing" ? breathe(state, action.at) : state;
  }
}

function start(state: GameState, at: number): GameState {
  return {
    ...state,
    ...deal(state.deck, state.upcoming),
    ...atStartLine(at),
    status: "playing",
  };
}

function breathe(state: GameState, at: number): GameState {
  const breath = exhale(state.breath, state.now - state.startedAt, at - state.startedAt);

  return checkBreath({ ...state, breath, now: at });
}

function typeKey(state: GameState, key: string, at: number): GameState {
  const phrase = strike({ phrase: state.phrase, key });
  if (!phrase) return { ...state, misses: state.misses + 1 };

  const hit = {
    ...state,
    phrase,
    strokeTimes: [...state.strokeTimes, at],
    breath: inhale(state.breath),
  };
  if (!isDone(phrase)) return hit;

  return { ...hit, ...deal(hit.deck, hit.upcoming), cleared: hit.cleared + 1 };
}

function checkBreath(state: GameState): GameState {
  return isWinded(state.breath) ? { ...state, status: "finished" } : state;
}

function atStartLine(
  at: number,
): Pick<GameState, "strokeTimes" | "misses" | "cleared" | "breath" | "startedAt" | "now"> {
  return { strokeTimes: [], misses: 0, cleared: 0, breath: FULL_BREATH, startedAt: at, now: at };
}

function deal(
  deck: Deck,
  upcoming: readonly Challenge[],
): Pick<GameState, "challenge" | "phrase" | "upcoming" | "deck"> {
  const queue = [...upcoming];
  let rest = deck;

  while (queue.length <= UPCOMING_COUNT) {
    const drawn = draw(rest);
    queue.push(drawn.challenge);
    rest = drawn.deck;
  }

  const challenge = queue.shift()!;

  return {
    challenge,
    phrase: newPhrase(challenge.reading, "romaji"),
    upcoming: queue,
    deck: rest,
  };
}
