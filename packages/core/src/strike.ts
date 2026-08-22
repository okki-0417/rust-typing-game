import { inputs, pending, settled, typing } from "./phrase.ts";
import type { Phrase } from "./phrase.ts";
import { isAccepted, isCompleted, newJudgement, preferred } from "./strike/judgement.ts";

export interface Strike {
  readonly phrase: Phrase;
  readonly key: string;
}

export function strike({ phrase, key }: Strike): Phrase | null {
  const chunk = pending(phrase)[0];
  if (!chunk) return null;

  const judgement = newJudgement(chunk, inputs(phrase) + key);
  if (!isAccepted(judgement)) return null;

  return isCompleted(judgement) ? settled(phrase, key) : typing(phrase, key);
}

export function remaining(phrase: Phrase): string {
  const chunks = pending(phrase);
  const chunk = chunks[0];
  if (!chunk) return "";

  const typed = inputs(phrase);
  let keys = preferred(newJudgement(chunk, typed)).slice(typed.length);
  for (let i = 1; i < chunks.length; i++) keys += preferred(newJudgement(chunks[i]!, ""));
  return keys;
}
