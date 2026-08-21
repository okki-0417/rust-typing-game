import { newChunk } from "../../mode.ts";
import type { Chunk, Mode } from "../../mode.ts";
import {
  ABSORBS_SINGLE_N,
  DIGRAPHS,
  DOUBLABLE,
  HATSUON_SPELLINGS,
  MONOGRAPHS,
  normalize,
  PUNCTUATION,
  SOKUON_SPELLINGS,
} from "./spellings.ts";

const SOKUON = "っ";
const HATSUON = "ん";

export const romaji: Mode = (source) => {
  const reading = normalize(source);
  const chunks: Chunk[] = [];

  for (let i = reading.length; i > 0;) {
    const length = i >= 2 && reading.slice(i - 2, i) in DIGRAPHS ? 2 : 1;
    const kana = reading.slice(i - length, i);
    const original = source.slice(i - length, i);
    const following = chunks[0];

    if (kana === SOKUON && following) {
      chunks[0] = newChunk(original + following.source, geminate(following.candidates));
    } else if (kana === HATSUON && following) {
      chunks[0] = newChunk(original + following.source, nasalize(following.candidates));
    } else {
      chunks.unshift(newChunk(original, spell(kana)));
    }
    i -= length;
  }

  return chunks;
};

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

function orderCandidates(candidates: readonly string[]): string[] {
  return [...new Set(candidates)].sort((a, b) => a.length - b.length);
}

// WHY NOT: 本来は最短の綴りをそのまま推奨すべきだが、「っい」の yyi のように
// 短くても誰も打たない綴りが先頭に来るため、後続の塊の推奨に繋がる綴りを推す
function recommend(recommended: string, candidates: string[]): string[] {
  return [recommended, ...candidates.filter((candidate) => candidate !== recommended)];
}
