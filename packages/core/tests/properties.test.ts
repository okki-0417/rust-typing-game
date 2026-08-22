import fc from "fast-check";
import { describe, expect, test } from "vite-plus/test";
import { newPhrase, romaji, strike } from "../src/index.ts";
import type { Chunk, Mode, Phrase } from "../src/index.ts";

const ACCEPTED_KEYS = ["a", "b", "c"] as const;

// WHY NOT: 経路の長さは本来まちまちだが、塊ごとに揃えないと経路どうしが接頭辞になり、
// Chunk が満たすべき前提を壊した塊で性質を検証してしまう
const anyChunk = fc.integer({ min: 1, max: 3 }).chain((length) =>
  fc.record({
    chars: fc.string({ minLength: 1, maxLength: 2 }),
    paths: fc.uniqueArray(
      fc
        .array(fc.constantFrom(...ACCEPTED_KEYS), { minLength: length, maxLength: length })
        .map((keys) => keys.join("")),
      { minLength: 1, maxLength: 4 },
    ),
  }),
);
const anyChunks = fc.array(anyChunk, { minLength: 1, maxLength: 8 });

const phraseOfChunks = (chunks: Chunk[]) => {
  const mode: Mode = () => chunks;
  return newPhrase(chunks.map((chunk) => chunk.chars).join(""), mode);
};

const REJECTED_KEY = "z";

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
      fc.property(anyChunks, (chunks) => {
        const { phrase, missed } = typeGuide(phraseOfChunks(chunks));

        expect(missed).toBe(false);
        expect(phrase.isDone).toBe(true);
        expect(phrase.cursor).toBe(phrase.source.length);
      }),
    );
  });

  test("どこまで打ったあとでも、そこからの remaining で打ち切れる", () => {
    fc.assert(
      fc.property(anyChunks, fc.double({ min: 0, max: 1, noNaN: true }), (chunks, ratio) => {
        const started = typePrefix(phraseOfChunks(chunks), ratio);

        expect(typeKeys(started, started.remaining).isDone).toBe(true);
      }),
    );
  });

  test("受理されない打鍵は文言を進めない", () => {
    fc.assert(
      fc.property(anyChunks, fc.double({ min: 0, max: 1, noNaN: true }), (chunks, ratio) => {
        const phrase = typePrefix(phraseOfChunks(chunks), ratio);

        const struck = strike(phrase, REJECTED_KEY);
        expect(struck.isCorrect).toBe(false);
        expect(struck.phrase).toBe(phrase);
      }),
    );
  });

  test("打鍵は受け取った文言を書き換えない", () => {
    fc.assert(
      fc.property(anyChunks, fc.double({ min: 0, max: 1, noNaN: true }), (chunks, ratio) => {
        const phrase = typePrefix(phraseOfChunks(chunks), ratio);
        const before = { ...phrase };

        strike(phrase, phrase.remaining.at(0) ?? REJECTED_KEY);
        strike(phrase, REJECTED_KEY);

        expect({ ...phrase }).toEqual(before);
      }),
    );
  });

  test("cursor までの原文は、確定した塊の連結と一致する", () => {
    fc.assert(
      fc.property(anyChunks, fc.double({ min: 0, max: 1, noNaN: true }), (chunks, ratio) => {
        const phrase = typePrefix(phraseOfChunks(chunks), ratio);

        expect(phrase.source.startsWith(phrase.source.slice(0, phrase.cursor))).toBe(true);
        expect(phrase.cursor).toBeLessThanOrEqual(phrase.source.length);
      }),
    );
  });
});

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

describe("romaji の性質", () => {
  test("塊の原文を連結すると元の原文に戻る", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        expect(
          romaji(text)
            .map((chunk) => chunk.chars)
            .join(""),
        ).toBe(text);
      }),
    );
  });

  test("どの塊も空でない経路を持つ", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        for (const chunk of romaji(text)) {
          expect(chunk.paths.length).toBeGreaterThan(0);
          expect(chunk.paths.every((path) => path.length > 0)).toBe(true);
        }
      }),
    );
  });

  test("同じ塊の経路は、互いに接頭辞にならない", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        for (const chunk of romaji(text)) {
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
        for (const chunk of romaji(text)) {
          const shortest = Math.min(...chunk.paths.map((path) => path.length));
          expect(chunk.paths[0]?.length).toBe(shortest);
        }
      }),
    );
  });

  test("促音・撥音を吸収した塊の推奨は、後続の推奨で終わる", () => {
    fc.assert(
      fc.property(anyKana, fc.constantFrom("っ", "ん"), (kana, absorbed) => {
        const following = romaji(kana)[0]?.paths[0] ?? "";
        const composed = romaji(absorbed + kana)[0]?.paths[0] ?? "";

        expect(composed.endsWith(following)).toBe(true);
      }),
    );
  });
});

describe("ローマ字で打ち切れること", () => {
  test("どんな原文でも、ガイドのとおりに打てばミスなく打ち切れる", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        const { phrase, missed } = typeGuide(newPhrase(text, romaji));

        expect(missed).toBe(false);
        expect(phrase.isDone).toBe(true);
        expect(phrase.cursor).toBe(text.length);
      }),
    );
  });
});
