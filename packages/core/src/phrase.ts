import type { Chunk } from "./chunk.ts";
import { interpret } from "./interpret.ts";
import type { Mode } from "./interpret.ts";
import { preferred } from "./judgement.ts";

export interface Progress {
  readonly source: string;
  readonly chunks: readonly Chunk[];
  readonly index: number;
  readonly inputs: string;
  readonly typed: string;
}

export interface Phrase extends Progress {
  readonly remaining: string;
  readonly cursor: number;
  readonly isDone: boolean;
}

export function newPhrase(source: string, mode: Mode = "ascii"): Phrase {
  const chunks = interpret(source, mode);

  return phraseAt({ source, chunks, index: 0, inputs: "", typed: "" });
}

export function phraseAt(progress: Progress): Phrase {
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

  let keys = preferred({ chunk, inputs }).slice(inputs.length);
  for (let i = index + 1; i < chunks.length; i++)
    keys += preferred({ chunk: chunks[i]!, inputs: "" });
  return keys;
}

function sourceCursor(chunks: readonly Chunk[], index: number): number {
  let cursor = 0;
  for (let i = 0; i < index; i++) cursor += chunks[i]!.chars.length;
  return cursor;
}
