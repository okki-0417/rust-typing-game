import type { Chunk } from "./chunk.ts";

export type Mode = (source: string) => readonly Chunk[];
