import { describe, expect, test } from "vite-plus/test";
import { interpret, newPhrase, strike } from "../src/index.ts";

const sources = (source: string) => interpret(source, "romaji").map((chunk) => chunk.chars);
const paths = (source: string, index = 0) => interpret(source, "romaji")[index]?.paths ?? [];
const guide = (source: string) =>
  interpret(source, "romaji")
    .map((chunk) => chunk.paths[0])
    .join("");

describe("romaji", () => {
  describe("かなの綴り", () => {
    test("1かなが1塊になる", () => {
      expect(sources("かき")).toEqual(["か", "き"]);
      expect(paths("か")).toEqual(["ka", "ca"]);
    });

    test("複数の綴りを持つかなは全部受け付け、最短を推奨する", () => {
      expect(paths("し")).toEqual(["si", "ci", "shi"]);
      expect(paths("つ")).toContain("tsu");
      expect(paths("ふ")).toContain("fu");
      expect(guide("し")).toBe("si");
    });

    test("表にない文字はその文字自体を打つ塊になる", () => {
      expect(interpret("ab1", "romaji")).toEqual([
        { chars: "a", paths: ["a"] },
        { chars: "b", paths: ["b"] },
        { chars: "1", paths: ["1"] },
      ]);
    });

    test("かな入力の記号は対応するキーになる", () => {
      expect(guide("ケーキ、")).toBe("ke-ki,");
    });

    test("全角の英数字と記号は半角のキーになる", () => {
      expect(guide("３つ")).toBe("3tu");
      expect(guide("Ａｂ！")).toBe("Ab!");
    });

    test("綴れない文字は打てないので受け付けない", () => {
      expect(() => interpret("級", "romaji")).toThrow(TypeError);
    });

    test("カタカナはひらがなと同じ綴りになるが、原文の見た目は保つ", () => {
      expect(sources("カキ")).toEqual(["カ", "キ"]);
      expect(guide("カキ")).toBe("kaki");
      expect(guide("ヴァイオリン")).toBe("vaiorinn");
    });
  });

  describe("拗音", () => {
    test("融合した綴りを持つ組み合わせは1塊にまとめる", () => {
      expect(sources("きょ")).toEqual(["きょ"]);
      expect(guide("きょ")).toBe("kyo");
    });

    test("かなを分けて打つ経路も受け付ける", () => {
      expect(paths("きょ")).toContain("kixyo");
      expect(paths("きょ")).toContain("kilyo");
      expect(paths("じゃ")).toEqual(expect.arrayContaining(["ja", "zya", "jya", "zixya", "jilya"]));
    });

    test("融合した綴りを持たない組み合わせは塊を分ける", () => {
      expect(sources("あぁ")).toEqual(["あ", "ぁ"]);
    });
  });

  describe("促音", () => {
    test("後続の子音を重ねる綴りと、xtu を前置する綴りの両方を受け付ける", () => {
      expect(sources("っこ")).toEqual(["っこ"]);
      expect(guide("っこ")).toBe("kko");
      expect(paths("っこ")).toEqual(
        expect.arrayContaining(["kko", "cco", "xtuko", "ltuko", "xtsuco"]),
      );
    });

    test("拗音の前でも子音を重ねられる", () => {
      expect(guide("っしゃ")).toBe("ssya");
      expect(paths("っしゃ")).toContain("ssha");
    });

    test("母音の前では子音を重ねられない", () => {
      expect(paths("っあ")).toEqual(["xtua", "ltua", "xtsua", "ltsua"]);
    });

    test("「ん」を吸収した塊の前でも子音を重ねない", () => {
      expect(paths("っんこ")).not.toContain("nnko");
      expect(paths("っんこ")).toContain("xtunko");
    });

    test("後続がなければ促音だけの塊になる", () => {
      expect(sources("あっ")).toEqual(["あ", "っ"]);
      expect(paths("あっ", 1)).toEqual(["xtu", "ltu", "xtsu", "ltsu"]);
    });
  });

  describe("撥音", () => {
    test("後続と1塊にまとめ、n 一文字の綴りも受け付ける", () => {
      expect(sources("んか")).toEqual(["んか"]);
      expect(guide("んか")).toBe("nka");
      expect(paths("んか")).toEqual(expect.arrayContaining(["nka", "nnka", "xnka", "n'ka", "nca"]));
    });

    test("な行の前では n 一文字を受け付けない", () => {
      expect(paths("んに")).not.toContain("nni");
      expect(guide("んに")).toBe("nnni");
    });

    test("母音・や行の前では n 一文字を受け付けない", () => {
      expect(paths("んあ")).not.toContain("na");
      expect(paths("んや")).not.toContain("nya");
      expect(guide("んあ")).toBe("nna");
    });

    test("後続がなければ nn を要求する", () => {
      expect(sources("ほん")).toEqual(["ほ", "ん"]);
      expect(paths("ほん", 1)).toEqual(["nn", "n'", "xn"]);
    });

    test("促音を吸収した塊の前では n 一文字を受け付ける", () => {
      expect(guide("んっか")).toBe("nkka");
    });
  });

  describe("原文との対応", () => {
    test("塊の原文を連結すると元の原文に戻る", () => {
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

// WHY NOT: 1件ずつ expect すべきだが、まとめて突き合わせるとどの読みが外れたかが差分に出る
const expectGuides = (expected: Record<string, string>) => {
  const actual = Object.fromEntries(Object.keys(expected).map((source) => [source, guide(source)]));
  expect(actual).toEqual(expected);
};

const accepts = (source: string, keys: string) => {
  let phrase = newPhrase(source, "romaji");
  for (const key of keys) {
    const struck = strike(phrase, key);
    if (!struck.isCorrect) return false;
    phrase = struck.phrase;
  }
  return phrase.isDone;
};

describe("romaji のパターン", () => {
  test("清音", () => {
    expectGuides({
      あ: "a",
      い: "i",
      う: "u",
      え: "e",
      お: "o",
      か: "ka",
      き: "ki",
      く: "ku",
      け: "ke",
      こ: "ko",
      さ: "sa",
      し: "si",
      す: "su",
      せ: "se",
      そ: "so",
      た: "ta",
      ち: "ti",
      つ: "tu",
      て: "te",
      と: "to",
      な: "na",
      に: "ni",
      ぬ: "nu",
      ね: "ne",
      の: "no",
      は: "ha",
      ひ: "hi",
      ふ: "hu",
      へ: "he",
      ほ: "ho",
      ま: "ma",
      み: "mi",
      む: "mu",
      め: "me",
      も: "mo",
      や: "ya",
      ゆ: "yu",
      よ: "yo",
      ら: "ra",
      り: "ri",
      る: "ru",
      れ: "re",
      ろ: "ro",
      わ: "wa",
      ゐ: "wi",
      ゑ: "we",
      を: "wo",
      ん: "nn",
    });
  });

  test("濁音・半濁音", () => {
    expectGuides({
      が: "ga",
      ぎ: "gi",
      ぐ: "gu",
      げ: "ge",
      ご: "go",
      ざ: "za",
      じ: "zi",
      ず: "zu",
      ぜ: "ze",
      ぞ: "zo",
      だ: "da",
      ぢ: "di",
      づ: "du",
      で: "de",
      ど: "do",
      ば: "ba",
      び: "bi",
      ぶ: "bu",
      べ: "be",
      ぼ: "bo",
      ぱ: "pa",
      ぴ: "pi",
      ぷ: "pu",
      ぺ: "pe",
      ぽ: "po",
      ゔ: "vu",
    });
  });

  test("小書き", () => {
    expectGuides({
      ぁ: "xa",
      ぃ: "xi",
      ぅ: "xu",
      ぇ: "xe",
      ぉ: "xo",
      ゃ: "xya",
      ゅ: "xyu",
      ょ: "xyo",
      っ: "xtu",
      ゎ: "xwa",
      ゕ: "xka",
      ゖ: "xke",
    });
  });

  test("拗音", () => {
    expectGuides({
      きゃ: "kya",
      きぃ: "kyi",
      きゅ: "kyu",
      きぇ: "kye",
      きょ: "kyo",
      ぎゃ: "gya",
      ぎぃ: "gyi",
      ぎゅ: "gyu",
      ぎぇ: "gye",
      ぎょ: "gyo",
      しゃ: "sya",
      しぃ: "syi",
      しゅ: "syu",
      しぇ: "sye",
      しょ: "syo",
      じゃ: "ja",
      じぃ: "zyi",
      じゅ: "ju",
      じぇ: "je",
      じょ: "jo",
      ちゃ: "tya",
      ちぃ: "tyi",
      ちゅ: "tyu",
      ちぇ: "tye",
      ちょ: "tyo",
      ぢゃ: "dya",
      ぢぃ: "dyi",
      ぢゅ: "dyu",
      ぢぇ: "dye",
      ぢょ: "dyo",
      にゃ: "nya",
      にぃ: "nyi",
      にゅ: "nyu",
      にぇ: "nye",
      にょ: "nyo",
      ひゃ: "hya",
      ひぃ: "hyi",
      ひゅ: "hyu",
      ひぇ: "hye",
      ひょ: "hyo",
      びゃ: "bya",
      びぃ: "byi",
      びゅ: "byu",
      びぇ: "bye",
      びょ: "byo",
      ぴゃ: "pya",
      ぴぃ: "pyi",
      ぴゅ: "pyu",
      ぴぇ: "pye",
      ぴょ: "pyo",
      みゃ: "mya",
      みぃ: "myi",
      みゅ: "myu",
      みぇ: "mye",
      みょ: "myo",
      りゃ: "rya",
      りぃ: "ryi",
      りゅ: "ryu",
      りぇ: "rye",
      りょ: "ryo",
    });
  });

  test("外来音", () => {
    expectGuides({
      ふぁ: "fa",
      ふぃ: "fi",
      ふぅ: "fwu",
      ふぇ: "fe",
      ふぉ: "fo",
      ふゃ: "fya",
      ふゅ: "fyu",
      ふょ: "fyo",
      ゔぁ: "va",
      ゔぃ: "vi",
      ゔぇ: "ve",
      ゔぉ: "vo",
      ゔゃ: "vya",
      ゔゅ: "vyu",
      ゔょ: "vyo",
      うぁ: "wha",
      うぃ: "wi",
      うぇ: "we",
      うぉ: "who",
      てぁ: "tha",
      てぃ: "thi",
      てゅ: "thu",
      てぇ: "the",
      てょ: "tho",
      でぁ: "dha",
      でぃ: "dhi",
      でゅ: "dhu",
      でぇ: "dhe",
      でょ: "dho",
      とぁ: "twa",
      とぃ: "twi",
      とぅ: "twu",
      とぇ: "twe",
      とぉ: "two",
      どぁ: "dwa",
      どぃ: "dwi",
      どぅ: "dwu",
      どぇ: "dwe",
      どぉ: "dwo",
      くぁ: "qa",
      くぃ: "qi",
      くぅ: "qwu",
      くぇ: "qe",
      くぉ: "qo",
      ぐぁ: "gwa",
      ぐぃ: "gwi",
      ぐぅ: "gwu",
      ぐぇ: "gwe",
      ぐぉ: "gwo",
      すぁ: "swa",
      すぃ: "swi",
      すぅ: "swu",
      すぇ: "swe",
      すぉ: "swo",
      つぁ: "tsa",
      つぃ: "tsi",
      つぇ: "tse",
      つぉ: "tso",
      いぇ: "ye",
    });
  });

  test("促音は後続の子音を重ねる", () => {
    expectGuides({
      っか: "kka",
      っさ: "ssa",
      った: "tta",
      っは: "hha",
      っま: "mma",
      っや: "yya",
      っら: "rra",
      っわ: "wwa",
      っが: "gga",
      っざ: "zza",
      っだ: "dda",
      っば: "bba",
      っぱ: "ppa",
      っゔ: "vvu",
      っきゃ: "kkya",
      っしゃ: "ssya",
      っちゃ: "ttya",
      っじゃ: "jja",
      っふぁ: "ffa",
    });
  });

  test("促音は重ねられないときだけ xtu になる", () => {
    expectGuides({
      っあ: "xtua",
      っい: "xtui",
      っう: "xtuu",
      っえ: "xtue",
      っお: "xtuo",
      っな: "xtuna",
      っに: "xtuni",
      っん: "xtunn",
      っー: "xtu-",
      あっ: "axtu",
    });
  });

  test("撥音は後続が繋がらないときだけ n 一文字で済む", () => {
    expectGuides({
      んか: "nka",
      んさ: "nsa",
      んた: "nta",
      んは: "nha",
      んま: "nma",
      んら: "nra",
      んわ: "nwa",
      んが: "nga",
      んざ: "nza",
      んだ: "nda",
      んば: "nba",
      んぱ: "npa",
      んゔ: "nvu",
      んっか: "nkka",
      んじゃ: "nja",
      んちゃ: "ntya",
      んー: "n-",
    });
  });

  test("撥音は母音・な行・や行・撥音の前で nn になる", () => {
    expectGuides({
      んあ: "nna",
      んい: "nni",
      んう: "nnu",
      んえ: "nne",
      んお: "nno",
      んな: "nnna",
      んに: "nnni",
      んぬ: "nnnu",
      んね: "nnne",
      んの: "nnno",
      んや: "nnya",
      んゆ: "nnyu",
      んよ: "nnyo",
      んにゃ: "nnnya",
      ほん: "honn",
    });
  });

  test("語", () => {
    expectGuides({
      こんにちは: "konnnitiha",
      ありがとう: "arigatou",
      がっこう: "gakkou",
      しんぶん: "sinbunn",
      きゅうきゅうしゃ: "kyuukyuusya",
      にっぽん: "nipponn",
      とうきょう: "toukyou",
      ひゃくえん: "hyakuenn",
      しゅっぱつ: "syuppatu",
      がんばって: "ganbatte",
      でんしゃ: "densya",
      きって: "kitte",
      ざっし: "zassi",
      まっちゃ: "mattya",
      びょういん: "byouinn",
      せんせい: "sensei",
      あんない: "annnai",
      たんい: "tanni",
      ほんや: "honnya",
      きんようび: "kinnyoubi",
      しんゆう: "sinnyuu",
      にんじゃ: "ninja",
      みんな: "minnna",
      てんいん: "tenninn",
      おんがく: "ongaku",
      えんぴつ: "enpitu",
      うんどう: "undou",
    });
  });

  test("外来語", () => {
    expectGuides({
      ファイル: "fairu",
      フォーク: "fo-ku",
      ウィスキー: "wisuki-",
      ジェット: "jetto",
      チェック: "tyekku",
      ティッシュ: "thissyu",
      パーティー: "pa-thi-",
      シェア: "syea",
      ヴァイオリン: "vaiorinn",
      コンピューター: "konpyu-ta-",
      ソフトウェア: "sohutowea",
      デュエット: "dhuetto",
      グァテマラ: "gwatemara",
      ヴェネツィア: "venetsia",
    });
  });

  test("記号・数字", () => {
    expectGuides({
      "ケーキ、": "ke-ki,",
      "まる。": "maru.",
      "「ねこ」": "[neko]",
      "えっ！？": "extu!?",
      "３つ": "3tu",
      "１００えん": "100enn",
      ＴＯＫＹＯ: "TOKYO",
      "なかぐろ・": "nakaguro/",
    });
  });

  test("同じ読みを別の綴りでも打てる", () => {
    const spellings: Record<string, string[]> = {
      し: ["si", "shi", "ci"],
      つ: ["tu", "tsu"],
      ち: ["ti", "chi"],
      ふ: ["hu", "fu"],
      じ: ["zi", "ji"],
      く: ["ku", "cu", "qu"],
      い: ["i", "yi"],
      う: ["u", "wu", "whu"],
      しゃ: ["sya", "sha", "sixya", "silya", "shixya", "cixya"],
      じゃ: ["ja", "zya", "jya", "zixya", "jilya"],
      ちゃ: ["tya", "cha", "cya", "tixya", "chilya"],
      きょ: ["kyo", "kixyo", "kilyo"],
      ふぁ: ["fa", "fwa", "huxa", "fula"],
      ゔぃ: ["vi", "vyi", "vuxi"],
      っこ: ["kko", "cco", "xtuko", "ltuko", "xtsuco", "ltsuco"],
      っしゃ: ["ssya", "ssha", "xtusya", "ltusha"],
      んか: ["nka", "nnka", "xnka", "n'ka", "nca", "nnca"],
      ほん: ["honn", "hon'", "hoxn"],
      にっぽん: ["nipponn", "nixtuponn", "niltupon'"],
      こんにちは: ["konnnitiha", "con'nichiha", "koxnnitiha"],
    };

    const rejected = Object.entries(spellings).flatMap(([source, keys]) =>
      keys
        .filter((spelling) => !accepts(source, spelling))
        .map((spelling) => `${source}: ${spelling}`),
    );
    expect(rejected).toEqual([]);
  });

  test("受け付けてはいけない綴り", () => {
    const spellings: Record<string, string[]> = {
      んに: ["nni"],
      んあ: ["na"],
      んや: ["nya"],
      んゆ: ["nyu"],
      んん: ["nn"],
      っな: ["nna"],
      っあ: ["aa"],
      っい: ["ii"],
      ほん: ["hon"],
      きょ: ["kiyo"],
      ふぁ: ["fua"],
      し: ["se", "sh"],
      つ: ["tsi"],
    };

    const accepted = Object.entries(spellings).flatMap(([source, keys]) =>
      keys
        .filter((spelling) => accepts(source, spelling))
        .map((spelling) => `${source}: ${spelling}`),
    );
    expect(accepted).toEqual([]);
  });
});
