import "./style.css";
import { challenges } from "./challenges.ts";
import { createGame } from "./game.ts";
import { createView } from "./view.ts";

const DURATION_MS = 60_000;

const root = document.querySelector<HTMLDivElement>("#app")!;
const view = createView(root);
const game = createGame({ challenges, durationMs: DURATION_MS });

window.addEventListener("keydown", (event) => {
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.key === " ") {
    event.preventDefault();
    if (game.phase !== "playing") {
      if (game.phase === "finished") game.reset();
      game.start(performance.now());
      return;
    }
  }

  if (event.key.length !== 1) return;
  if (game.input(event.key, performance.now()) === "miss") view.flashMiss();
});

const frame = () => {
  const now = performance.now();
  game.tick(now);
  view.render(game.snapshot(now));
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
