export interface Chunk {
  readonly source: string;
  readonly candidates: readonly string[];
}

export type Mode = (source: string) => readonly Chunk[];

export function newChunk(source: string, candidates: readonly string[]): Chunk {
  return { source, candidates };
}

export function survivingCandidates(chunk: Chunk, pending: string): readonly string[] {
  return chunk.candidates.filter((candidate) => candidate.startsWith(pending));
}

export function recommended(chunk: Chunk): string {
  return chunk.candidates[0] ?? "";
}

const TYPABLE = /^[\x20-\x7e]+$/;

export function assertTypable(chunks: readonly Chunk[]): void {
  chunks.forEach((chunk, i) => {
    const where = `Chunk[${i}] ${JSON.stringify(chunk.source)}`;
    if (chunk.candidates.length === 0) throw new TypeError(`${where} has no candidates`);
    for (const candidate of chunk.candidates) {
      if (!TYPABLE.test(candidate)) {
        throw new TypeError(`${where} has an untypable candidate ${JSON.stringify(candidate)}`);
      }
    }
  });
}
