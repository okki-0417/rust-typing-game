import { isAccepted, isCompleted, newJudgement } from "./judgement.ts";
import { PROGRESS } from "./phrase.ts";
import type { Phrase } from "./phrase.ts";

export interface Strike {
  readonly phrase: Phrase;
  readonly key: string;
}

export function strike(strike: Strike): Phrase | null {
  const { phrase, key } = strike;

  const { chunks, index, inputs } = phrase[PROGRESS];
  const chunk = chunks[index];
  if (!chunk) return null;

  const judgement = newJudgement(chunk, inputs + key);
  if (!isAccepted(judgement)) return null;

  const settled = isCompleted(judgement);
  return {
    source: phrase.source,
    typed: phrase.typed + key,
    [PROGRESS]: {
      chunks,
      index: settled ? index + 1 : index,
      inputs: settled ? "" : inputs + key,
    },
  };
}
