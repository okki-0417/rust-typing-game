import { describe, expect, test } from "vite-plus/test";
import { newPhrase, strike } from "../src/index.ts";

describe("newPhrase", () => {
  test("既定の入力方式は原文をそのまま打たせる", () => {
    const phrase = newPhrase("a1!");

    expect(phrase.remaining).toBe("a1!");
    expect(phrase.cursor).toBe(0);
    expect(phrase.isDone).toBe(false);
  });

  test("空の原文は最初から打ち切った状態になる", () => {
    const phrase = newPhrase("");

    expect(phrase.isDone).toBe(true);
    expect(phrase.remaining).toBe("");
    expect(phrase.cursor).toBe(0);
    expect(strike({ phrase, key: "a" })).toBeNull();
  });

  test("キーボードで打てない文字を含む原文は受け付けない", () => {
    expect(() => newPhrase("級", "romaji")).toThrow(TypeError);
    expect(() => newPhrase("🍣")).toThrow(TypeError);
  });
});
