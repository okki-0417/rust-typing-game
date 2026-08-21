import { newStep } from "../mode.ts";
import type { Mode } from "../mode.ts";

export const ascii: Mode = (source) => Array.from(source, (char) => newStep(char, [char]));
