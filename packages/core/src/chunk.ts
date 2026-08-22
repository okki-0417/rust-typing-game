export interface Chunk {
  readonly chars: string;
  readonly paths: readonly string[];
}

export function newChunk(chars: string, paths: readonly string[]): Chunk {
  return { chars, paths };
}

export function isAccepted(chunk: Chunk, inputs: string): boolean {
  return chunk.paths.some((path) => path.startsWith(inputs));
}

export function isCompleted(chunk: Chunk, inputs: string): boolean {
  return chunk.paths.includes(inputs);
}

export function preferred(chunk: Chunk, inputs = ""): string {
  return chunk.paths.find((path) => path.startsWith(inputs)) ?? "";
}
