type ResultScreenProps = {
  rank: string;
  distance: number;
  elapsedMs: number;
  averagePace: number;
  cleared: number;
  strokes: number;
  misses: number;
  accuracy: number;
  next: { name: string; meters: number } | undefined;
};

export function ResultScreen({
  rank,
  distance,
  elapsedMs,
  averagePace,
  cleared,
  strokes,
  misses,
  accuracy,
  next,
}: ResultScreenProps) {
  return (
    <div className="overlay">
      <div className="panel">
        <p className="panel__rank">{rank}</p>
        <p className="panel__distance">{(distance / 1000).toFixed(2)} km</p>
        <dl className="result">
          <div>
            <dt>走った時間</dt>
            <dd>{(elapsedMs / 1000).toFixed(1)}s</dd>
          </div>
          <div>
            <dt>平均ペース</dt>
            <dd>{Math.round(averagePace)}</dd>
          </div>
          <div>
            <dt>クリア</dt>
            <dd>{cleared}</dd>
          </div>
          <div>
            <dt>打鍵</dt>
            <dd>{strokes}</dd>
          </div>
          <div>
            <dt>ミス</dt>
            <dd>{misses}</dd>
          </div>
          <div>
            <dt>正確率</dt>
            <dd>{Math.round(accuracy * 100)}%</dd>
          </div>
        </dl>
        {next && (
          <p className="panel__chase">
            あと {(next.meters - distance).toLocaleString("ja-JP")} m で {next.name} だった
          </p>
        )}
        <p className="panel__key">スペースキーでもう一度</p>
      </div>
    </div>
  );
}
