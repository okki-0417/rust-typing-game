type Point = {
  ms: number;
  meters: number;
  behind: boolean;
};

type Mark = {
  meters: number;
  name: string;
};

type PaceChartProps = {
  splits: readonly Point[];
  marks: readonly Mark[];
};

const WIDTH = 360;
const HEIGHT = 132;

export function PaceChart({ splits, marks }: PaceChartProps) {
  const goal = splits.at(-1);
  if (!goal || goal.ms === 0 || goal.meters === 0) return null;

  const x = (ms: number) => (ms / goal.ms) * WIDTH;
  const y = (meters: number) => HEIGHT - (meters / goal.meters) * HEIGHT;
  const top = (meters: number) => `${(y(meters) / HEIGHT) * 100}%`;

  return (
    <figure className="chart">
      <svg
        className="chart__plot"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${(goal.ms / 1000).toFixed(0)} 秒で ${goal.meters.toLocaleString("ja-JP")}m を走った軌跡`}
      >
        {marks.map((mark) => (
          <line
            key={mark.meters}
            className="chart__mark"
            x1={0}
            y1={y(mark.meters)}
            x2={WIDTH}
            y2={y(mark.meters)}
          />
        ))}
        {splits.slice(1).map((split, index) => (
          <line
            key={split.ms}
            className={split.behind ? "chart__leg is-behind" : "chart__leg"}
            x1={x(splits[index]!.ms)}
            y1={y(splits[index]!.meters)}
            x2={x(split.ms)}
            y2={y(split.meters)}
          />
        ))}
      </svg>
      {marks.map((mark) => (
        <span key={mark.meters} className="chart__mark-name" style={{ top: top(mark.meters) }}>
          {mark.name}
        </span>
      ))}
      <figcaption className="chart__axis">
        <span>0 秒</span>
        <span className="chart__legend">
          <b className="chart__swatch" /> 要求ペース以上
          <b className="chart__swatch is-behind" /> 下回った区間
        </span>
        <span>{(goal.ms / 1000).toFixed(0)} 秒</span>
      </figcaption>
    </figure>
  );
}
