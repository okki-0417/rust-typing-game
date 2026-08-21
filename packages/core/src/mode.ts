export interface Step {
  readonly source: string;
  readonly candidates: readonly string[];
}

export type Mode = (source: string) => readonly Step[];
