import fc from "fast-check";
import { describe, expect, test } from "vite-plus/test";
import { phraseOf, romaji, strike } from "../src/index.ts";
import type { Mode, Phrase, Step } from "../src/index.ts";

const ACCEPTED_KEYS = ["a", "b", "c"] as const;

// WHY NOT: 候補の長さは本来まちまちだが、区切りごとに揃えないと候補どうしが接頭辞になり、
// Step が満たすべき前提を壊した区切りで性質を検証してしまう
const anyStep = fc.integer({ min: 1, max: 3 }).chain((length) =>
  fc.record({
    source: fc.string({ minLength: 1, maxLength: 2 }),
    candidates: fc.uniqueArray(
      fc
        .array(fc.constantFrom(...ACCEPTED_KEYS), { minLength: length, maxLength: length })
        .map((keys) => keys.join("")),
      { minLength: 1, maxLength: 4 },
    ),
  }),
);
const anySteps = fc.array(anyStep, { minLength: 1, maxLength: 8 });

const phraseOfSteps = (steps: Step[]) => {
  const mode: Mode = () => steps;
  return phraseOf(steps.map((step) => step.source).join(""), mode);
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
  while (!phrase.done) {
    const key = phrase.remaining.at(0);
    if (key === undefined) break;
    const struck = strike(phrase, key);
    phrase = struck.phrase;
    if (!struck.correct) {
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
      fc.property(anySteps, (steps) => {
        const { phrase, missed } = typeGuide(phraseOfSteps(steps));

        expect(missed).toBe(false);
        expect(phrase.done).toBe(true);
        expect(phrase.cursor).toBe(phrase.source.length);
      }),
    );
  });

  test("どこまで打ったあとでも、そこからの remaining で打ち切れる", () => {
    fc.assert(
      fc.property(anySteps, fc.double({ min: 0, max: 1, noNaN: true }), (steps, ratio) => {
        const started = typePrefix(phraseOfSteps(steps), ratio);

        expect(typeKeys(started, started.remaining).done).toBe(true);
      }),
    );
  });

  test("受理されない打鍵は文言を進めない", () => {
    fc.assert(
      fc.property(anySteps, fc.double({ min: 0, max: 1, noNaN: true }), (steps, ratio) => {
        const phrase = typePrefix(phraseOfSteps(steps), ratio);

        const struck = strike(phrase, REJECTED_KEY);
        expect(struck.correct).toBe(false);
        expect(struck.phrase).toBe(phrase);
      }),
    );
  });

  test("打鍵は受け取った文言を書き換えない", () => {
    fc.assert(
      fc.property(anySteps, fc.double({ min: 0, max: 1, noNaN: true }), (steps, ratio) => {
        const phrase = typePrefix(phraseOfSteps(steps), ratio);
        const before = { ...phrase };

        strike(phrase, phrase.remaining.at(0) ?? REJECTED_KEY);
        strike(phrase, REJECTED_KEY);

        expect({ ...phrase }).toEqual(before);
      }),
    );
  });

  test("cursor までの原文は、確定した区切りの連結と一致する", () => {
    fc.assert(
      fc.property(anySteps, fc.double({ min: 0, max: 1, noNaN: true }), (steps, ratio) => {
        const phrase = typePrefix(phraseOfSteps(steps), ratio);

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
  .map((chunks) => chunks.join(""));

const anySimpleText = fc
  .array(fc.constantFrom(...KANA.filter((kana) => !"っんッン".includes(kana))), {
    minLength: 1,
    maxLength: 16,
  })
  .map((chunks) => chunks.join(""));

const anyChunk = fc.constantFrom(...KANA);

describe("romaji の性質", () => {
  test("区切りの原文を連結すると元の原文に戻る", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        expect(
          romaji(text)
            .map((step) => step.source)
            .join(""),
        ).toBe(text);
      }),
    );
  });

  test("どの区切りも空でない打鍵列を持つ", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        for (const step of romaji(text)) {
          expect(step.candidates.length).toBeGreaterThan(0);
          expect(step.candidates.every((candidate) => candidate.length > 0)).toBe(true);
        }
      }),
    );
  });

  test("同じ区切りの候補は、互いに接頭辞にならない", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        for (const step of romaji(text)) {
          for (const candidate of step.candidates) {
            const prefixes = step.candidates.filter(
              (other) => other !== candidate && candidate.startsWith(other),
            );
            expect(prefixes).toEqual([]);
          }
        }
      }),
    );
  });

  test("合成されない区切りでは、推奨する候補が最短の綴りになる", () => {
    fc.assert(
      fc.property(anySimpleText, (text) => {
        for (const step of romaji(text)) {
          const shortest = Math.min(...step.candidates.map((candidate) => candidate.length));
          expect(step.candidates[0]?.length).toBe(shortest);
        }
      }),
    );
  });

  test("促音・撥音を吸収した区切りの推奨は、後続の推奨で終わる", () => {
    fc.assert(
      fc.property(anyChunk, fc.constantFrom("っ", "ん"), (chunk, absorbed) => {
        const following = romaji(chunk)[0]?.candidates[0] ?? "";
        const composed = romaji(absorbed + chunk)[0]?.candidates[0] ?? "";

        expect(composed.endsWith(following)).toBe(true);
      }),
    );
  });
});

describe("ローマ字で打ち切れること", () => {
  test("どんな原文でも、ガイドのとおりに打てばミスなく打ち切れる", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        const { phrase, missed } = typeGuide(phraseOf(text, romaji));

        expect(missed).toBe(false);
        expect(phrase.done).toBe(true);
        expect(phrase.cursor).toBe(text.length);
      }),
    );
  });
});
