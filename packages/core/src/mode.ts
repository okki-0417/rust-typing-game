export interface Chunk {
  readonly chars: string;
  readonly paths: readonly string[];
}

export type Mode = (source: string) => readonly Chunk[];

export function newChunk(chars: string, paths: readonly string[]): Chunk {
  return { chars, paths };
}

export function accepts(chunk: Chunk, pending: string): boolean {
  return chunk.paths.some((path) => path.startsWith(pending));
}

export function completes(chunk: Chunk, pending: string): boolean {
  return chunk.paths.includes(pending);
}

export function preferred(chunk: Chunk, pending = ""): string {
  return chunk.paths.find((path) => path.startsWith(pending)) ?? "";
}

const TYPABLE = /^[\x20-\x7e]+$/;

export function assertTypable(chunks: readonly Chunk[]): void {
  chunks.forEach((chunk, i) => {
    const where = `Chunk[${i}] ${JSON.stringify(chunk.chars)}`;
    if (chunk.paths.length === 0) throw new TypeError(`${where} has no paths`);
    for (const path of chunk.paths) {
      if (!TYPABLE.test(path)) {
        throw new TypeError(`${where} has an untypable path ${JSON.stringify(path)}`);
      }
    }
  });
}
