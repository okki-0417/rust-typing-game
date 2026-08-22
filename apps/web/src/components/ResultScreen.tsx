import { accuracy, kpm } from "../game/score.ts";

type ResultScreenProps = {
  hits: number;
  misses: number;
  cleared: number;
  durationMs: number;
};

export function ResultScreen({ hits, misses, cleared, durationMs }: ResultScreenProps) {
  const speed = kpm(hits, durationMs);

  return (
    <div className="overlay">
      <div className="panel">
        <p className="panel__rank">{rankOf(hits, speed)}</p>
        <dl className="result">
          <div>
            <dt>クリア</dt>
            <dd>{cleared}</dd>
          </div>
          <div>
            <dt>打鍵</dt>
            <dd>{hits}</dd>
          </div>
          <div>
            <dt>ミス</dt>
            <dd>{misses}</dd>
          </div>
          <div>
            <dt>正確率</dt>
            <dd>{Math.round(accuracy(hits, misses) * 100)}%</dd>
          </div>
          <div>
            <dt>KPM</dt>
            <dd>{Math.round(speed)}</dd>
          </div>
        </dl>
        <p className="panel__key">スペースキーでもう一度</p>
      </div>
    </div>
  );
}

function rankOf(hits: number, speed: number): string {
  if (hits === 0) return "何も打っていない";
  if (speed >= 300) return "化け物";
  if (speed >= 240) return "達人";
  if (speed >= 180) return "かなり速い";
  if (speed >= 120) return "速い";
  if (speed >= 60) return "そこそこ";
  return "これから";
}
