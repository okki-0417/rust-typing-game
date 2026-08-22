import { describe, expect, test } from "vite-plus/test";
import { interpret } from "../src/index.ts";

describe("ascii", () => {
  test("1文字が1塊になり、その文字自体が唯一の経路になる", () => {
    expect(interpret("ab", "ascii")).toEqual([
      { chars: "a", paths: ["a"] },
      { chars: "b", paths: ["b"] },
    ]);
  });

  test("数字・記号・空白も同じ扱いになる", () => {
    expect(interpret("1 !", "ascii").map((chunk) => chunk.paths[0])).toEqual(["1", " ", "!"]);
  });

  test("大文字と小文字を区別する", () => {
    expect(interpret("A", "ascii")[0]?.paths).toEqual(["A"]);
  });

  test("キーボードで打てない文字は受け付けない", () => {
    expect(() => interpret("🍣", "ascii")).toThrow(TypeError);
    expect(() => interpret("あ", "ascii")).toThrow(TypeError);
  });

  test("空の原文からは塊が生まれない", () => {
    expect(interpret("", "ascii")).toEqual([]);
  });
});
