export function StartScreen() {
  return (
    <div className="overlay">
      <div className="panel">
        <h1 className="panel__title">タイピングマラソン</h1>
        <p className="panel__lead">打鍵が呼吸。打ちつづけるかぎり走れる。</p>
        <p className="panel__note">手を止めると息が切れて終わり。ミスは大きくつまずく。</p>
        <p className="panel__note">走るほど要求ペースは上がっていく。</p>
        <p className="panel__note">日本語入力（IME）はオフにしておく。</p>
        <p className="panel__key">スペースキーでスタート</p>
      </div>
    </div>
  );
}
