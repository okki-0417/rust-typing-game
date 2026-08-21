import { assertTypable, recommended, survivingCandidates } from "./mode.ts";
import type { Chunk, Mode } from "./mode.ts";
import { ascii } from "./modes/ascii.ts";

export interface Phrase {
  readonly source: string;
  readonly typed: string;
  readonly remaining: string;
  readonly cursor: number;
  readonly done: boolean;
  readonly chunks: readonly Chunk[];
  readonly index: number;
  readonly pending: string;
}

export interface Struck {
  readonly phrase: Phrase;
  readonly correct: boolean;
}

type Progress = Pick<Phrase, "source" | "chunks" | "index" | "pending" | "typed">;

export function newPhrase(source: string, mode: Mode = ascii): Phrase {
  const chunks = mode(source);
  assertTypable(chunks);
  return phraseAt({ source, chunks, index: 0, pending: "", typed: "" });
}

export function strike(phrase: Phrase, key: string): Struck {
  const chunk = phrase.chunks[phrase.index];
  if (!chunk) return { phrase, correct: false };

  const pending = phrase.pending + key;
  const alive = survivingCandidates(chunk, pending);
  if (alive.length === 0) return { phrase, correct: false };

  const settled = alive.includes(pending);
  return {
    phrase: phraseAt({
      source: phrase.source,
      chunks: phrase.chunks,
      index: settled ? phrase.index + 1 : phrase.index,
      pending: settled ? "" : pending,
      typed: phrase.typed + key,
    }),
    correct: true,
  };
}

function phraseAt(progress: Progress): Phrase {
  const { chunks, index, pending } = progress;
  return {
    ...progress,
    remaining: remainingKeys(chunks, index, pending),
    cursor: sourceCursor(chunks, index),
    done: index >= chunks.length,
  };
}

function remainingKeys(chunks: readonly Chunk[], index: number, pending: string): string {
  const chunk = chunks[index];
  if (!chunk) return "";
  let keys = (survivingCandidates(chunk, pending)[0] ?? "").slice(pending.length);
  for (let i = index + 1; i < chunks.length; i++) keys += recommended(chunks[i]!);
  return keys;
}

function sourceCursor(chunks: readonly Chunk[], index: number): number {
  let cursor = 0;
  for (let i = 0; i < index; i++) cursor += chunks[i]!.source.length;
  return cursor;
}
