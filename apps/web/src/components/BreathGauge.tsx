type BreathGaugeProps = {
  ratio: number;
  gasping: boolean;
};

export function BreathGauge({ ratio, gasping }: BreathGaugeProps) {
  return (
    <div className="breath">
      <span
        className={gasping ? "breath__bar is-gasping" : "breath__bar"}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
