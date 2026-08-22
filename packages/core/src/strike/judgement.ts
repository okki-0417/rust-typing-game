import type { Chunk } from "../phrase.ts";

export interface Judgement {
  readonly inputs: string;
  readonly surviving: readonly string[];
}

export function newJudgement(chunk: Chunk, inputs: string): Judgement {
  return { inputs, surviving: chunk.paths.filter((path) => path.startsWith(inputs)) };
}

export function isAccepted(judgement: Judgement): boolean {
  return judgement.surviving.length > 0;
}

export function isCompleted(judgement: Judgement): boolean {
  return judgement.surviving.includes(judgement.inputs);
}

export function preferred(judgement: Judgement): string {
  return judgement.surviving[0] ?? "";
}
