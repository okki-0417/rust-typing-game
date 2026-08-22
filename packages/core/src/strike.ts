import { isAccepted, isCompleted, newJudgement } from "./judgement.ts";
import { phraseAt } from "./phrase.ts";
import type { Phrase } from "./phrase.ts";

export interface Strike {
  readonly phrase: Phrase;
  readonly key: string;
}

export interface Struck {
  readonly phrase: Phrase;
  readonly isCorrect: boolean;
}

export function strike(strike: Strike): Struck {
  const { phrase, key } = strike;

  const chunk = phrase.chunks[phrase.index];
  if (!chunk) return { phrase, isCorrect: false };

  const inputs = phrase.inputs + key;
  const judgement = newJudgement(chunk, inputs);
  if (!isAccepted(judgement)) return { phrase, isCorrect: false };

  const settled = isCompleted(judgement);
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
