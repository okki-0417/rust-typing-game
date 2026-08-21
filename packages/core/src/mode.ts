export interface Step {
  readonly source: string;
  readonly candidates: readonly string[];
}

export type Mode = (source: string) => readonly Step[];

export function newStep(source: string, candidates: readonly string[]): Step {
  return { source, candidates };
}

export function survivingCandidates(step: Step, pending: string): readonly string[] {
  return step.candidates.filter((candidate) => candidate.startsWith(pending));
}

export function recommended(step: Step): string {
  return step.candidates[0] ?? "";
}

const TYPABLE = /^[\x20-\x7e]+$/;

export function assertTypable(steps: readonly Step[]): void {
  steps.forEach((step, i) => {
    const where = `Step[${i}] ${JSON.stringify(step.source)}`;
    if (step.candidates.length === 0) throw new TypeError(`${where} has no candidates`);
    for (const candidate of step.candidates) {
      if (!TYPABLE.test(candidate)) {
        throw new TypeError(`${where} has an untypable candidate ${JSON.stringify(candidate)}`);
      }
    }
  });
}
