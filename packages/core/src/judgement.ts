import type { Chunk } from "./chunk.ts";

export interface Judgement {
  readonly chunk: Chunk;
  readonly inputs: string;
}

export function isAccepted(judgement: Judgement): boolean {
  const { chunk, inputs } = judgement;
  return chunk.paths.some((path) => path.startsWith(inputs));
}

export function isCompleted(judgement: Judgement): boolean {
  const { chunk, inputs } = judgement;
  return chunk.paths.includes(inputs);
}

export function preferred(judgement: Judgement): string {
  const { chunk, inputs } = judgement;
  return chunk.paths.find((path) => path.startsWith(inputs)) ?? "";
}
