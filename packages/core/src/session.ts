import { plain } from "./schemes/plain.ts";
import type { InputResult, Scheme, Unit } from "./types.ts";

export interface SessionOptions {
  /** 入力方式。既定は {@link plain}。 */
  readonly scheme?: Scheme;
}

/** 原文ひとつ分の打鍵の進行状態。 */
export interface Session {
  /** 打つ対象の原文。 */
  readonly source: string;
  /** これまでに受理された打鍵列。 */
  readonly typed: string;
  /** 打ち切るまでに必要な打鍵列（推奨経路）。入力に応じて変化する。 */
  readonly remaining: string;
  /** 確定した原文の文字数。`source.slice(0, cursor)` が打ち終わった部分。 */
  readonly cursor: number;
  /** 原文を打ち切ったか。 */
  readonly done: boolean;
  /**
   * 1文字を入力する。受理されなかった場合、状態は一切変化しない。
   * 打ち切ったあとの入力は常に `"miss"`。
   */
  input(char: string): InputResult;
  /** 打鍵前の状態に戻す。単位列は組み立て直さない。 */
  reset(): void;
}

export function createSession(source: string, options: SessionOptions = {}): Session {
  const scheme = options.scheme ?? plain;
  const units = scheme(source);
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

/** 単位 i までに確定する原文の文字数。最後の要素は原文全体の長さになる。 */
function sourceOffsets(units: readonly Unit[]): readonly number[] {
  const offsets = [0];
  units.forEach((unit, i) => {
    if (unit.candidates.length === 0 || unit.candidates.some((c) => c.length === 0)) {
      throw new TypeError(`Unit[${i}] must have at least one non-empty candidate`);
    }
    offsets.push(offsets[i]! + unit.source.length);
  });
  return offsets;
}
