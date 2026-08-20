import { describe, expect, test } from "vite-plus/test";
import { plain } from "../src/index.ts";

describe("plain", () => {
  test("1文字が1単位になり、その文字自体が唯一の打鍵列になる", () => {
    expect(plain("ab")).toEqual([
      { source: "a", candidates: ["a"] },
      { source: "b", candidates: ["b"] },
    ]);
  });

  test("数字・記号・空白も同じ扱いになる", () => {
    expect(plain("1 !").map((unit) => unit.candidates[0])).toEqual(["1", " ", "!"]);
  });

  test("大文字と小文字を区別する", () => {
    expect(plain("A")[0]?.candidates).toEqual(["A"]);
  });

  test("サロゲートペアを1単位として扱う", () => {
    expect(plain("🍣")).toEqual([{ source: "🍣", candidates: ["🍣"] }]);
  });

  test("空の原文からは単位が生まれない", () => {
    expect(plain("")).toEqual([]);
  });
});
