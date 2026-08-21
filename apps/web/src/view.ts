import type { Score, Snapshot } from "./game.ts";

export interface View {
  render(snapshot: Snapshot): void;
  flashMiss(): void;
}

const LAYOUT = `
  <div class="timer"><span class="timer__bar"></span></div>
  <div class="hud">
    <span class="hud__item">打鍵 <b class="hud__value" data-hits></b></span>
    <span class="hud__item">ミス <b class="hud__value" data-misses></b></span>
    <span class="hud__item">正確率 <b class="hud__value" data-accuracy></b></span>
    <span class="hud__item">クリア <b class="hud__value" data-cleared></b></span>
  </div>
  <section class="card">
    <p class="card__text" data-text></p>
    <p class="card__reading">
      <span class="is-done" data-typed-reading></span><span data-remaining-reading></span>
    </p>
    <p class="card__guide">
      <span class="is-done" data-typed></span><span class="is-next" data-next></span><span data-rest></span>
    </p>
  </section>
  <div class="overlay" data-overlay></div>
`;

export function createView(root: HTMLElement): View {
  root.innerHTML = LAYOUT;
  const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;

  const bar = find(".timer__bar");
  const card = find(".card");
  const overlay = find("[data-overlay]");
  const slots = {
    hits: find("[data-hits]"),
    misses: find("[data-misses]"),
    accuracy: find("[data-accuracy]"),
    cleared: find("[data-cleared]"),
    text: find("[data-text]"),
    typedReading: find("[data-typed-reading]"),
    remainingReading: find("[data-remaining-reading]"),
    typed: find("[data-typed]"),
    next: find("[data-next]"),
    rest: find("[data-rest]"),
  };

  return {
    render(snapshot) {
      const { score } = snapshot;
      bar.style.width = `${Math.max(0, snapshot.leftRatio) * 100}%`;
      slots.hits.textContent = String(score.hits);
      slots.misses.textContent = String(score.misses);
      slots.accuracy.textContent = `${Math.round(score.accuracy * 100)}%`;
      slots.cleared.textContent = String(score.cleared);

      slots.text.textContent = snapshot.challenge.text;
      slots.typedReading.textContent = snapshot.typedReading;
      slots.remainingReading.textContent = snapshot.remainingReading;
      slots.typed.textContent = snapshot.typed;
      slots.next.textContent = snapshot.remaining.slice(0, 1);
      slots.rest.textContent = snapshot.remaining.slice(1);

      root.dataset.phase = snapshot.phase;
      overlay.innerHTML = overlayOf(snapshot);
    },

    flashMiss() {
      card.classList.remove("is-missed");
      // WHY NOT: 値を捨てる式は普通書かないが、レイアウトを読み直させないと
      // クラスを付け直してもアニメーションが頭から再生されない
      void card.offsetWidth;
      card.classList.add("is-missed");
    },
  };
}

function overlayOf(snapshot: Snapshot): string {
  if (snapshot.phase === "ready") {
    return `
      <div class="panel">
        <h1 class="panel__title">タイピングゲーム</h1>
        <p class="panel__lead">制限時間 ${Math.round(snapshot.leftMs / 1000)} 秒。読みのとおりに打つ。</p>
        <p class="panel__note">日本語入力（IME）はオフにしておく。</p>
        <p class="panel__key">スペースキーでスタート</p>
      </div>
    `;
  }
  if (snapshot.phase === "finished") {
    const { score } = snapshot;
    return `
      <div class="panel">
        <p class="panel__rank">${rankOf(score)}</p>
        <dl class="result">
          <div><dt>クリア</dt><dd>${score.cleared}</dd></div>
          <div><dt>打鍵</dt><dd>${score.hits}</dd></div>
          <div><dt>ミス</dt><dd>${score.misses}</dd></div>
          <div><dt>正確率</dt><dd>${Math.round(score.accuracy * 100)}%</dd></div>
          <div><dt>KPM</dt><dd>${Math.round(score.kpm)}</dd></div>
        </dl>
        <p class="panel__key">スペースキーでもう一度</p>
      </div>
    `;
  }
  return "";
}

function rankOf(score: Score): string {
  if (score.hits === 0) return "何も打っていない";
  if (score.kpm >= 300) return "化け物";
  if (score.kpm >= 240) return "達人";
  if (score.kpm >= 180) return "かなり速い";
  if (score.kpm >= 120) return "速い";
  if (score.kpm >= 60) return "そこそこ";
  return "これから";
}
