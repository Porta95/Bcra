interface Props {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  positive?: boolean;
}

export default function Sparkline({
  data,
  width = 220,
  height = 60,
  className = "",
  positive = true,
}: Props) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const stepX = width / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const stroke = positive
    ? "rgb(var(--ok))"
    : "rgb(var(--danger))";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill="url(#spark-fill)"
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
