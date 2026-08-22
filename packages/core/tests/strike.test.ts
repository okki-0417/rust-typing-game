import { describe, expect, test } from "vite-plus/test";
import { newPhrase, strike } from "../src/index.ts";
import type { Phrase } from "../src/index.ts";

const typeKey = (phrase: Phrase, key: string): Phrase => {
  const struck = strike({ phrase, key });
  if (!struck) throw new Error(`受理されるはずの打鍵が弾かれた: ${JSON.stringify(key)}`);
  return struck;
};

const typeKeys = (phrase: Phrase, keys: string): Phrase => {
  let current = phrase;
  for (const key of keys) current = typeKey(current, key);
  return current;
};

describe("strike", () => {
  test("受理した打鍵は新しい文言を返し、原文を打ち切ると isDone になる", () => {
    const start = newPhrase("ab");

    const a = typeKey(start, "a");
    expect(a.isDone).toBe(false);

    const b = typeKey(a, "b");
    expect(b.isDone).toBe(true);
    expect(b.typed).toBe("ab");
    expect(b.remaining).toBe("");
    expect(b.cursor).toBe(2);
  });

  test("塊を打ち切っても、後続があるうちは isDone にならない", () => {
    const a = typeKey(newPhrase("あい", "romaji"), "a");

    expect(a.isDone).toBe(false);
    expect(a.cursor).toBe(1);
  });

  test("受理されない打鍵は何も返さない", () => {
    const typed = typeKey(newPhrase("し", "romaji"), "s");

    expect(strike({ phrase: typed, key: "z" })).toBeNull();
    expect(strike({ phrase: typed, key: "i" })).not.toBeNull();
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

    const sh = typeKeys(start, "sh");
    expect(sh.remaining).toBe("i");

    const shi = typeKey(sh, "i");
    expect(shi.isDone).toBe(true);
    expect(shi.typed).toBe("shi");
  });

  test("経路から外れる打鍵は、その塊の途中でも受理しない", () => {
    const s = typeKey(newPhrase("し", "romaji"), "s");

    expect(strike({ phrase: s, key: "a" })).toBeNull();
    expect(s.remaining).toBe("i");
  });

  test("remaining は後続の塊の推奨経路まで繋げて返す", () => {
    const start = newPhrase("っこ！", "romaji");

    expect(start.remaining).toBe("kko!");
    expect(typeKey(start, "x").remaining).toBe("tuko!");
  });

  test("cursor は塊が対応する原文の文字数ぶん進む", () => {
    const start = newPhrase("っこ！", "romaji");
    expect(start.cursor).toBe(0);
    expect(typeKey(start, "k").cursor).toBe(0);

    const kko = typeKeys(start, "kko");
    expect(kko.cursor).toBe(2);
    expect(kko.source.slice(0, kko.cursor)).toBe("っこ");
  });

  test("打ち切ったあとの打鍵は受理しない", () => {
    const cleared = typeKey(newPhrase("あ", "romaji"), "a");

    expect(strike({ phrase: cleared, key: "a" })).toBeNull();
    expect(cleared.typed).toBe("a");
    expect(cleared.cursor).toBe(1);
  });
});
