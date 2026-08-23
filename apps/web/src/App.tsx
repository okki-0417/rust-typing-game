import { BreathGauge } from "./components/BreathGauge.tsx";
import { ChallengeCard } from "./components/ChallengeCard.tsx";
import { CheckpointBanner } from "./components/CheckpointBanner.tsx";
import { ResultScreen } from "./components/ResultScreen.tsx";
import { Scoreboard } from "./components/Scoreboard.tsx";
import { StartScreen } from "./components/StartScreen.tsx";
import { Upcoming } from "./components/Upcoming.tsx";
import { challenges } from "./data/challenges.ts";
import { isGasping } from "./game/breath.ts";
import { paceOf } from "./game/pace.ts";
import { accuracy, rankOf } from "./game/score.ts";
import {
  breathRatio,
  currentPace,
  distance,
  elapsedMs,
  justPassed,
  nextCheckpoint,
  restKeys,
  restReading,
  strokes,
  targetPace,
  typedKeys,
  typedReading,
} from "./game/selectors.ts";
import { useTypingGame } from "./hooks/useTypingGame.ts";

export function App() {
  const game = useTypingGame(challenges);
  const ran = distance(game);
  const next = nextCheckpoint(game);
  const passing = justPassed(game);

  return (
    <>
      <BreathGauge ratio={breathRatio(game)} gasping={isGasping(game.breath)} />
      <Scoreboard
        distance={ran}
        pace={currentPace(game)}
        targetPace={targetPace(game)}
        behind={currentPace(game) < targetPace(game)}
        misses={game.misses}
        next={next}
      />
      <ChallengeCard
        text={game.challenge.text}
        typedReading={typedReading(game)}
        restReading={restReading(game)}
        typedKeys={typedKeys(game)}
        restKeys={restKeys(game)}
        misses={game.misses}
      />
      <Upcoming texts={game.upcoming.map((challenge) => challenge.text)} />
      {game.status === "playing" && passing && (
        <CheckpointBanner key={passing.meters} name={passing.name} meters={passing.meters} />
      )}
      {game.status === "ready" && <StartScreen />}
      {game.status === "finished" && (
        <ResultScreen
          rank={rankOf(ran)}
          distance={ran}
          elapsedMs={elapsedMs(game)}
          averagePace={paceOf(strokes(game), elapsedMs(game))}
          cleared={game.cleared}
          strokes={strokes(game)}
          misses={game.misses}
          accuracy={accuracy(strokes(game), game.misses)}
          next={next}
        />
      )}
    </>
  );
}
