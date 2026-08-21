import { describe, expect, test } from "vite-plus/test";
import { ascii } from "../src/index.ts";

describe("ascii", () => {
  test("1文字が1塊になり、その文字自体が唯一の打鍵列になる", () => {
    expect(ascii("ab")).toEqual([
      { source: "a", candidates: ["a"] },
      { source: "b", candidates: ["b"] },
    ]);
  });

  test("数字・記号・空白も同じ扱いになる", () => {
    expect(ascii("1 !").map((chunk) => chunk.candidates[0])).toEqual(["1", " ", "!"]);
  });

  test("大文字と小文字を区別する", () => {
    expect(ascii("A")[0]?.candidates).toEqual(["A"]);
  });

  test("サロゲートペアを分割しない", () => {
    expect(ascii("🍣")).toEqual([{ source: "🍣", candidates: ["🍣"] }]);
  });

  test("空の原文からは塊が生まれない", () => {
    expect(ascii("")).toEqual([]);
  });
});
