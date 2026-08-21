export interface Unit {
  readonly source: string;
  readonly candidates: readonly string[];
}

export type InputResult = "hit" | "miss" | "complete";

export type Scheme = (source: string) => readonly Unit[];
