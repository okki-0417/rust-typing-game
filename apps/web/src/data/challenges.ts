import tsv from "./challenges.tsv?raw";

export type Challenge = {
  text: string;
  reading: string;
};

export function parseChallenges(tsv: string): Challenge[] {
  const challenges: Challenge[] = [];

  tsv.split("\n").forEach((line, index) => {
    if (line.trim() === "" || line.startsWith("#")) return;

    const columns = line.split("\t").map((column) => column.trim());
    if (columns.length !== 2 || columns.some((column) => column === "")) {
      throw new TypeError(`${index + 1} 行目は 文言<TAB>読み ではない: ${JSON.stringify(line)}`);
    }

    challenges.push({ text: columns[0]!, reading: columns[1]! });
  });

  return challenges;
}

export const challenges: readonly Challenge[] = parseChallenges(tsv);
