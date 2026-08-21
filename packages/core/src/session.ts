import { plain } from "./schemes/plain.ts";
import type { InputResult, Scheme, Unit } from "./types.ts";

export interface SessionOptions {
  readonly scheme?: Scheme;
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
  const scheme = options.scheme ?? plain;
  const units = scheme(source);
  assertTypable(units);
  const offsets = sourceOffsets(units);

  let unitIndex = 0;
  let buffer = "";
  let typed = "";

  const survivors = (unit: Unit, prefix: string): readonly string[] =>
    unit.candidates.filter((candidate) => candidate.startsWith(prefix));

  return {
    get source() {
      return source;
    },
    get typed() {
      return typed;
    },
    get remaining() {
      const current = units[unitIndex];
      if (!current) return "";
      let rest = (survivors(current, buffer)[0] ?? "").slice(buffer.length);
      for (let i = unitIndex + 1; i < units.length; i++) rest += units[i]!.candidates[0];
      return rest;
    },
    get cursor() {
      return offsets[unitIndex]!;
    },
    get done() {
      return unitIndex >= units.length;
    },
    input(char) {
      const current = units[unitIndex];
      if (!current) return "miss";

      const next = buffer + char;
      const alive = survivors(current, next);
      if (alive.length === 0) return "miss";

      typed += char;
      if (alive.includes(next)) {
        unitIndex++;
        buffer = "";
        return unitIndex >= units.length ? "complete" : "hit";
      }
      buffer = next;
      return "hit";
    },
    reset() {
      unitIndex = 0;
      buffer = "";
      typed = "";
    },
  };
}

const TYPABLE = /^[\x20-\x7e]+$/;

function assertTypable(units: readonly Unit[]): void {
  units.forEach((unit, i) => {
    const where = `Unit[${i}] ${JSON.stringify(unit.source)}`;
    if (unit.candidates.length === 0) throw new TypeError(`${where} has no candidates`);
    for (const candidate of unit.candidates) {
      if (!TYPABLE.test(candidate)) {
        throw new TypeError(`${where} has an untypable candidate ${JSON.stringify(candidate)}`);
      }
    }
  });
}

function sourceOffsets(units: readonly Unit[]): readonly number[] {
  const offsets = [0];
  units.forEach((unit, i) => offsets.push(offsets[i]! + unit.source.length));
  return offsets;
}
