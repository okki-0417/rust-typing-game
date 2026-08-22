import type { Chunk } from "./chunk.ts";
import { ascii } from "./interpret/ascii.ts";
import { romaji } from "./interpret/romaji/index.ts";

type Interpret = (source: string) => readonly Chunk[];

const MODES = { ascii, romaji } satisfies Record<string, Interpret>;

export type Mode = keyof typeof MODES;

export function interpret(source: string, mode: Mode): readonly Chunk[] {
  const chunks = MODES[mode](source);
  assertTypable(mode, chunks);
  return chunks;
}

const TYPABLE = /^[\x20-\x7e]+$/;

function assertTypable(mode: Mode, chunks: readonly Chunk[]): void {
  for (const chunk of chunks) {
    const where = `${mode} cannot type ${JSON.stringify(chunk.chars)}`;
    if (chunk.paths.length === 0) throw new TypeError(`${where}: no path`);
    for (const path of chunk.paths) {
      if (!TYPABLE.test(path)) {
        throw new TypeError(`${where}: untypable path ${JSON.stringify(path)}`);
      }
    }
  }
}
