import { describe, expect, test } from "vite-plus/test";
import { cursor, isDone, newPhrase, remaining, strike } from "../src/index.ts";

describe("newPhrase", () => {
  test("既定の入力方式は原文をそのまま打たせる", () => {
    const phrase = newPhrase("a1!");

    expect(remaining(phrase)).toBe("a1!");
    expect(cursor(phrase)).toBe(0);
    expect(isDone(phrase)).toBe(false);
  });

  test("空の原文は最初から打ち切った状態になる", () => {
    const phrase = newPhrase("");

    expect(isDone(phrase)).toBe(true);
    expect(remaining(phrase)).toBe("");
    expect(cursor(phrase)).toBe(0);
    expect(strike({ phrase, key: "a" })).toBeNull();
  });

  test("キーボードで打てない文字を含む原文は受け付けない", () => {
    expect(() => newPhrase("級", "romaji")).toThrow(TypeError);
    expect(() => newPhrase("🍣")).toThrow(TypeError);
  });
});
