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
    expect(strike({ phrase, key: "a" }).isCorrect).toBe(false);
  });

  test("キーボードで打てない文字を含む原文は受け付けない", () => {
    expect(() => newPhrase("級", "romaji")).toThrow(TypeError);
    expect(() => newPhrase("🍣")).toThrow(TypeError);
  });
});

describe("strike", () => {
  test("受理した打鍵は isCorrect で、原文を打ち切ると isDone になる", () => {
    const start = newPhrase("ab");

    const a = strike({ phrase: start, key: "a" });
    expect(a.isCorrect).toBe(true);
    expect(a.phrase.isDone).toBe(false);

    const b = strike({ phrase: a.phrase, key: "b" });
    expect(b.isCorrect).toBe(true);
    expect(b.phrase.isDone).toBe(true);
    expect(b.phrase.typed).toBe("ab");
    expect(b.phrase.remaining).toBe("");
    expect(b.phrase.cursor).toBe(2);
  });

  test("塊を打ち切っても、後続があるうちは isDone にならない", () => {
    const start = newPhrase("あい", "romaji");

    const a = strike({ phrase: start, key: "a" });
    expect(a.isCorrect).toBe(true);
    expect(a.phrase.isDone).toBe(false);
    expect(a.phrase.cursor).toBe(1);
  });

  test("受理されない打鍵は文言を進めず、同じ文言をそのまま返す", () => {
    const typed = strike({ phrase: newPhrase("し", "romaji"), key: "s" }).phrase;

    const missed = strike({ phrase: typed, key: "z" });
    expect(missed.isCorrect).toBe(false);
    expect(missed.phrase).toBe(typed);

    expect(strike({ phrase: typed, key: "i" }).isCorrect).toBe(true);
  });

  test("打鍵は受け取った文言を書き換えない", () => {
    const start = newPhrase("し", "romaji");

    strike({ phrase: start, key: "s" });

    expect(start.typed).toBe("");
    expect(start.remaining).toBe("si");
    expect(start.cursor).toBe(0);
  });

  test("経路が複数あるとき、remaining は打った経路に追従する", () => {
    const start = newPhrase("し", "romaji");
    expect(start.remaining).toBe("si");

    const sh = strike({ phrase: strike({ phrase: start, key: "s" }).phrase, key: "h" }).phrase;
    expect(sh.remaining).toBe("i");

    const shi = strike({ phrase: sh, key: "i" });
    expect(shi.phrase.isDone).toBe(true);
    expect(shi.phrase.typed).toBe("shi");
  });

  test("経路から外れる打鍵は、その塊の途中でも受理しない", () => {
    const s = strike({ phrase: newPhrase("し", "romaji"), key: "s" }).phrase;

    expect(strike({ phrase: s, key: "a" }).isCorrect).toBe(false);
    expect(s.remaining).toBe("i");
  });

  test("remaining は後続の塊の推奨経路まで繋げて返す", () => {
    const start = newPhrase("っこ！", "romaji");

    expect(start.remaining).toBe("kko!");
    expect(strike({ phrase: start, key: "x" }).phrase.remaining).toBe("tuko!");
  });

  test("cursor は塊が対応する原文の文字数ぶん進む", () => {
    const start = newPhrase("っこ！", "romaji");
    expect(start.cursor).toBe(0);

    const k = strike({ phrase: start, key: "k" }).phrase;
    expect(k.cursor).toBe(0);

    const kko = strike({ phrase: strike({ phrase: k, key: "k" }).phrase, key: "o" }).phrase;
    expect(kko.cursor).toBe(2);
    expect(kko.source.slice(0, kko.cursor)).toBe("っこ");
  });

  test("打ち切ったあとの打鍵は受理しない", () => {
    const cleared = strike({ phrase: newPhrase("あ", "romaji"), key: "a" }).phrase;

    const after = strike({ phrase: cleared, key: "a" });
    expect(after.isCorrect).toBe(false);
    expect(after.phrase.typed).toBe("a");
    expect(after.phrase.cursor).toBe(1);
  });
});
