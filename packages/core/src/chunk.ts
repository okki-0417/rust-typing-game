export interface Chunk {
  readonly chars: string;
  readonly paths: readonly string[];
}

export function newChunk(chars: string, paths: readonly string[]): Chunk {
  return { chars, paths };
}
