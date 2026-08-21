import type { Challenge } from "./challenges.ts";

export function createDeck(challenges: readonly Challenge[]): () => Challenge {
  if (challenges.length === 0) throw new TypeError("出題する文言がありません");

  let queue: Challenge[] = [];

  return () => {
    if (queue.length === 0) queue = shuffle(challenges);
    return queue.pop()!;
  };
}

function shuffle(challenges: readonly Challenge[]): Challenge[] {
  const shuffled = [...challenges];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}
