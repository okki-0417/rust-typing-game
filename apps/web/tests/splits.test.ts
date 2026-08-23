import { describe, expect, test } from "vite-plus/test";
import { createGameState, gameReducer, START_KEY } from "../src/game/gameReducer.ts";
import type { GameState } from "../src/game/gameReducer.ts";
import { splits } from "../src/game/splits.ts";

const challenges = [{ text: "藍", reading: "あい" }];

function ran(strokes: number, overMs: number): GameState {
  const start = gameReducer(createGameState(challenges), {
    type: "keyPressed",
    key: START_KEY,
    at: 0,
  });

  let state = start;
  for (let i = 0; i < strokes; i++) {
    const at = Math.round(((i + 1) / strokes) * overMs);
    state = gameReducer(state, { type: "keyPressed", key: i % 2 === 0 ? "a" : "i", at });
  }

  return gameReducer(state, { type: "tick", at: overMs });
}

describe("splits", () => {
  test("走り出す前は軌跡がない", () => {
    expect(splits(createGameState(challenges))).toEqual([]);
  });

  test("原点から始まる", () => {
    expect(splits(ran(60, 10_000))[0]).toEqual({ ms: 0, meters: 0, behind: false });
  });

  test("最後の点が走り切った時間と距離になる", () => {
    const goal = splits(ran(60, 10_000)).at(-1)!;

    expect(goal.ms).toBe(10_000);
    expect(goal.meters).toBe(60 * 55);
  });

  test("距離は後戻りしない", () => {
    let previous = -1;
    for (const split of splits(ran(200, 40_000))) {
      expect(split.meters).toBeGreaterThanOrEqual(previous);
      previous = split.meters;
    }
  });

  test("時間は後戻りしない", () => {
    let previous = -1;
    for (const split of splits(ran(200, 40_000))) {
      expect(split.ms).toBeGreaterThan(previous);
      previous = split.ms;
    }
  });

  test("速く走った区間は要求を下回らない", () => {
    const fast = splits(ran(300, 20_000)).slice(1);

    expect(fast.every((split) => !split.behind)).toBe(true);
  });

  test("手を止めた区間は要求を下回ったと見なす", () => {
    const stalled = splits(ran(4, 20_000)).slice(1);

    expect(stalled.some((split) => split.behind)).toBe(true);
  });

  test("長く走っても点が増えつづけはしない", () => {
    expect(splits(ran(600, 300_000)).length).toBeLessThanOrEqual(61);
  });
});
