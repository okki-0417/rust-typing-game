import { useEffect, useReducer } from "react";
import type { Challenge } from "../data/challenges.ts";
import { createGameState, gameReducer, START_KEY } from "../game/gameReducer.ts";
import type { GameState } from "../game/gameReducer.ts";

export function useTypingGame(challenges: readonly Challenge[], durationMs: number): GameState {
  const [state, dispatch] = useReducer(gameReducer, challenges, createGameState);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length !== 1) return;
      if (event.key === START_KEY) event.preventDefault();

      dispatch({ type: "keyPressed", key: event.key });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (state.status !== "playing") return;

    const timer = setTimeout(() => dispatch({ type: "timeUp" }), durationMs);
    return () => clearTimeout(timer);
  }, [state.status, durationMs]);

  return state;
}
