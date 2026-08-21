import type { Scheme } from "../types.ts";

export const plain: Scheme = (source) =>
  Array.from(source, (char) => ({ source: char, candidates: [char] }));
