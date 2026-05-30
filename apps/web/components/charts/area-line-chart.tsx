import type { ReactNode } from "react";

export type AreaSeries = {
  /** Stable id used for gradient + key. */
  id: string;
  /** Numeric data points, aligned to `labels`. */
  values: number[];
  /** CSS color token, e.g. "var(--color-primary)". */
  color: string;
  /** Render a filled area beneath the line. */
  area?: boolean;
  /** Dashed stroke (e.g. for a "billed" comparison line). */
  dashed?: boolean;
};

type AreaLineChartProps = {
  series: AreaSeries[];
  labels: string[];
  /** Formats a y value for the axis ticks + accessible summary. */
  formatValue?: (value: number) => string;
  /** Number of horizontal grid lines / y ticks. */
  ticks?: number;
  ariaLabel?: string;
};

const WIDTH = 760;
const HEIGHT = 280;
const PAD = { top: 18, right: 18, bottom: 34, left: 64 };

/**
 * Pure-SVG revenue/area trend chart. Server-renderable, responsive via viewBox.
 * Renders one smoothed-ish polyline per series with an optional gradient area.
 */
export function AreaLineChart({
  series,
  labels,
  formatValue = (v) => String(Math.round(v)),
  ticks = 4,
  ariaLabel
}: AreaLineChartProps) {
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const count = labels.length;

  const allValues = series.flatMap((s) => s.values);
  const rawMax = allValues.length ? Math.max(...allValues) : 1;
  // Round the axis ceiling up to a clean step so ticks read nicely.
  const max = niceCeil(rawMax);
  const min = 0;

  const x = (i: number) => PAD.left + (count <= 1 ? plotW / 2 : (plotW * i) / (count - 1));
  const y = (v: number) => PAD.top + plotH - ((v - min) / (max - min || 1)) * plotH;

  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => min + ((max - min) * i) / ticks);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label={ariaLabel}
      className="overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {series.map((s) =>
          s.area ? (
            <linearGradient id={`area-${s.id}`} key={s.id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ) : null
        )}
      </defs>

      {/* Horizontal grid + y ticks */}
      {tickValues.map((tv, i) => {
        const gy = y(tv);
        return (
          <g key={`grid-${i}`}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={gy}
              y2={gy}
              stroke="var(--color-line)"
              strokeWidth={1}
              strokeDasharray={i === 0 ? undefined : "3 5"}
              opacity={i === 0 ? 1 : 0.7}
            />
            <text
              x={PAD.left - 12}
              y={gy + 4}
              textAnchor="end"
              fontSize={11}
              className="tabular-nums"
              fill="var(--color-text-muted)"
            >
              {formatValue(tv)}
            </text>
          </g>
        );
      })}

      {/* X labels */}
      {labels.map((label, i) => (
        <text
          key={`xl-${i}`}
          x={x(i)}
          y={HEIGHT - PAD.bottom + 20}
          textAnchor="middle"
          fontSize={11}
          fill="var(--color-text-muted)"
        >
          {label}
        </text>
      ))}

      {/* Series */}
      {series.map((s) => {
        const points = s.values.map((v, i) => [x(i), y(v)] as const);
        const linePath = points.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px},${py}`).join(" ");
        const areaPath =
          points.length > 0
            ? `${linePath} L${points[points.length - 1][0]},${y(min)} L${points[0][0]},${y(min)} Z`
            : "";

        return (
          <g key={s.id}>
            {s.area ? <path d={areaPath} fill={`url(#area-${s.id})`} stroke="none" /> : null}
            <path
              d={linePath}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dashed ? "6 5" : undefined}
              opacity={s.dashed ? 0.85 : 1}
            />
            {!s.dashed
              ? points.map(([px, py], i) => (
                  <circle
                    key={`pt-${s.id}-${i}`}
                    cx={px}
                    cy={py}
                    r={3}
                    fill="var(--color-panel)"
                    stroke={s.color}
                    strokeWidth={2}
                  />
                ))
              : null}
          </g>
        );
      })}
    </svg>
  );
}

/** Wraps a chart with a legend row. Keeps the SVG itself prop-free of layout. */
export function ChartLegend({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-5 gap-y-2">{children}</div>;
}

export function LegendSwatch({
  color,
  label,
  dashed
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
      <span
        aria-hidden="true"
        className="inline-block h-0.5 w-5 rounded-full"
        style={
          dashed
            ? { background: `repeating-linear-gradient(90deg, ${color} 0 5px, transparent 5px 9px)` }
            : { backgroundColor: color }
        }
      />
      {label}
    </span>
  );
}

/** Rounds up to a clean axis ceiling (1/2/2.5/5 × 10^n). */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const frac = value / base;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
  return niceFrac * base;
}
