import type { Chunk } from "./chunk.ts";
import { interpret } from "./interpret.ts";
import type { Mode } from "./interpret.ts";
import { newJudgement, preferred } from "./judgement.ts";

// WHY NOT: 本来は private フィールドで隠すべきだが、TS はモジュールをまたぐと
// 非公開にできないため、外から名前を書けない symbol をキーにして進捗を持たせる
export const PROGRESS = Symbol("progress");

export interface Progress {
  readonly source: string;
  readonly chunks: readonly Chunk[];
  readonly index: number;
  readonly inputs: string;
  readonly typed: string;
}

export interface Phrase {
  readonly source: string;
  readonly typed: string;
  readonly remaining: string;
  readonly cursor: number;
  readonly isDone: boolean;
  readonly [PROGRESS]: Progress;
}

export function newPhrase(source: string, mode: Mode = "ascii"): Phrase {
  const chunks = interpret(source, mode);

  return newPhraseAt({ source, chunks, index: 0, inputs: "", typed: "" });
}

export function newPhraseAt(progress: Progress): Phrase {
  const { source, chunks, index, inputs, typed } = progress;

  return {
    source,
    typed,
    remaining: remainingKeys(chunks, index, inputs),
    cursor: sourceCursor(chunks, index),
    isDone: index >= chunks.length,
    [PROGRESS]: progress,
  };
}

function remainingKeys(chunks: readonly Chunk[], index: number, inputs: string): string {
  const chunk = chunks[index];
  if (!chunk) return "";

  let keys = preferred(newJudgement(chunk, inputs)).slice(inputs.length);
  for (let i = index + 1; i < chunks.length; i++) keys += preferred(newJudgement(chunks[i]!, ""));
  return keys;
}

function sourceCursor(chunks: readonly Chunk[], index: number): number {
  let cursor = 0;
  for (let i = 0; i < index; i++) cursor += chunks[i]!.chars.length;
  return cursor;
}
