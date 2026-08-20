import { describe, expect, test } from "vite-plus/test";
import { romaji } from "../src/index.ts";

const sources = (source: string) => romaji(source).map((unit) => unit.source);
const candidates = (source: string, index = 0) => romaji(source)[index]?.candidates ?? [];
/** 推奨経路だけを繋いだ打鍵列。ガイド表示に出るもの。 */
const guide = (source: string) =>
  romaji(source)
    .map((unit) => unit.candidates[0])
    .join("");

describe("romaji", () => {
  describe("かなの綴り", () => {
    test("1かなが1単位になる", () => {
      expect(sources("かき")).toEqual(["か", "き"]);
      expect(candidates("か")).toEqual(["ka", "ca"]);
    });

    test("複数の綴りを持つかなは全部受け付け、最短を推奨する", () => {
      expect(candidates("し")).toEqual(["si", "ci", "shi"]);
      expect(candidates("つ")).toContain("tsu");
      expect(candidates("ふ")).toContain("fu");
      expect(guide("し")).toBe("si");
    });

    test("表にない文字はその文字自体を打つ単位になる", () => {
      expect(romaji("ab1")).toEqual([
        { source: "a", candidates: ["a"] },
        { source: "b", candidates: ["b"] },
        { source: "1", candidates: ["1"] },
      ]);
    });

    test("かな入力の記号は対応するキーになる", () => {
      expect(guide("ケーキ、")).toBe("ke-ki,");
    });

    test("全角の英数字と記号は半角のキーになる", () => {
      expect(guide("３つ")).toBe("3tu");
      expect(guide("Ａｂ！")).toBe("Ab!");
    });

    test("綴れない文字は打鍵列にならない", () => {
      expect(romaji("級")).toEqual([{ source: "級", candidates: ["級"] }]);
    });

    test("カタカナはひらがなと同じ綴りになるが、原文の見た目は保つ", () => {
      expect(sources("カキ")).toEqual(["カ", "キ"]);
      expect(guide("カキ")).toBe("kaki");
      expect(guide("ヴァイオリン")).toBe("vaiorinn");
    });
  });

  describe("拗音", () => {
    test("融合した綴りを持つ組み合わせは1単位にまとめる", () => {
      expect(sources("きょ")).toEqual(["きょ"]);
      expect(guide("きょ")).toBe("kyo");
    });

    test("かなを分けて打つ経路も受け付ける", () => {
      expect(candidates("きょ")).toContain("kixyo");
      expect(candidates("きょ")).toContain("kilyo");
      expect(candidates("じゃ")).toEqual(
        expect.arrayContaining(["ja", "zya", "jya", "zixya", "jilya"]),
      );
    });

    test("融合した綴りを持たない組み合わせは単位を分ける", () => {
      expect(sources("あぁ")).toEqual(["あ", "ぁ"]);
    });
  });

  describe("促音", () => {
    test("後続の子音を重ねる綴りと、xtu を前置する綴りの両方を受け付ける", () => {
      expect(sources("っこ")).toEqual(["っこ"]);
      expect(guide("っこ")).toBe("kko");
      expect(candidates("っこ")).toEqual(
        expect.arrayContaining(["kko", "cco", "xtuko", "ltuko", "xtsuco"]),
      );
    });

    test("拗音の前でも子音を重ねられる", () => {
      expect(guide("っしゃ")).toBe("ssya");
      expect(candidates("っしゃ")).toContain("ssha");
    });

    test("母音の前では子音を重ねられない", () => {
      expect(candidates("っあ")).toEqual(["xtua", "ltua", "xtsua", "ltsua"]);
    });

    test("「ん」を吸収した単位の前でも子音を重ねない", () => {
      expect(candidates("っんこ")).not.toContain("nnko");
      expect(candidates("っんこ")).toContain("xtunko");
    });

    test("後続がなければ促音だけの単位になる", () => {
      expect(sources("あっ")).toEqual(["あ", "っ"]);
      expect(candidates("あっ", 1)).toEqual(["xtu", "ltu", "xtsu", "ltsu"]);
    });
  });

  describe("撥音", () => {
    test("後続と1単位にまとめ、n 一文字の綴りも受け付ける", () => {
      expect(sources("んか")).toEqual(["んか"]);
      expect(guide("んか")).toBe("nka");
      expect(candidates("んか")).toEqual(
        expect.arrayContaining(["nka", "nnka", "xnka", "n'ka", "nca"]),
      );
    });

    test("な行の前では n 一文字を受け付けない", () => {
      expect(candidates("んに")).not.toContain("nni");
      expect(guide("んに")).toBe("nnni");
    });

    test("母音・や行の前では n 一文字を受け付けない", () => {
      expect(candidates("んあ")).not.toContain("na");
      expect(candidates("んや")).not.toContain("nya");
      expect(guide("んあ")).toBe("nna");
    });

    test("後続がなければ nn を要求する", () => {
      expect(sources("ほん")).toEqual(["ほ", "ん"]);
      expect(candidates("ほん", 1)).toEqual(["nn", "n'", "xn"]);
    });

    test("促音を吸収した単位の前では n 一文字を受け付ける", () => {
      expect(guide("んっか")).toBe("nkka");
    });
  });

  describe("原文との対応", () => {
    test("単位の原文を連結すると元の原文に戻る", () => {
      const source = "しゃっきんはこんにちはでケーキ";
      expect(sources(source).join("")).toBe(source);
    });

    test("文をまとめて綴れる", () => {
      expect(guide("しゃっきん")).toBe("syakkinn");
      expect(guide("こんにちは")).toBe("konnnitiha");
      expect(guide("がっこうへいく")).toBe("gakkouheiku");
      expect(guide("にっぽんちゃちゃちゃ")).toBe("nippontyatyatya");
    });
  });
});
