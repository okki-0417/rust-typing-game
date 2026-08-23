import { isDone, newPhrase } from "@typing-game/core";
import { describe, expect, test } from "vite-plus/test";
import { challenges, parseChallenges } from "../src/data/challenges.ts";

describe("入稿された文言", () => {
  test("在庫が空ではない", () => {
    expect(challenges.length).toBeGreaterThan(0);
  });

  test("すべての読みがローマ字で打てる", () => {
    for (const challenge of challenges) {
      expect(() => newPhrase(challenge.reading, "romaji"), challenge.text).not.toThrow();
    }
  });

  test("最初から打ち切った状態の文言はない", () => {
    for (const challenge of challenges) {
      expect(isDone(newPhrase(challenge.reading, "romaji")), challenge.text).toBe(false);
    }
  });

  test("同じ文言が重複していない", () => {
    const texts = challenges.map((challenge) => challenge.text);

    expect(new Set(texts).size).toBe(texts.length);
  });
});

describe("parseChallenges", () => {
  test("タブ区切りの行を文言と読みに分ける", () => {
    expect(parseChallenges("寿司\tすし\n刺身\tさしみ")).toEqual([
      { text: "寿司", reading: "すし" },
      { text: "刺身", reading: "さしみ" },
    ]);
  });

  test("空行と # で始まる行は読み飛ばす", () => {
    expect(parseChallenges("# 見出し\n\n寿司\tすし\n\n")).toEqual([
      { text: "寿司", reading: "すし" },
    ]);
  });

  test("前後の空白は落とす", () => {
    expect(parseChallenges(" 寿司 \t すし \r")).toEqual([{ text: "寿司", reading: "すし" }]);
  });

  test("列が足りない行と余る行は受け付けない", () => {
    expect(() => parseChallenges("寿司")).toThrow(TypeError);
    expect(() => parseChallenges("寿司\tすし\t余り")).toThrow(TypeError);
  });

  test("文言か読みが空の行は受け付けない", () => {
    expect(() => parseChallenges("\tすし")).toThrow(TypeError);
    expect(() => parseChallenges("寿司\t")).toThrow(TypeError);
  });

  test("受け付けない行は何行目かを伝える", () => {
    expect(() => parseChallenges("寿司\tすし\n刺身")).toThrow(/2 行目/);
  });
});
