type ScoreboardProps = {
  distance: number;
  pace: number;
  targetPace: number;
  behind: boolean;
  misses: number;
  next: { name: string; meters: number } | undefined;
};

export function Scoreboard({ distance, pace, targetPace, behind, misses, next }: ScoreboardProps) {
  return (
    <div className="hud">
      <span className="hud__item">
        距離 <b className="hud__value">{distance.toLocaleString("ja-JP")} m</b>
      </span>
      <span className="hud__item">
        ペース <b className={behind ? "hud__value is-behind" : "hud__value"}>{Math.round(pace)}</b>
      </span>
      <span className="hud__item">
        要求 <b className="hud__value">{Math.round(targetPace)}</b>
      </span>
      <span className="hud__item">
        ミス <b className="hud__value">{misses}</b>
      </span>
      {next && (
        <span className="hud__item">
          次の関門{" "}
          <b className="hud__value">
            {next.name} まで {(next.meters - distance).toLocaleString("ja-JP")} m
          </b>
        </span>
      )}
    </div>
  );
}
