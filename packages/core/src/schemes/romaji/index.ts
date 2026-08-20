import type { Scheme, Unit } from "../../types.ts";
import {
  ABSORBS_SINGLE_N,
  DIGRAPHS,
  DOUBLABLE,
  HATSUON_SPELLINGS,
  MONOGRAPHS,
  orderCandidates,
  PUNCTUATION,
  SOKUON_SPELLINGS,
  toHiragana,
} from "./table.ts";

const SOKUON = "っ";
const HATSUON = "ん";

/**
 * ローマ字入力。かなを打鍵単位へ展開する。
 *
 * 「っ」「ん」は綴りが後続に依存するため、後ろから畳んで後続の単位に吸収させる。
 * これで実行時に単位をまたいだ制約が残らず、判定は前方一致だけで済む。
 * 表にないかな・英数字・記号はその文字自体を打つ単位になるので、
 * 日本語と英数字が混ざった原文もそのまま扱える。
 */
export const romaji: Scheme = (source) => {
  const kana = toHiragana(source);
  const chunks = chunk(kana);
  const units: Unit[] = [];

  for (let i = chunks.length - 1; i >= 0; i--) {
    const { start, length, text } = chunks[i]!;
    const original = source.slice(start, start + length);
    const following = units[0];

    if (text === SOKUON && following) {
      units[0] = {
        source: original + following.source,
        candidates: geminate(following.candidates),
      };
    } else if (text === HATSUON && following) {
      units[0] = {
        source: original + following.source,
        candidates: nasalize(following.candidates),
      };
    } else {
      units.unshift({ source: original, candidates: spell(text) });
    }
  }

  return units;
};

/** かな列を 1〜2 文字の塊に切る。2 文字になるのは融合した綴りを持つ組み合わせだけ。 */
function chunk(kana: string): { start: number; length: number; text: string }[] {
  const chunks: { start: number; length: number; text: string }[] = [];
  for (let i = 0; i < kana.length;) {
    const pair = kana.slice(i, i + 2);
    const length = pair.length === 2 && pair in DIGRAPHS ? 2 : 1;
    chunks.push({ start: i, length, text: kana.slice(i, i + length) });
    i += length;
  }
  return chunks;
}

function spell(text: string): readonly string[] {
  if (text.length === 2) {
    const base = MONOGRAPHS[text[0]!] ?? [];
    const small = MONOGRAPHS[text[1]!] ?? [];
    const stepwise = base.flatMap((head) => small.map((tail) => head + tail));
    return orderCandidates([...(DIGRAPHS[text] ?? []), ...stepwise]);
  }
  return orderCandidates(MONOGRAPHS[text] ?? PUNCTUATION[text] ?? [text]);
}

/** 「っ」を後続に吸収させる。子音重ねと、xtu 等を前置した綴りの両方を残す。 */
function geminate(following: readonly string[]): readonly string[] {
  const doubled = following.filter((c) => DOUBLABLE.test(c)).map((c) => c[0]! + c);
  const prefixed = SOKUON_SPELLINGS.flatMap((prefix) => following.map((c) => prefix + c));
  return orderCandidates([...doubled, ...prefixed]);
}

/** 「ん」を後続に吸収させる。n 一文字で済むかは後続の綴り次第。 */
function nasalize(following: readonly string[]): readonly string[] {
  const single = following.filter((c) => !ABSORBS_SINGLE_N.test(c)).map((c) => "n" + c);
  const prefixed = HATSUON_SPELLINGS.flatMap((prefix) => following.map((c) => prefix + c));
  return orderCandidates([...single, ...prefixed]);
}
