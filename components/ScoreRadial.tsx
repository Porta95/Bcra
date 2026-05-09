import type { Tier } from "@/lib/deudores-analysis";

interface Props {
  score: number;
  tier: Tier;
  size?: number;
  thickness?: number;
}

const TONE_COLOR: Record<Tier["tone"], string> = {
  neutral: "rgb(var(--muted))",
  ok: "rgb(var(--ok))",
  warn: "rgb(var(--warn))",
  alert: "rgb(var(--accent))",
  danger: "rgb(var(--danger))",
};

export default function ScoreRadial({
  score,
  tier,
  size = 180,
  thickness = 12,
}: Props) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circumference * pct;
  const color = TONE_COLOR[tier.tone];

  const showScore = tier.tipo !== "sin-antecedentes";

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={
        showScore ? `Score derivado: ${score} de 100` : "Sin antecedentes"
      }
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(var(--border))"
          strokeWidth={thickness}
          fill="none"
        />
        {showScore && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            style={{ transition: "stroke-dasharray 0.6s ease-out" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <div className="section-eyebrow" aria-hidden="true">
          {showScore ? "Score derivado" : "Estado"}
        </div>
        <div
          className="font-display italic text-4xl tabular leading-none mt-1"
          style={{ color: showScore ? color : "rgb(var(--muted))" }}
        >
          {showScore ? score : "—"}
        </div>
        <div
          className="text-[10px] uppercase tracking-widest mt-2 leading-tight"
          style={{ color }}
        >
          {tier.short}
        </div>
      </div>
    </div>
  );
}
