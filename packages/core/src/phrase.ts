import type { Chunk } from "./chunk.ts";
import { interpret } from "./interpret.ts";
import type { Mode } from "./interpret.ts";
import { isAccepted, isCompleted, newJudgement, preferred } from "./judgement.ts";

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

export interface Struck {
  readonly phrase: Phrase;
  readonly isCorrect: boolean;
}

export function newPhrase(source: string, mode: Mode = "ascii"): Phrase {
  const chunks = interpret(source, mode);

  return phraseAt({ source, chunks, index: 0, inputs: "", typed: "" });
}

export function strike(phrase: Phrase, key: string): Struck {
  const progress = phrase[PROGRESS];
  const chunk = progress.chunks[progress.index];
  if (!chunk) return { phrase, isCorrect: false };

  const inputs = progress.inputs + key;
  const judgement = newJudgement(chunk, inputs);
  if (!isAccepted(judgement)) return { phrase, isCorrect: false };

  const settled = isCompleted(judgement);
  return {
    phrase: phraseAt({
      ...progress,
      index: settled ? progress.index + 1 : progress.index,
      inputs: settled ? "" : inputs,
      typed: progress.typed + key,
    }),
    isCorrect: true,
  };
}

function phraseAt(progress: Progress): Phrase {
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
