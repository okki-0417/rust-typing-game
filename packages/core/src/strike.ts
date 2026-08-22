import { PROGRESS } from "./phrase.ts";
import type { Phrase } from "./phrase.ts";
import { isAccepted, isCompleted, newJudgement, preferred } from "./strike/judgement.ts";

export interface Strike {
  readonly phrase: Phrase;
  readonly key: string;
}

export function strike({ phrase, key }: Strike): Phrase | null {
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

export function remaining(phrase: Phrase): string {
  const { chunks, index, inputs } = phrase[PROGRESS];
  const chunk = chunks[index];
  if (!chunk) return "";

  let keys = preferred(newJudgement(chunk, inputs)).slice(inputs.length);
  for (let i = index + 1; i < chunks.length; i++) keys += preferred(newJudgement(chunks[i]!, ""));
  return keys;
}
