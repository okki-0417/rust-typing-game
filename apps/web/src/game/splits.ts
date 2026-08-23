import { metersRun } from "./course.ts";
import type { GameState } from "./gameReducer.ts";
import { requiredPace } from "./pace.ts";

export type Split = {
  readonly ms: number;
  readonly meters: number;
  readonly behind: boolean;
};

const SEGMENT_MS = 2_000;
const MAX_SEGMENTS = 60;

export function splits(state: GameState): readonly Split[] {
  const total = state.now - state.startedAt;
  if (total <= 0 || state.strokeTimes.length === 0) return [];

  const segments = Math.min(MAX_SEGMENTS, Math.max(1, Math.round(total / SEGMENT_MS)));
  const step = total / segments;
  const trace: Split[] = [{ ms: 0, meters: 0, behind: false }];

  for (let segment = 1; segment <= segments; segment++) {
    const ms = step * segment;
    const strokes = strokesBy(state, ms);
    const gained = strokes - strokesBy(state, ms - step);

    trace.push({
      ms,
      meters: metersRun(strokes),
      behind: gained / (step / 60_000) < requiredPace(ms - step / 2),
    });
  }

  return trace;
}

function strokesBy(state: GameState, ms: number): number {
  return state.strokeTimes.filter((at) => at - state.startedAt <= ms).length;
}
