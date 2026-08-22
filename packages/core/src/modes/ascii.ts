import { newChunk } from "../chunk.ts";
import type { Chunk } from "../chunk.ts";

export const ascii = (source: string): readonly Chunk[] =>
  Array.from(source, (char) => newChunk(char, [char]));
