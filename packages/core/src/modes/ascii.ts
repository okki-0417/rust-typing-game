import type { Mode } from "../mode.ts";

export const ascii: Mode = (source) =>
  Array.from(source, (char) => ({ source: char, candidates: [char] }));
