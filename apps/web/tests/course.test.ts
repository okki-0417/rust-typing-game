import { describe, expect, test } from "vite-plus/test";
import { ahead, crossed, metersRun, passed } from "../src/game/course.ts";

describe("metersRun", () => {
  test("打鍵がそのまま距離になる", () => {
    expect(metersRun(0)).toBe(0);
    expect(metersRun(2)).toBeGreaterThan(metersRun(1));
  });
});

describe("passed", () => {
  test("走り出しはまだどの関門も抜けていない", () => {
    expect(passed(0)).toBeUndefined();
  });

  test("抜けたなかで一番遠い関門を返す", () => {
    expect(passed(12_000)?.name).toBe("ジョギング");
  });

  test("関門のちょうど上は抜けたものとして扱う", () => {
    expect(passed(1_000)?.name).toBe("準備運動");
  });
});

describe("ahead", () => {
  test("走り出しの目標は最初の関門", () => {
    expect(ahead(0)?.name).toBe("準備運動");
  });

  test("抜けた関門は目標にならない", () => {
    expect(ahead(1_000)?.name).toBe("散歩");
  });

  test("すべて抜けきると目標がなくなる", () => {
    expect(ahead(1_000_000)).toBeUndefined();
  });
});

describe("crossed", () => {
  test("跨いだ関門を返す", () => {
    expect(crossed(990, 1_045)?.name).toBe("準備運動");
  });

  test("跨いでいなければ何も返さない", () => {
    expect(crossed(1_000, 1_055)).toBeUndefined();
  });

  test("止まっているあいだは跨がない", () => {
    expect(crossed(1_000, 1_000)).toBeUndefined();
  });
});
