type StartScreenProps = {
  durationMs: number;
};

export function StartScreen({ durationMs }: StartScreenProps) {
  return (
    <div className="overlay">
      <div className="panel">
        <h1 className="panel__title">タイピングゲーム</h1>
        <p className="panel__lead">
          制限時間 {Math.round(durationMs / 1000)} 秒。読みのとおりに打つ。
        </p>
        <p className="panel__note">日本語入力（IME）はオフにしておく。</p>
        <p className="panel__key">スペースキーでスタート</p>
      </div>
    </div>
  );
}
