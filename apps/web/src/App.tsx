import { ChallengeCard } from "./components/ChallengeCard.tsx";
import { ResultScreen } from "./components/ResultScreen.tsx";
import { Scoreboard } from "./components/Scoreboard.tsx";
import { StartScreen } from "./components/StartScreen.tsx";
import { TimerBar } from "./components/TimerBar.tsx";
import { challenges } from "./data/challenges.ts";
import { restKeys, restReading, typedKeys, typedReading } from "./game/selectors.ts";
import { useTypingGame } from "./hooks/useTypingGame.ts";

const DURATION_MS = 60_000;

export function App() {
  const game = useTypingGame(challenges, DURATION_MS);

  return (
    <>
      <TimerBar durationMs={DURATION_MS} running={game.status === "playing"} />
      <Scoreboard hits={game.hits} misses={game.misses} cleared={game.cleared} />
      <ChallengeCard
        text={game.challenge.text}
        typedReading={typedReading(game)}
        restReading={restReading(game)}
        typedKeys={typedKeys(game)}
        restKeys={restKeys(game)}
        misses={game.misses}
      />
      {game.status === "ready" && <StartScreen durationMs={DURATION_MS} />}
      {game.status === "finished" && (
        <ResultScreen
          hits={game.hits}
          misses={game.misses}
          cleared={game.cleared}
          durationMs={DURATION_MS}
        />
      )}
    </>
  );
}
