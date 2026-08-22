import type { Chunk } from "./chunk.ts";
import { interpret } from "./interpret.ts";
import type { Mode } from "./interpret.ts";
import { newJudgement, preferred } from "./judgement.ts";

// WHY NOT: 本来は private フィールドで隠すべきだが、TS はモジュールをまたぐと
// 非公開にできないため、外から名前を書けない symbol をキーにして進捗を持たせる
export const PROGRESS = Symbol("progress");

export interface Progress {
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

export function remaining(phrase: Phrase): string {
  const { chunks, index, inputs } = phrase[PROGRESS];
  const chunk = chunks[index];
  if (!chunk) return "";

  let keys = preferred(newJudgement(chunk, inputs)).slice(inputs.length);
  for (let i = index + 1; i < chunks.length; i++) keys += preferred(newJudgement(chunks[i]!, ""));
  return keys;
}

export function cursor(phrase: Phrase): number {
  const { chunks, index } = phrase[PROGRESS];

  let chars = 0;
  for (let i = 0; i < index; i++) chars += chunks[i]!.chars.length;
  return chars;
}

export function isDone(phrase: Phrase): boolean {
  const { chunks, index } = phrase[PROGRESS];

  return index >= chunks.length;
}
