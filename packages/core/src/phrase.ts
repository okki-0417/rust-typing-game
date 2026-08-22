import type { Chunk } from "./chunk.ts";
import { interpret } from "./phrase/interpret.ts";
import type { Mode } from "./phrase/interpret.ts";

export type { Mode };

// WHY NOT: 本来は private フィールドで隠すべきだが、TS はモジュールをまたぐと
// 非公開にできないため、外から名前を書けない symbol をキーにして進捗を持たせる
const PROGRESS = Symbol("progress");

interface Progress {
  readonly chunks: readonly Chunk[];
  readonly index: number;
  readonly inputs: string;
}

export interface Phrase {
  readonly source: string;
  readonly typed: string;
  readonly [PROGRESS]: Progress;
}

export function newPhrase(source: string, mode: Mode = "ascii"): Phrase {
  const chunks = interpret(source, mode);

  return { source, typed: "", [PROGRESS]: { chunks, index: 0, inputs: "" } };
}

export function newTypingPhrase(phrase: Phrase, key: string): Phrase {
  const { chunks, index, inputs } = phrase[PROGRESS];

  return newPhraseFrom(phrase, key, { chunks, index, inputs: inputs + key });
}

export function newSettledPhrase(phrase: Phrase, key: string): Phrase {
  const { chunks, index } = phrase[PROGRESS];

  return newPhraseFrom(phrase, key, { chunks, index: index + 1, inputs: "" });
}

function newPhraseFrom(phrase: Phrase, key: string, progress: Progress): Phrase {
  return { source: phrase.source, typed: phrase.typed + key, [PROGRESS]: progress };
}

export function pending(phrase: Phrase): readonly Chunk[] {
  const { chunks, index } = phrase[PROGRESS];

  return chunks.slice(index);
}

export function inputs(phrase: Phrase): string {
  return phrase[PROGRESS].inputs;
}

export function cursor(phrase: Phrase): number {
  const { chunks, index } = phrase[PROGRESS];

  let chars = 0;
  for (let i = 0; i < index; i++) chars += chunks[i]!.chars.length;
  return chars;
}

export function isDone(phrase: Phrase): boolean {
  return pending(phrase).length === 0;
}
