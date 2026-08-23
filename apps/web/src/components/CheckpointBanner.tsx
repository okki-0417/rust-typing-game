type CheckpointBannerProps = {
  name: string;
  meters: number;
};

export function CheckpointBanner({ name, meters }: CheckpointBannerProps) {
  return (
    <div className="banner">
      <p className="banner__distance">{(meters / 1000).toFixed(1)} km 通過</p>
      <p className="banner__name">{name}</p>
    </div>
  );
}
