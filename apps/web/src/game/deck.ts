import type { Challenge } from "../data/challenges.ts";

export type Deck = {
  stock: readonly Challenge[];
  rest: readonly Challenge[];
};

export function createDeck(stock: readonly Challenge[]): Deck {
  if (stock.length === 0) throw new TypeError("出題する文言がありません");

  return { stock, rest: [] };
}

export function draw(deck: Deck): { challenge: Challenge; deck: Deck } {
  const rest = deck.rest.length === 0 ? shuffle(deck.stock) : [...deck.rest];
  const challenge = rest.pop()!;

  return { challenge, deck: { stock: deck.stock, rest } };
}

function shuffle(stock: readonly Challenge[]): Challenge[] {
  const shuffled = [...stock];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}
