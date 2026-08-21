import type { Mode, Step } from "./mode.ts";
import { ascii } from "./modes/ascii.ts";

export type InputResult = "hit" | "miss" | "complete";

export interface SessionOptions {
  readonly mode?: Mode;
}

export interface Session {
  readonly source: string;
  readonly typed: string;
  readonly remaining: string;
  readonly cursor: number;
  readonly done: boolean;
  input(char: string): InputResult;
  reset(): void;
}

export function createSession(source: string, options: SessionOptions = {}): Session {
  const mode = options.mode ?? ascii;
  const steps = mode(source);
  assertTypable(steps);
  const offsets = sourceOffsets(steps);

  let stepIndex = 0;
  let buffer = "";
  let typed = "";

  const survivors = (step: Step, prefix: string): readonly string[] =>
    step.candidates.filter((candidate) => candidate.startsWith(prefix));

  return {
    get source() {
      return source;
    },
    get typed() {
      return typed;
    },
    get remaining() {
      const current = steps[stepIndex];
      if (!current) return "";
      let rest = (survivors(current, buffer)[0] ?? "").slice(buffer.length);
      for (let i = stepIndex + 1; i < steps.length; i++) rest += steps[i]!.candidates[0];
      return rest;
    },
    get cursor() {
      return offsets[stepIndex]!;
    },
    get done() {
      return stepIndex >= steps.length;
    },
    input(char) {
      const current = steps[stepIndex];
      if (!current) return "miss";

      const next = buffer + char;
      const alive = survivors(current, next);
      if (alive.length === 0) return "miss";

      typed += char;
      if (alive.includes(next)) {
        stepIndex++;
        buffer = "";
        return stepIndex >= steps.length ? "complete" : "hit";
      }
      buffer = next;
      return "hit";
    },
    reset() {
      stepIndex = 0;
      buffer = "";
      typed = "";
    },
  };
}

const TYPABLE = /^[\x20-\x7e]+$/;

function assertTypable(steps: readonly Step[]): void {
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

function sourceOffsets(steps: readonly Step[]): readonly number[] {
  const offsets = [0];
  steps.forEach((step, i) => offsets.push(offsets[i]! + step.source.length));
  return offsets;
}
