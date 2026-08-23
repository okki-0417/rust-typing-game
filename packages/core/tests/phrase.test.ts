import { describe, expect, test } from "vite-plus/test";
import {
  cursor,
  isDone,
  newPhrase,
  remaining,
  restSource,
  strike,
  typedSource,
} from "../src/index.ts";

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

describe("原文の進み", () => {
  test("打ち始める前は、すべてが打つ前の側にある", () => {
    const phrase = newPhrase("あいう", "romaji");

    expect(typedSource(phrase)).toBe("");
    expect(restSource(phrase)).toBe("あいう");
  });

  test("塊を打ち切った時点で、その塊のぶんだけ打った側へ移る", () => {
    const phrase = strike({ phrase: newPhrase("しゃけ", "romaji"), key: "s" })!;

    expect(typedSource(phrase)).toBe("");
    expect(restSource(phrase)).toBe("しゃけ");

    const sha = strike({ phrase: strike({ phrase, key: "h" })!, key: "a" })!;

    expect(typedSource(sha)).toBe("しゃ");
    expect(restSource(sha)).toBe("け");
  });

  test("打ち切ると、残りは空になる", () => {
    let phrase = newPhrase("ab");
    for (const key of ["a", "b"]) phrase = strike({ phrase, key })!;

    expect(typedSource(phrase)).toBe("ab");
    expect(restSource(phrase)).toBe("");
  });
});
