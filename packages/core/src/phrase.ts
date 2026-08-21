import { assertTypable, recommended, survivingCandidates } from "./mode.ts";
import type { Mode, Step } from "./mode.ts";
import { ascii } from "./modes/ascii.ts";

export interface Phrase {
  readonly source: string;
  readonly typed: string;
  readonly remaining: string;
  readonly cursor: number;
  readonly done: boolean;
  readonly steps: readonly Step[];
  readonly index: number;
  readonly pending: string;
}

export interface Struck {
  readonly phrase: Phrase;
  readonly correct: boolean;
}

type Progress = Pick<Phrase, "source" | "steps" | "index" | "pending" | "typed">;

export function newPhrase(source: string, mode: Mode = ascii): Phrase {
  const steps = mode(source);
  assertTypable(steps);
  return phraseAt({ source, steps, index: 0, pending: "", typed: "" });
}

export function strike(phrase: Phrase, key: string): Struck {
  const step = phrase.steps[phrase.index];
  if (!step) return { phrase, correct: false };

  const pending = phrase.pending + key;
  const alive = survivingCandidates(step, pending);
  if (alive.length === 0) return { phrase, correct: false };

  const settled = alive.includes(pending);
  return {
    phrase: phraseAt({
      source: phrase.source,
      steps: phrase.steps,
      index: settled ? phrase.index + 1 : phrase.index,
      pending: settled ? "" : pending,
      typed: phrase.typed + key,
    }),
    correct: true,
  };
}

function phraseAt(progress: Progress): Phrase {
  const { steps, index, pending } = progress;
  return {
    ...progress,
    remaining: remainingKeys(steps, index, pending),
    cursor: sourceCursor(steps, index),
    done: index >= steps.length,
  };
}

function remainingKeys(steps: readonly Step[], index: number, pending: string): string {
  const step = steps[index];
  if (!step) return "";
  let keys = (survivingCandidates(step, pending)[0] ?? "").slice(pending.length);
  for (let i = index + 1; i < steps.length; i++) keys += recommended(steps[i]!);
  return keys;
}

function sourceCursor(steps: readonly Step[], index: number): number {
  let cursor = 0;
  for (let i = 0; i < index; i++) cursor += steps[i]!.source.length;
  return cursor;
}
