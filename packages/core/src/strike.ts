import { isAccepted, isCompleted, newJudgement } from "./judgement.ts";
import { newPhraseAt, PROGRESS } from "./phrase.ts";
import type { Phrase } from "./phrase.ts";

export interface Strike {
  readonly phrase: Phrase;
  readonly key: string;
}

export function strike(strike: Strike): Phrase | null {
  const { phrase, key } = strike;

  const progress = phrase[PROGRESS];
  const chunk = progress.chunks[progress.index];
  if (!chunk) return null;

  const inputs = progress.inputs + key;
  const judgement = newJudgement(chunk, inputs);
  if (!isAccepted(judgement)) return null;

  const settled = isCompleted(judgement);
  return newPhraseAt({
    ...progress,
    index: settled ? progress.index + 1 : progress.index,
    inputs: settled ? "" : inputs,
    typed: progress.typed + key,
  });
}
