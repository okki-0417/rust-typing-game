type UpcomingProps = {
  texts: readonly string[];
};

export function Upcoming({ texts }: UpcomingProps) {
  return (
    <ol className="upcoming">
      {texts.map((text, order) => (
        <li key={`${order}:${text}`} className="upcoming__item">
          {text}
        </li>
      ))}
    </ol>
  );
}
