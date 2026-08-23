export type Checkpoint = {
  readonly meters: number;
  readonly name: string;
};

const METERS_PER_STROKE = 55;

const COURSE: readonly Checkpoint[] = [
  { meters: 1_000, name: "準備運動" },
  { meters: 5_000, name: "散歩" },
  { meters: 10_000, name: "ジョギング" },
  { meters: 21_097, name: "ハーフ" },
  { meters: 30_000, name: "30km の壁" },
  { meters: 42_195, name: "フルマラソン" },
  { meters: 60_000, name: "ウルトラ" },
  { meters: 100_000, name: "100km" },
];

export function metersRun(strokes: number): number {
  return strokes * METERS_PER_STROKE;
}

export function passed(meters: number): Checkpoint | undefined {
  return COURSE.findLast((checkpoint) => meters >= checkpoint.meters);
}

export function ahead(meters: number): Checkpoint | undefined {
  return COURSE.find((checkpoint) => meters < checkpoint.meters);
}

export function crossed(from: number, to: number): Checkpoint | undefined {
  return COURSE.find((checkpoint) => from < checkpoint.meters && to >= checkpoint.meters);
}
