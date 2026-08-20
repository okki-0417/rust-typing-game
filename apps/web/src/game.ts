import { createSession, romaji } from "@typing-game/core";
import type { InputResult } from "@typing-game/core";
import type { Challenge } from "./challenges.ts";
import { createDeck } from "./deck.ts";

export type Phase = "ready" | "playing" | "finished";

export interface Score {
  /** 受理された打鍵の数。 */
  readonly hits: number;
  /** 受理されなかった打鍵の数。 */
  readonly misses: number;
  /** 打ち切った文言の数。 */
  readonly cleared: number;
  /** 打鍵のうち受理された割合。 */
  readonly accuracy: number;
  /** 1分あたりの打鍵数。 */
  readonly kpm: number;
}

export interface Snapshot {
  readonly phase: Phase;
  readonly challenge: Challenge;
  /** 打ち終わった読み。 */
  readonly read: string;
  /** これから打つ読み。 */
  readonly unread: string;
  /** 打ち終わった打鍵列。 */
  readonly typed: string;
  /** これから打つ打鍵列。 */
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
  /** 制限時間の計測を始める。 */
  start(now: number): void;
  /** 1文字を入力する。遊んでいる間以外は受け付けない。 */
  input(key: string, now: number): InputResult | null;
  /** 時間切れになっていれば終了させる。 */
  tick(now: number): void;
  snapshot(now: number): Snapshot;
  /** 最初の状態に戻す。 */
  reset(): void;
}

export function createGame({ challenges, durationMs }: GameOptions): Game {
  const deal = createDeck(challenges);

  let phase: Phase = "ready";
  let startedAt = 0;
  let challenge = deal();
  let session = createSession(challenge.reading, { scheme: romaji });
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
    session = createSession(challenge.reading, { scheme: romaji });
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

      const result = session.input(key);
      if (result === "miss") {
        misses++;
        return result;
      }

      hits++;
      if (result === "complete") {
        cleared++;
        next();
      }
      return result;
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
        read: session.source.slice(0, session.cursor),
        unread: session.source.slice(session.cursor),
        typed: session.typed,
        remaining: session.remaining,
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
