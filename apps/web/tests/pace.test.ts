import { describe, expect, test } from "vite-plus/test";
import { paceOf, recentPace, requiredPace } from "../src/game/pace.ts";

describe("requiredPace", () => {
  test("走り出しはもっとも緩い", () => {
    expect(requiredPace(0)).toBe(60);
  });

  test("時間が経つほど速く打つことを求める", () => {
    expect(requiredPace(60_000)).toBe(120);
    expect(requiredPace(120_000)).toBe(180);
  });

  test("分の途中でも連続して上がる", () => {
    expect(requiredPace(30_000)).toBe(90);
  });
});

describe("recentPace", () => {
  test("走り出す前は測れない", () => {
    expect(recentPace([], 0, 0)).toBe(0);
  });

  test("直近の窓が埋まるまでは経過した時間で割る", () => {
    expect(recentPace([200, 400, 600, 800, 1000], 1000, 1000)).toBe(300);
  });

  test("直近の窓から出た打鍵は数えない", () => {
    expect(recentPace([1000, 2000, 6000, 7000], 10_000, 10_000)).toBe(24);
  });

  test("手が止まっていれば 0 になる", () => {
    expect(recentPace([1000, 2000], 10_000, 10_000)).toBe(0);
  });
});

describe("paceOf", () => {
  test("走った時間ぜんたいでならす", () => {
    expect(paceOf(120, 60_000)).toBe(120);
  });

  test("時間が経っていなければ測れない", () => {
    expect(paceOf(0, 0)).toBe(0);
  });
});
