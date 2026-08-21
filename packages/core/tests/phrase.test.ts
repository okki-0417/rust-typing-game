import { describe, expect, test } from "vite-plus/test";
import { phraseOf, strike } from "../src/index.ts";
import type { Mode, Step } from "../src/index.ts";

const fixed =
  (...steps: Step[]): Mode =>
  () =>
    steps;

const sourceOf = (steps: Step[]) => steps.map((step) => step.source).join("");

const phraseOfSteps = (...steps: Step[]) => phraseOf(sourceOf(steps), fixed(...steps));

describe("phraseOf", () => {
  test("既定の入力方式は原文をそのまま打たせる", () => {
    const phrase = phraseOf("a1!");

    expect(phrase.remaining).toBe("a1!");
    expect(phrase.cursor).toBe(0);
    expect(phrase.done).toBe(false);
  });

  test("空の原文は最初から打ち切った状態になる", () => {
    const phrase = phraseOf("");

    expect(phrase.done).toBe(true);
    expect(phrase.remaining).toBe("");
    expect(phrase.cursor).toBe(0);
    expect(strike(phrase, "a").correct).toBe(false);
  });

  test("キーボードで打てない打鍵列を持つ区切りは受け付けない", () => {
    expect(() => phraseOf("級", fixed({ source: "級", candidates: ["級"] }))).toThrow(TypeError);
    expect(() => phraseOf("あ", fixed({ source: "あ", candidates: ["\n"] }))).toThrow(TypeError);
  });

  test("打鍵列を持たない区切りを返す入力方式は受け付けない", () => {
    expect(() => phraseOf("あ", fixed({ source: "あ", candidates: [] }))).toThrow(TypeError);
    expect(() => phraseOf("あ", fixed({ source: "あ", candidates: [""] }))).toThrow(TypeError);
  });
});

describe("strike", () => {
  test("受理した打鍵は correct で、原文を打ち切ると done になる", () => {
    const start = phraseOfSteps({ source: "ab", candidates: ["ab"] });

    const a = strike(start, "a");
    expect(a.correct).toBe(true);
    expect(a.phrase.done).toBe(false);

    const b = strike(a.phrase, "b");
    expect(b.correct).toBe(true);
    expect(b.phrase.done).toBe(true);
    expect(b.phrase.typed).toBe("ab");
    expect(b.phrase.remaining).toBe("");
    expect(b.phrase.cursor).toBe(2);
  });

  test("区切りを打ち切っても、後続があるうちは done にならない", () => {
    const start = phraseOfSteps(
      { source: "あ", candidates: ["a"] },
      { source: "い", candidates: ["i"] },
    );

    const a = strike(start, "a");
    expect(a.correct).toBe(true);
    expect(a.phrase.done).toBe(false);
    expect(a.phrase.cursor).toBe(1);
  });

  test("受理されない打鍵は文言を進めず、同じ文言をそのまま返す", () => {
    const typed = strike(phraseOfSteps({ source: "ab", candidates: ["ab"] }), "a").phrase;

    const missed = strike(typed, "z");
    expect(missed.correct).toBe(false);
    expect(missed.phrase).toBe(typed);

    expect(strike(typed, "b").correct).toBe(true);
  });

  test("打鍵は受け取った文言を書き換えない", () => {
    const start = phraseOfSteps({ source: "し", candidates: ["shi", "si"] });

    strike(start, "s");

    expect(start.typed).toBe("");
    expect(start.remaining).toBe("shi");
    expect(start.cursor).toBe(0);
  });

  test("候補が複数あるとき、remaining は打った経路に追従する", () => {
    const start = phraseOfSteps({ source: "し", candidates: ["shi", "si"] });
    expect(start.remaining).toBe("shi");

    const s = strike(start, "s").phrase;
    expect(s.remaining).toBe("hi");

    const si = strike(s, "i");
    expect(si.phrase.done).toBe(true);
    expect(si.phrase.typed).toBe("si");
  });

  test("候補から外れる打鍵は、その区切りの途中でも受理しない", () => {
    const s = strike(phraseOfSteps({ source: "し", candidates: ["shi", "si"] }), "s").phrase;

    expect(strike(s, "a").correct).toBe(false);
    expect(s.remaining).toBe("hi");
  });

  test("remaining は後続の区切りの推奨候補まで繋げて返す", () => {
    const start = phraseOfSteps(
      { source: "っこ", candidates: ["kko", "xtuko"] },
      { source: "！", candidates: ["!"] },
    );

    expect(start.remaining).toBe("kko!");
    expect(strike(start, "x").phrase.remaining).toBe("tuko!");
  });

  test("cursor は区切りが対応する原文の文字数ぶん進む", () => {
    const start = phraseOfSteps(
      { source: "っこ", candidates: ["kko"] },
      { source: "！", candidates: ["!"] },
    );
    expect(start.cursor).toBe(0);

    const k = strike(start, "k").phrase;
    expect(k.cursor).toBe(0);

    const kko = strike(strike(k, "k").phrase, "o").phrase;
    expect(kko.cursor).toBe(2);
    expect(kko.source.slice(0, kko.cursor)).toBe("っこ");
  });

  test("打ち切ったあとの打鍵は受理しない", () => {
    const done = strike(phraseOfSteps({ source: "あ", candidates: ["a"] }), "a").phrase;

    const after = strike(done, "a");
    expect(after.correct).toBe(false);
    expect(after.phrase.typed).toBe("a");
    expect(after.phrase.cursor).toBe(1);
  });
});
