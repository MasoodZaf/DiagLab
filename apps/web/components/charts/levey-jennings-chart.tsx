export type QcPoint = {
  /** Sequential index / day number. */
  label: string;
  value: number;
};

type LeveyJenningsChartProps = {
  points: QcPoint[];
  mean: number;
  /** One standard deviation in the same units as `value`. */
  sd: number;
  formatValue?: (value: number) => string;
  ariaLabel?: string;
};

const WIDTH = 760;
const HEIGHT = 300;
const PAD = { top: 22, right: 64, bottom: 34, left: 56 };

/**
 * Pure-SVG Levey-Jennings QC chart: a connected scatter of daily control values
 * against horizontal mean / ±1SD / ±2SD / ±3SD limit lines. Points beyond ±2SD
 * are highlighted (warning) and beyond ±3SD escalate to danger.
 * Server-renderable, responsive via viewBox.
 */
export function LeveyJenningsChart({
  points,
  mean,
  sd,
  formatValue = (v) => v.toFixed(1),
  ariaLabel
}: LeveyJenningsChartProps) {
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const count = points.length;

  // Fix the visible band to ±3.4 SD so limit lines always have headroom.
  const span = sd * 3.4;
  const top = mean + span;
  const bottom = mean - span;

  const x = (i: number) => PAD.left + (count <= 1 ? plotW / 2 : (plotW * i) / (count - 1));
  const y = (v: number) => PAD.top + plotH - ((v - bottom) / (top - bottom || 1)) * plotH;

  const limits = [
    { k: 3, label: "+3SD", color: "var(--color-danger)", dash: "2 4" },
    { k: 2, label: "+2SD", color: "var(--color-warning)", dash: "4 5" },
    { k: 1, label: "+1SD", color: "var(--color-line)", dash: "3 6" },
    { k: 0, label: "Mean", color: "var(--color-primary)", dash: undefined },
    { k: -1, label: "-1SD", color: "var(--color-line)", dash: "3 6" },
    { k: -2, label: "-2SD", color: "var(--color-warning)", dash: "4 5" },
    { k: -3, label: "-3SD", color: "var(--color-danger)", dash: "2 4" }
  ];

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`)
    .join(" ");

  const pointColor = (v: number) => {
    const z = Math.abs((v - mean) / (sd || 1));
    if (z > 3) return "var(--color-danger)";
    if (z > 2) return "var(--color-warning)";
    return "var(--color-primary)";
  };

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label={ariaLabel}
      className="overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* ±2SD acceptance band shading */}
      <rect
        x={PAD.left}
        y={y(mean + 2 * sd)}
        width={plotW}
        height={Math.max(0, y(mean - 2 * sd) - y(mean + 2 * sd))}
        fill="color-mix(in srgb, var(--color-success) 9%, transparent)"
      />

      {/* Limit lines + right-edge labels */}
      {limits.map((lim) => {
        const ly = y(mean + lim.k * sd);
        return (
          <g key={lim.label}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={ly}
              y2={ly}
              stroke={lim.color}
              strokeWidth={lim.k === 0 ? 1.5 : 1}
              strokeDasharray={lim.dash}
              opacity={lim.k === 0 ? 1 : 0.85}
            />
            <text
              x={WIDTH - PAD.right + 8}
              y={ly + 4}
              fontSize={10}
              className="tabular-nums"
              fill="var(--color-text-muted)"
            >
              {lim.label}
            </text>
          </g>
        );
      })}

      {/* Y axis value ticks at mean and ±2SD */}
      {[mean + 2 * sd, mean, mean - 2 * sd].map((v, i) => (
        <text
          key={`yt-${i}`}
          x={PAD.left - 10}
          y={y(v) + 4}
          textAnchor="end"
          fontSize={10}
          className="tabular-nums"
          fill="var(--color-text-muted)"
        >
          {formatValue(v)}
        </text>
      ))}

      {/* Connecting line */}
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        opacity={0.55}
      />

      {/* Control points */}
      {points.map((p, i) => {
        const fill = pointColor(p.value);
        const out = Math.abs((p.value - mean) / (sd || 1)) > 2;
        return (
          <g key={`${p.label}-${i}`}>
            <circle
              cx={x(i)}
              cy={y(p.value)}
              r={out ? 5 : 3.5}
              fill={fill}
              stroke="var(--color-panel)"
              strokeWidth={1.5}
            />
            {i % 2 === 0 ? (
              <text
                x={x(i)}
                y={HEIGHT - PAD.bottom + 18}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-text-muted)"
              >
                {p.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
