import fc from "fast-check";
import { describe, expect, test } from "vite-plus/test";
import { createSession, romaji } from "../src/index.ts";
import type { InputResult, Scheme, Session, Unit } from "../src/index.ts";

const KEYS = ["a", "b", "c"] as const;

/**
 * 候補の長さを単位ごとに揃えた単位。
 * 「ある候補が別の候補の接頭辞にならない」という Unit の前提を満たす。
 */
const anyUnit = fc.integer({ min: 1, max: 3 }).chain((length) =>
  fc.record({
    source: fc.string({ minLength: 1, maxLength: 2 }),
    candidates: fc.uniqueArray(
      fc
        .array(fc.constantFrom(...KEYS), { minLength: length, maxLength: length })
        .map((keys) => keys.join("")),
      { minLength: 1, maxLength: 4 },
    ),
  }),
);
const anyUnits = fc.array(anyUnit, { minLength: 1, maxLength: 8 });

const sessionOf = (units: Unit[]) => {
  const scheme: Scheme = () => units;
  return createSession(units.map((unit) => unit.source).join(""), { scheme });
};

/** KEYS に含まれないので、どの単位でも必ず受理されない打鍵。 */
const REJECTED = "z";

/** 推奨経路の先頭を、打ち切るかミスするまで打ち続ける。 */
const typeGuide = (session: Session): InputResult[] => {
  const results: InputResult[] = [];
  while (!session.done) {
    const key = session.remaining.at(0);
    if (key === undefined) break;
    const result = session.input(key);
    results.push(result);
    if (result === "miss") break;
  }
  return results;
};

const typePrefix = (session: ReturnType<typeof sessionOf>, ratio: number) => {
  const keys = session.remaining.slice(0, Math.floor(session.remaining.length * ratio));
  for (const key of keys) session.input(key);
};

describe("createSession の性質", () => {
  test("推奨された打鍵をたどると必ず打ち切れる", () => {
    fc.assert(
      fc.property(anyUnits, (units) => {
        const session = sessionOf(units);
        const results = typeGuide(session);

        expect(results.slice(0, -1).every((result) => result === "hit")).toBe(true);
        expect(results.at(-1)).toBe("complete");
        expect(session.done).toBe(true);
        expect(session.cursor).toBe(session.source.length);
      }),
    );
  });

  test("どこまで打ったあとでも、そこからの remaining で打ち切れる", () => {
    fc.assert(
      fc.property(anyUnits, fc.double({ min: 0, max: 1, noNaN: true }), (units, ratio) => {
        const session = sessionOf(units);
        typePrefix(session, ratio);
        for (const key of session.remaining) session.input(key);

        expect(session.done).toBe(true);
      }),
    );
  });

  test("受理されない打鍵は状態を変えない", () => {
    fc.assert(
      fc.property(anyUnits, fc.double({ min: 0, max: 1, noNaN: true }), (units, ratio) => {
        const session = sessionOf(units);
        typePrefix(session, ratio);
        const before = {
          typed: session.typed,
          remaining: session.remaining,
          cursor: session.cursor,
          done: session.done,
        };

        expect(session.input(REJECTED)).toBe("miss");
        expect({
          typed: session.typed,
          remaining: session.remaining,
          cursor: session.cursor,
          done: session.done,
        }).toEqual(before);
      }),
    );
  });

  test("typed には受理された打鍵だけが積まれる", () => {
    fc.assert(
      fc.property(anyUnits, fc.double({ min: 0, max: 1, noNaN: true }), (units, ratio) => {
        const session = sessionOf(units);
        typePrefix(session, ratio);
        const typed = session.typed;

        session.input(REJECTED);
        session.input(REJECTED);

        expect(session.typed).toBe(typed);
      }),
    );
  });

  test("cursor までの原文は、確定した単位の連結と一致する", () => {
    fc.assert(
      fc.property(anyUnits, fc.double({ min: 0, max: 1, noNaN: true }), (units, ratio) => {
        const session = sessionOf(units);
        typePrefix(session, ratio);

        expect(session.source.startsWith(session.source.slice(0, session.cursor))).toBe(true);
        expect(session.cursor).toBeLessThanOrEqual(session.source.length);
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

/** 促音・撥音を含まない、つまり単位が合成されない原文。 */
const anySimpleText = fc
  .array(fc.constantFrom(...KANA.filter((kana) => !"っんッン".includes(kana))), {
    minLength: 1,
    maxLength: 16,
  })
  .map((chunks) => chunks.join(""));

const anyChunk = fc.constantFrom(...KANA);

describe("romaji の性質", () => {
  test("単位の原文を連結すると元の原文に戻る", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        expect(
          romaji(text)
            .map((unit) => unit.source)
            .join(""),
        ).toBe(text);
      }),
    );
  });

  test("どの単位も空でない打鍵列を持つ", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        for (const unit of romaji(text)) {
          expect(unit.candidates.length).toBeGreaterThan(0);
          expect(unit.candidates.every((candidate) => candidate.length > 0)).toBe(true);
        }
      }),
    );
  });

  test("同じ単位の候補は、互いに接頭辞にならない", () => {
    fc.assert(
      fc.property(anyText, (text) => {
        for (const unit of romaji(text)) {
          for (const candidate of unit.candidates) {
            const prefixes = unit.candidates.filter(
              (other) => other !== candidate && candidate.startsWith(other),
            );
            expect(prefixes).toEqual([]);
          }
        }
      }),
    );
  });

  test("合成されない単位では、推奨する候補が最短の綴りになる", () => {
    fc.assert(
      fc.property(anySimpleText, (text) => {
        for (const unit of romaji(text)) {
          const shortest = Math.min(...unit.candidates.map((candidate) => candidate.length));
          expect(unit.candidates[0]?.length).toBe(shortest);
        }
      }),
    );
  });

  test("促音・撥音を吸収した単位の推奨は、後続の推奨で終わる", () => {
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
        const session = createSession(text, { scheme: romaji });
        const results = typeGuide(session);

        expect(results.filter((result) => result === "miss")).toEqual([]);
        expect(session.done).toBe(true);
        expect(session.cursor).toBe(text.length);
      }),
    );
  });
});
