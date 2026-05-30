export type BarDatum = {
  label: string;
  value: number;
  /** Optional per-bar color token; defaults to primary. */
  color?: string;
};

type BarChartProps = {
  data: BarDatum[];
  formatValue?: (value: number) => string;
  ticks?: number;
  ariaLabel?: string;
};

const WIDTH = 760;
const HEIGHT = 280;
const PAD = { top: 18, right: 18, bottom: 46, left: 56 };

/**
 * Pure-SVG vertical bar chart with value labels above each bar.
 * Server-renderable, responsive via viewBox.
 */
export function BarChart({
  data,
  formatValue = (v) => String(Math.round(v)),
  ticks = 4,
  ariaLabel
}: BarChartProps) {
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const count = data.length || 1;

  const rawMax = data.length ? Math.max(...data.map((d) => d.value)) : 1;
  const max = niceCeil(rawMax);

  const slot = plotW / count;
  const barW = Math.min(46, slot * 0.56);

  const y = (v: number) => PAD.top + plotH - (v / (max || 1)) * plotH;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => (max * i) / ticks);

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
        <linearGradient id="bar-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* Grid + y ticks */}
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

      {/* Bars */}
      {data.map((d, i) => {
        const cx = PAD.left + slot * i + slot / 2;
        const top = y(d.value);
        const h = PAD.top + plotH - top;
        const fill = d.color ?? "url(#bar-fill)";
        return (
          <g key={`${d.label}-${i}`}>
            <rect
              x={cx - barW / 2}
              y={top}
              width={barW}
              height={Math.max(0, h)}
              rx={6}
              fill={fill}
            />
            <text
              x={cx}
              y={top - 8}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              className="tabular-nums"
              fill="var(--color-text)"
            >
              {formatValue(d.value)}
            </text>
            <text
              x={cx}
              y={HEIGHT - PAD.bottom + 18}
              textAnchor="middle"
              fontSize={11}
              fill="var(--color-text-muted)"
            >
              {truncate(d.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function truncate(label: string, max = 11) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const frac = value / base;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
  return niceFrac * base;
}
