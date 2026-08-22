import { describe, expect, test } from "vite-plus/test";
import { newPhrase, strike } from "../src/index.ts";
import type { Chunk, Mode } from "../src/index.ts";

const fixed =
  (...chunks: Chunk[]): Mode =>
  () =>
    chunks;

const sourceOf = (chunks: Chunk[]) => chunks.map((chunk) => chunk.chars).join("");

const phraseOfChunks = (...chunks: Chunk[]) => newPhrase(sourceOf(chunks), fixed(...chunks));

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
    expect(strike(phrase, "a").isCorrect).toBe(false);
  });

  test("キーボードで打てない経路を持つ塊は受け付けない", () => {
    expect(() => newPhrase("級", fixed({ chars: "級", paths: ["級"] }))).toThrow(TypeError);
    expect(() => newPhrase("あ", fixed({ chars: "あ", paths: ["\n"] }))).toThrow(TypeError);
  });

  test("経路を持たない塊を返す入力方式は受け付けない", () => {
    expect(() => newPhrase("あ", fixed({ chars: "あ", paths: [] }))).toThrow(TypeError);
    expect(() => newPhrase("あ", fixed({ chars: "あ", paths: [""] }))).toThrow(TypeError);
  });
});

describe("strike", () => {
  test("受理した打鍵は isCorrect で、原文を打ち切ると isDone になる", () => {
    const start = phraseOfChunks({ chars: "ab", paths: ["ab"] });

    const a = strike(start, "a");
    expect(a.isCorrect).toBe(true);
    expect(a.phrase.isDone).toBe(false);

    const b = strike(a.phrase, "b");
    expect(b.isCorrect).toBe(true);
    expect(b.phrase.isDone).toBe(true);
    expect(b.phrase.typed).toBe("ab");
    expect(b.phrase.remaining).toBe("");
    expect(b.phrase.cursor).toBe(2);
  });

  test("塊を打ち切っても、後続があるうちは isDone にならない", () => {
    const start = phraseOfChunks({ chars: "あ", paths: ["a"] }, { chars: "い", paths: ["i"] });

    const a = strike(start, "a");
    expect(a.isCorrect).toBe(true);
    expect(a.phrase.isDone).toBe(false);
    expect(a.phrase.cursor).toBe(1);
  });

  test("受理されない打鍵は文言を進めず、同じ文言をそのまま返す", () => {
    const typed = strike(phraseOfChunks({ chars: "ab", paths: ["ab"] }), "a").phrase;

    const missed = strike(typed, "z");
    expect(missed.isCorrect).toBe(false);
    expect(missed.phrase).toBe(typed);

    expect(strike(typed, "b").isCorrect).toBe(true);
  });

  test("打鍵は受け取った文言を書き換えない", () => {
    const start = phraseOfChunks({ chars: "し", paths: ["shi", "si"] });

    strike(start, "s");

    expect(start.typed).toBe("");
    expect(start.remaining).toBe("shi");
    expect(start.cursor).toBe(0);
  });

  test("経路が複数あるとき、remaining は打った経路に追従する", () => {
    const start = phraseOfChunks({ chars: "し", paths: ["shi", "si"] });
    expect(start.remaining).toBe("shi");

    const s = strike(start, "s").phrase;
    expect(s.remaining).toBe("hi");

    const si = strike(s, "i");
    expect(si.phrase.isDone).toBe(true);
    expect(si.phrase.typed).toBe("si");
  });

  test("経路から外れる打鍵は、その塊の途中でも受理しない", () => {
    const s = strike(phraseOfChunks({ chars: "し", paths: ["shi", "si"] }), "s").phrase;

    expect(strike(s, "a").isCorrect).toBe(false);
    expect(s.remaining).toBe("hi");
  });

  test("remaining は後続の塊の推奨経路まで繋げて返す", () => {
    const start = phraseOfChunks(
      { chars: "っこ", paths: ["kko", "xtuko"] },
      { chars: "！", paths: ["!"] },
    );

    expect(start.remaining).toBe("kko!");
    expect(strike(start, "x").phrase.remaining).toBe("tuko!");
  });

  test("cursor は塊が対応する原文の文字数ぶん進む", () => {
    const start = phraseOfChunks({ chars: "っこ", paths: ["kko"] }, { chars: "！", paths: ["!"] });
    expect(start.cursor).toBe(0);

    const k = strike(start, "k").phrase;
    expect(k.cursor).toBe(0);

    const kko = strike(strike(k, "k").phrase, "o").phrase;
    expect(kko.cursor).toBe(2);
    expect(kko.source.slice(0, kko.cursor)).toBe("っこ");
  });

  test("打ち切ったあとの打鍵は受理しない", () => {
    const cleared = strike(phraseOfChunks({ chars: "あ", paths: ["a"] }), "a").phrase;

    const after = strike(cleared, "a");
    expect(after.isCorrect).toBe(false);
    expect(after.phrase.typed).toBe("a");
    expect(after.phrase.cursor).toBe(1);
  });
});
