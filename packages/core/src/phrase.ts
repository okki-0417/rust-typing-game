import { isAccepted, isCompleted, preferred } from "./chunk.ts";
import type { Chunk } from "./chunk.ts";
import { interpret } from "./mode.ts";
import type { Mode } from "./mode.ts";

export interface Phrase {
  readonly source: string;
  readonly typed: string;
  readonly remaining: string;
  readonly cursor: number;
  readonly isDone: boolean;
  readonly chunks: readonly Chunk[];
  readonly index: number;
  readonly inputs: string;
}

export interface Struck {
  readonly phrase: Phrase;
  readonly isCorrect: boolean;
}

type Progress = Pick<Phrase, "source" | "chunks" | "index" | "inputs" | "typed">;

export function newPhrase(source: string, mode: Mode = "ascii"): Phrase {
  const chunks = interpret(source, mode);
  return phraseAt({ source, chunks, index: 0, inputs: "", typed: "" });
}

export function strike(phrase: Phrase, key: string): Struck {
  const chunk = phrase.chunks[phrase.index];
  if (!chunk) return { phrase, isCorrect: false };

  const inputs = phrase.inputs + key;
  if (!isAccepted(chunk, inputs)) return { phrase, isCorrect: false };

  const settled = isCompleted(chunk, inputs);
  return {
    phrase: phraseAt({
      source: phrase.source,
      chunks: phrase.chunks,
      index: settled ? phrase.index + 1 : phrase.index,
      inputs: settled ? "" : inputs,
      typed: phrase.typed + key,
    }),
    isCorrect: true,
  };
}

function phraseAt(progress: Progress): Phrase {
  const { chunks, index, inputs } = progress;
  return {
    ...progress,
    remaining: remainingKeys(chunks, index, inputs),
    cursor: sourceCursor(chunks, index),
    isDone: index >= chunks.length,
  };
}

function remainingKeys(chunks: readonly Chunk[], index: number, inputs: string): string {
  const chunk = chunks[index];
  if (!chunk) return "";
  let keys = preferred(chunk, inputs).slice(inputs.length);
  for (let i = index + 1; i < chunks.length; i++) keys += preferred(chunks[i]!);
  return keys;
}

function sourceCursor(chunks: readonly Chunk[], index: number): number {
  let cursor = 0;
  for (let i = 0; i < index; i++) cursor += chunks[i]!.chars.length;
  return cursor;
}
