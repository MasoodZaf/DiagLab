export type DonutSlice = {
  id: string;
  label: string;
  value: number;
  /** CSS color token, e.g. "var(--color-success)". */
  color: string;
};

type DonutChartProps = {
  slices: DonutSlice[];
  /** Big number rendered in the center (e.g. total). */
  centerValue?: string;
  /** Caption under the center value. */
  centerLabel?: string;
  ariaLabel?: string;
};

const SIZE = 220;
const STROKE = 26;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const CENTER = SIZE / 2;
const GAP = 0.012; // fraction of circumference left between slices

/**
 * Pure-SVG donut built from stroked circle arcs (stroke-dasharray offsets).
 * Server-renderable, responsive via viewBox. Slices with 0 value are skipped.
 */
export function DonutChart({ slices, centerValue, centerLabel, ariaLabel }: DonutChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const visible = slices.filter((s) => s.value > 0);
  let cursor = 0;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
      className="max-w-[240px]"
    >
      {/* Track */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={R}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={STROKE}
        opacity={0.5}
      />

      {total > 0
        ? visible.map((s) => {
            const frac = s.value / total;
            const seg = Math.max(0, frac - GAP) * C;
            const dash = `${seg} ${C - seg}`;
            // The group is rotated -90deg so dashes start at 12 o'clock; a
            // negative dashoffset then advances each slice clockwise.
            const offset = -cursor * C;
            cursor += frac;
            return (
              <circle
                key={s.id}
                cx={CENTER}
                cy={CENTER}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={dash}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              />
            );
          })
        : null}

      {centerValue ? (
        <text
          x={CENTER}
          y={CENTER - 2}
          textAnchor="middle"
          fontSize={34}
          fontWeight={700}
          className="tabular-nums"
          fill="var(--color-text)"
        >
          {centerValue}
        </text>
      ) : null}
      {centerLabel ? (
        <text
          x={CENTER}
          y={CENTER + 20}
          textAnchor="middle"
          fontSize={11}
          fill="var(--color-text-muted)"
        >
          {centerLabel}
        </text>
      ) : null}
    </svg>
  );
}
