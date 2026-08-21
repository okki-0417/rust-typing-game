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
  normalize,
} from "./table.ts";

const SOKUON = "っ";
const HATSUON = "ん";

export const romaji: Scheme = (source) => {
  const units: Unit[] = [];

  for (const { start, length, text } of chunk(normalize(source)).reverse()) {
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

function geminate(following: readonly string[]): readonly string[] {
  const doubled = following.filter((c) => DOUBLABLE.test(c)).map((c) => c[0]! + c);
  const prefixed = SOKUON_SPELLINGS.flatMap((prefix) => following.map((c) => prefix + c));
  const head = following[0]!;
  const recommended = DOUBLABLE.test(head) ? head[0]! + head : SOKUON_SPELLINGS[0] + head;
  return recommend(recommended, orderCandidates([...doubled, ...prefixed]));
}

function nasalize(following: readonly string[]): readonly string[] {
  const single = following.filter((c) => !ABSORBS_SINGLE_N.test(c)).map((c) => "n" + c);
  const prefixed = HATSUON_SPELLINGS.flatMap((prefix) => following.map((c) => prefix + c));
  const head = following[0]!;
  const recommended = ABSORBS_SINGLE_N.test(head) ? HATSUON_SPELLINGS[0] + head : "n" + head;
  return recommend(recommended, orderCandidates([...single, ...prefixed]));
}

// WHY NOT: 本来は最短の綴りをそのまま推奨すべきだが、「っい」の yyi のように
// 短くても誰も打たない綴りが先頭に来るため、後続の単位の推奨に繋がる綴りを推す
function recommend(recommended: string, candidates: string[]): string[] {
  return [recommended, ...candidates.filter((candidate) => candidate !== recommended)];
}
