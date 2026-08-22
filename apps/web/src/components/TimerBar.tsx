type TimerBarProps = {
  durationMs: number;
  running: boolean;
};

export function TimerBar({ durationMs, running }: TimerBarProps) {
  return (
    <div className="timer">
      {running ? (
        <span
          key="draining"
          className="timer__bar is-draining"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      ) : (
        <span key="full" className="timer__bar" />
      )}
    </div>
  );
}
