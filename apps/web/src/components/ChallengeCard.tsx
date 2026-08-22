type ChallengeCardProps = {
  text: string;
  typedReading: string;
  restReading: string;
  typedKeys: string;
  restKeys: string;
  misses: number;
};

export function ChallengeCard({
  text,
  typedReading,
  restReading,
  typedKeys,
  restKeys,
  misses,
}: ChallengeCardProps) {
  return (
    // WHY NOT: 単に class を付け外しすると、続けてミスしたときに震えが頭から再生されない。
    // ミスの回数を key にして作り直させることで、毎回頭から再生させる
    <section key={misses} className={misses === 0 ? "card" : "card is-missed"}>
      <p className="card__text">{text}</p>
      <p className="card__reading">
        <span className="is-done">{typedReading}</span>
        <span>{restReading}</span>
      </p>
      <p className="card__guide">
        <span className="is-done">{typedKeys}</span>
        <span className="is-next">{restKeys.slice(0, 1)}</span>
        <span>{restKeys.slice(1)}</span>
      </p>
    </section>
  );
}
