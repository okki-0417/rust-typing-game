import { describe, expect, test } from "vite-plus/test";
import { exhale, FULL_BREATH, inhale, isGasping, isWinded, stumble } from "../src/game/breath.ts";

describe("inhale", () => {
  test("打鍵は息を戻す", () => {
    expect(inhale(5)).toBe(6);
  });

  test("肺活量を超えては溜め込めない", () => {
    expect(inhale(FULL_BREATH)).toBe(FULL_BREATH);
  });
});

describe("stumble", () => {
  test("ミスは打鍵より重い", () => {
    expect(FULL_BREATH - stumble(FULL_BREATH)).toBeGreaterThan(inhale(0));
  });

  test("息はマイナスにならない", () => {
    expect(stumble(1)).toBe(0);
  });
});

describe("exhale", () => {
  test("時間が進まなければ息は減らない", () => {
    expect(exhale(FULL_BREATH, 1000, 1000)).toBe(FULL_BREATH);
  });

  test("走った時間のぶんだけ息が減る", () => {
    expect(exhale(FULL_BREATH, 0, 1000)).toBeLessThan(FULL_BREATH);
  });

  test("後半ほど同じ時間で多く息を奪う", () => {
    const opening = FULL_BREATH - exhale(FULL_BREATH, 0, 1000);
    const later = FULL_BREATH - exhale(FULL_BREATH, 60_000, 61_000);

    expect(later).toBeGreaterThan(opening);
  });

  test("息はマイナスにならない", () => {
    expect(exhale(1, 0, 60_000)).toBe(0);
  });

  test("時計が巻き戻っても息は減らない", () => {
    expect(exhale(FULL_BREATH, 1000, 0)).toBe(FULL_BREATH);
  });
});

describe("isWinded", () => {
  test("息が尽きたら走れない", () => {
    expect(isWinded(0)).toBe(true);
  });

  test("わずかでも残っていれば走れる", () => {
    expect(isWinded(0.1)).toBe(false);
  });
});

describe("isGasping", () => {
  test("残りが細ると息が上がる", () => {
    expect(isGasping(FULL_BREATH * 0.2)).toBe(true);
  });

  test("余裕があるうちは息が上がらない", () => {
    expect(isGasping(FULL_BREATH * 0.5)).toBe(false);
  });
});
