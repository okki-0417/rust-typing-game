import { describe, expect, test } from "vite-plus/test";
import { FULL_BREATH } from "../src/game/breath.ts";
import { createGameState, gameReducer, START_KEY } from "../src/game/gameReducer.ts";
import type { GameState } from "../src/game/gameReducer.ts";

const challenges = [{ text: "藍", reading: "あい" }];

function ready(): GameState {
  return createGameState(challenges);
}

function running(): GameState {
  return gameReducer(ready(), { type: "keyPressed", key: START_KEY, at: 0 });
}

function press(state: GameState, keys: string, at = 0): GameState {
  let pressed = state;
  for (const key of keys) {
    pressed = gameReducer(pressed, { type: "keyPressed", key, at });
  }

  return pressed;
}

describe("走り出す前", () => {
  test("スペースキーで走り出す", () => {
    expect(running().status).toBe("playing");
  });

  test("息は満タンから始まる", () => {
    expect(running().breath).toBe(FULL_BREATH);
  });

  test("ほかのキーでは走り出さない", () => {
    expect(press(ready(), "a").status).toBe("ready");
  });
});

describe("走っているあいだ", () => {
  test("正しい打鍵で距離が伸びる", () => {
    expect(press(running(), "a").strokeTimes).toEqual([0]);
  });

  test("打鍵した時刻を覚えている", () => {
    expect(press(running(), "a", 1200).strokeTimes).toEqual([1200]);
  });

  test("満タンの息は打鍵しても増えない", () => {
    expect(press(running(), "a").breath).toBe(FULL_BREATH);
  });

  test("ミスを数える", () => {
    expect(press(running(), "z").misses).toBe(1);
  });

  test("ミスでは距離が伸びない", () => {
    expect(press(running(), "z").strokeTimes).toEqual([]);
  });

  test("ミスを重ねても息は削られない", () => {
    const missed = press(running(), "zzzzz");

    expect(missed.breath).toBe(FULL_BREATH);
    expect(missed.status).toBe("playing");
  });

  test("減った息は打鍵で戻る", () => {
    const tired = gameReducer(running(), { type: "tick", at: 3000 });

    expect(press(tired, "a", 3000).breath).toBeGreaterThan(tired.breath);
  });

  test("打ち切ると次の文言に進む", () => {
    const cleared = press(running(), "ai");

    expect(cleared.cleared).toBe(1);
    expect(cleared.phrase.typed).toBe("");
  });

  test("次の文言がつねに控えている", () => {
    expect(running().upcoming).toHaveLength(2);
    expect(press(running(), "ai").upcoming).toHaveLength(2);
  });

  test("関門を跨ぐとその時刻を覚える", () => {
    const far = press(running(), "ai".repeat(10), 5000);

    expect(far.status).toBe("playing");
    expect(far.checkpointAt).toBe(5000);
  });

  test("関門を跨がないうちは時刻が動かない", () => {
    expect(press(running(), "ai", 5000).checkpointAt).toBe(0);
  });

  test("時間が経つと息が減る", () => {
    expect(gameReducer(running(), { type: "tick", at: 1000 }).breath).toBeLessThan(FULL_BREATH);
  });

  test("手を止めつづけると息が切れて終わる", () => {
    expect(gameReducer(running(), { type: "tick", at: 60_000 }).status).toBe("finished");
  });
});

describe("走り終えたあと", () => {
  function finished(): GameState {
    return gameReducer(running(), { type: "tick", at: 60_000 });
  }

  test("打鍵しても距離は伸びない", () => {
    expect(press(finished(), "a").strokeTimes).toEqual([]);
  });

  test("時間が経っても状態は動かない", () => {
    const stopped = finished();

    expect(gameReducer(stopped, { type: "tick", at: 120_000 })).toBe(stopped);
  });

  test("スペースキーでもう一度走り出す", () => {
    const again = gameReducer(finished(), { type: "keyPressed", key: START_KEY, at: 90_000 });

    expect(again.status).toBe("playing");
    expect(again.breath).toBe(FULL_BREATH);
    expect(again.startedAt).toBe(90_000);
  });
});
