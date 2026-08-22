import fc from "fast-check";
import { describe, expect, test } from "vite-plus/test";
import { interpret, newPhrase, strike } from "../src/index.ts";
import type { Phrase } from "../src/index.ts";

// WHY NOT: 打てない打鍵なら何でもよいが、経路は必ず印字可能な ASCII なので、
// どんな原文を引いても確実に外れる改行を使う
const IMPOSSIBLE_KEY = "\n";

const KANA = [
  "あ",
  "い",
  "う",
  "え",
  "お",
  "か",
  "き",
  "く",
  "し",
  "つ",
  "て",
  "と",
  "な",
  "に",
  "ふ",
  "ま",
  "や",
  "ゆ",
  "ら",
  "わ",
  "を",
  "ん",
  "っ",
  "が",
  "じ",
  "だ",
  "ば",
  "ぴ",
  "きょ",
  "しゃ",
  "じゃ",
  "ちゃ",
  "にゅ",
  "ふぁ",
  "てぃ",
  "ヴ",
  "ー",
  "、",
  "。",
  "ア",
  "カ",
  "ン",
  "ッ",
  "a",
  "Z",
  "1",
  " ",
  "３",
  "Ａ",
  "ｂ",
  "！",
];

const anyText = fc
  .array(fc.constantFrom(...KANA), { minLength: 1, maxLength: 16 })
  .map((kana) => kana.join(""));

const anySimpleText = fc
  .array(fc.constantFrom(...KANA.filter((kana) => !"っんッン".includes(kana))), {
    minLength: 1,
    maxLength: 16,
  })
  .map((kana) => kana.join(""));

const anyKana = fc.constantFrom(...KANA);

const anyRomajiPhrase = anyText.map((text) => newPhrase(text, "romaji"));

const anyRatio = fc.double({ min: 0, max: 1, noNaN: true });

const typeKeys = (phrase: Phrase, keys: string) => {
  let current = phrase;
  for (const key of keys) current = strike(current, key).phrase;
  return current;
};

const typeGuide = (start: Phrase) => {
  let phrase = start;
  let missed = false;
  while (!phrase.isDone) {
    const key = phrase.remaining.at(0);
    if (key === undefined) break;
    const struck = strike(phrase, key);
    phrase = struck.phrase;
    if (!struck.isCorrect) {
      missed = true;
      break;
    }
  }
  return { phrase, missed };
};

const typePrefix = (phrase: Phrase, ratio: number) =>
  typeKeys(phrase, phrase.remaining.slice(0, Math.floor(phrase.remaining.length * ratio)));

describe("文言を打ち進める性質", () => {
  test("推奨された打鍵をたどると必ず打ち切れる", () => {
    fc.assert(
      fc.property(anyRomajiPhrase, (start) => {
        const { phrase, missed } = typeGuide(start);

        expect(missed).toBe(false);
        expect(phrase.isDone).toBe(true);
        expect(phrase.cursor).toBe(phrase.source.length);
      }),
    );
  });

  test("どこまで打ったあとでも、そこからの remaining で打ち切れる", () => {
    fc.assert(
      fc.property(anyRomajiPhrase, anyRatio, (start, ratio) => {
        const started = typePrefix(start, ratio);

        expect(typeKeys(started, started.remaining).isDone).toBe(true);
      }),
    );
  });

  test("受理されない打鍵は文言を進めない", () => {
    fc.assert(
      fc.property(anyRomajiPhrase, anyRatio, (start, ratio) => {
        const phrase = typePrefix(start, ratio);

        const struck = strike(phrase, IMPOSSIBLE_KEY);
        expect(struck.isCorrect).toBe(false);
        expect(struck.phrase).toBe(phrase);
      }),
    );
  });

  test("打鍵は受け取った文言を書き換えない", () => {
    fc.assert(
      fc.property(anyRomajiPhrase, anyRatio, (start, ratio) => {
        const phrase = typePrefix(start, ratio);
        const before = { ...phrase };

        strike(phrase, phrase.remaining.at(0) ?? IMPOSSIBLE_KEY);
        strike(phrase, IMPOSSIBLE_KEY);

        expect({ ...phrase }).toEqual(before);
      }),
    );
  });

  test("cursor までの原文は、確定した塊の連結と一致する", () => {
    fc.assert(
      fc.property(anyRomajiPhrase, anyRatio, (start, ratio) => {
        const phrase = typePrefix(start, ratio);
        const settled = phrase.chunks.slice(0, phrase.index);

        expect(phrase.source.slice(0, phrase.cursor)).toBe(
          settled.map((chunk) => chunk.chars).join(""),
        );
      }),
    );
  });
});

describe("romaji の性質", () => {
  test("塊の原文を連結すると元の原文に戻る", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        expect(
          interpret(text, "romaji")
            .map((chunk) => chunk.chars)
            .join(""),
        ).toBe(text);
      }),
    );
  });

  test("どの塊も空でない経路を持つ", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        for (const chunk of interpret(text, "romaji")) {
          expect(chunk.paths.length).toBeGreaterThan(0);
          expect(chunk.paths.every((path) => path.length > 0)).toBe(true);
        }
      }),
    );
  });

  test("同じ塊の経路は、互いに接頭辞にならない", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        for (const chunk of interpret(text, "romaji")) {
          for (const path of chunk.paths) {
            const prefixes = chunk.paths.filter(
              (other) => other !== path && path.startsWith(other),
            );
            expect(prefixes).toEqual([]);
          }
        }
      }),
    );
  });

  test("合成されない塊では、推奨する経路が最短の綴りになる", () => {
    fc.assert(
      fc.property(anySimpleText, (text) => {
        for (const chunk of interpret(text, "romaji")) {
          const shortest = Math.min(...chunk.paths.map((path) => path.length));
          expect(chunk.paths[0]?.length).toBe(shortest);
        }
      }),
    );
  });

  test("促音・撥音を吸収した塊の推奨は、後続の推奨で終わる", () => {
    fc.assert(
      fc.property(anyKana, fc.constantFrom("っ", "ん"), (kana, absorbed) => {
        const following = interpret(kana, "romaji")[0]?.paths[0] ?? "";
        const composed = interpret(absorbed + kana, "romaji")[0]?.paths[0] ?? "";

        expect(composed.endsWith(following)).toBe(true);
      }),
    );
  });
});
