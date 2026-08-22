import { accuracy } from "../game/score.ts";

type ScoreboardProps = {
  hits: number;
  misses: number;
  cleared: number;
};

export function Scoreboard({ hits, misses, cleared }: ScoreboardProps) {
  return (
    <div className="hud">
      <span className="hud__item">
        打鍵 <b className="hud__value">{hits}</b>
      </span>
      <span className="hud__item">
        ミス <b className="hud__value">{misses}</b>
      </span>
      <span className="hud__item">
        正確率 <b className="hud__value">{Math.round(accuracy(hits, misses) * 100)}%</b>
      </span>
      <span className="hud__item">
        クリア <b className="hud__value">{cleared}</b>
      </span>
    </div>
  );
}
