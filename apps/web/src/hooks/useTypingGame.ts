import { useEffect, useReducer } from "react";
import type { Challenge } from "../data/challenges.ts";
import { createGameState, gameReducer, START_KEY } from "../game/gameReducer.ts";
import type { GameState } from "../game/gameReducer.ts";

const TICK_MS = 100;

export function useTypingGame(challenges: readonly Challenge[]): GameState {
  const [state, dispatch] = useReducer(gameReducer, challenges, createGameState);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length !== 1) return;
      if (event.key === START_KEY) event.preventDefault();

      dispatch({ type: "keyPressed", key: event.key, at: Date.now() });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (state.status !== "playing") return;

    const ticking = setInterval(() => dispatch({ type: "tick", at: Date.now() }), TICK_MS);
    return () => clearInterval(ticking);
  }, [state.status]);

  return state;
}
