import { newPhrase, romaji, strike } from "@typing-game/core";
import type { Challenge } from "./challenges.ts";
import { createDeck } from "./deck.ts";

export type Phase = "ready" | "playing" | "finished";

export interface Score {
  readonly hits: number;
  readonly misses: number;
  readonly cleared: number;
  readonly accuracy: number;
  readonly kpm: number;
}

export interface Snapshot {
  readonly phase: Phase;
  readonly challenge: Challenge;
  readonly typedReading: string;
  readonly remainingReading: string;
  readonly typed: string;
  readonly remaining: string;
  readonly score: Score;
  readonly leftMs: number;
  readonly leftRatio: number;
}

export interface GameOptions {
  readonly challenges: readonly Challenge[];
  readonly durationMs: number;
}

export interface Game {
  readonly phase: Phase;
  start(now: number): void;
  input(key: string, now: number): boolean | null;
  tick(now: number): void;
  snapshot(now: number): Snapshot;
  reset(): void;
}

export function createGame({ challenges, durationMs }: GameOptions): Game {
  const deal = createDeck(challenges);

  let phase: Phase = "ready";
  let startedAt = 0;
  let challenge = deal();
  let phrase = newPhrase(challenge.reading, romaji);
  let hits = 0;
  let misses = 0;
  let cleared = 0;

  const elapsedMs = (now: number) => {
    if (phase === "ready") return 0;
    if (phase === "finished") return durationMs;
    return Math.min(durationMs, now - startedAt);
  };

  const next = () => {
    challenge = deal();
    phrase = newPhrase(challenge.reading, romaji);
  };

  const game: Game = {
    get phase() {
      return phase;
    },

    start(now) {
      if (phase === "playing") return;
      phase = "playing";
      startedAt = now;
      hits = 0;
      misses = 0;
      cleared = 0;
      next();
    },

    input(key, now) {
      game.tick(now);
      if (phase !== "playing") return null;

      const struck = strike(phrase, key);
      phrase = struck.phrase;
      if (!struck.isCorrect) {
        misses++;
        return false;
      }

      hits++;
      if (phrase.isDone) {
        cleared++;
        next();
      }
      return true;
    },

    tick(now) {
      if (phase === "playing" && now - startedAt >= durationMs) phase = "finished";
    },

    snapshot(now) {
      const elapsed = elapsedMs(now);
      const strokes = hits + misses;
      const minutes = elapsed / 60_000;

      return {
        phase,
        challenge,
        typedReading: phrase.source.slice(0, phrase.cursor),
        remainingReading: phrase.source.slice(phrase.cursor),
        typed: phrase.typed,
        remaining: phrase.remaining,
        score: {
          hits,
          misses,
          cleared,
          accuracy: strokes === 0 ? 1 : hits / strokes,
          kpm: minutes === 0 ? 0 : hits / minutes,
        },
        leftMs: durationMs - elapsed,
        leftRatio: 1 - elapsed / durationMs,
      };
    },

    reset() {
      phase = "ready";
      startedAt = 0;
      hits = 0;
      misses = 0;
      cleared = 0;
      next();
    },
  };

  return game;
}
