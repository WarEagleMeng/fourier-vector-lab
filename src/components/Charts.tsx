import { useId } from 'react';
import type { Coefficient } from '../math/fourier';
export function Spectrum({
  cs,
  N,
  phase = false,
  selected,
  onSelect,
  disabled = [],
  signed = true,
}: {
  cs: Coefficient[];
  N: number;
  phase?: boolean;
  selected: number;
  onSelect: (n: number) => void;
  disabled?: number[];
  signed?: boolean;
}) {
  const range = Math.max(5, N),
    lower = signed ? -range : 0,
    visible = cs.filter((c) => c.n >= lower && c.n <= range);
  const W = 320,
    H = 126,
    left = 29,
    right = 10,
    top = 12,
    bottom = 25;
  const x = (n: number) => left + ((n - lower) / (range - lower)) * (W - left - right),
    max = phase ? Math.PI : Math.max(0.01, ...visible.map((c) => c.magnitude));
  const y = (v: number) =>
    phase
      ? top + ((Math.PI - v) / (2 * Math.PI)) * (H - top - bottom)
      : H - bottom - (v / max) * (H - top - bottom);
  return (
    <svg
      className="spectrum"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={phase ? 'Phase spectrum' : 'Amplitude spectrum'}
    >
      {[0, 0.5, 1].map((k) => (
        <line
          key={k}
          x1={left}
          x2={W - right}
          y1={top + k * (H - top - bottom)}
          y2={top + k * (H - top - bottom)}
          className="chart-grid"
        />
      ))}
      <text x={2} y={top + 4}>
        {phase ? 'π' : max.toFixed(1)}
      </text>
      <text x={2} y={H - bottom + 3}>
        {phase ? '−π' : '0'}
      </text>
      <line x1={left} x2={W - right} y1={y(0)} y2={y(0)} className="chart-axis" />
      {visible.map((c) => {
        const zero = c.magnitude < 1e-9,
          value = phase ? (zero ? 0 : c.phase) : c.magnitude;
        return (
          <g
            key={c.n}
            role="button"
            tabIndex={0}
            aria-label={`${phase ? 'Phase' : 'Amplitude'} harmonic ${c.n}`}
            onClick={() => onSelect(c.n)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(c.n);
              }
            }}
            style={{
              cursor: 'pointer',
              opacity: disabled.includes(c.n) || Math.abs(c.n) > N ? 0.25 : 1,
            }}
          >
            <title>
              n={c.n}: {phase ? (zero ? 'undefined' : value.toFixed(4) + ' rad') : value.toFixed(5)}
            </title>
            <rect
              x={x(c.n) - Math.max(2, (W - left - right) / (range - lower + 1) / 2)}
              y={top}
              width={Math.max(4, (W - left - right) / (range - lower + 1))}
              height={H - top - bottom}
              fill="transparent"
            />
            <line
              x1={x(c.n)}
              x2={x(c.n)}
              y1={y(0)}
              y2={y(value)}
              stroke={
                selected === c.n
                  ? 'var(--plot-amber)'
                  : phase
                    ? 'var(--plot-purple)'
                    : 'var(--plot-green)'
              }
              strokeWidth={selected === c.n ? 3 : 2}
            />
            {(!phase || !zero) && (
              <circle
                cx={x(c.n)}
                cy={y(value)}
                r={selected === c.n ? 3.5 : 2}
                fill={
                  selected === c.n
                    ? 'var(--plot-amber)'
                    : phase
                      ? 'var(--plot-purple)'
                      : 'var(--plot-green)'
                }
              />
            )}
          </g>
        );
      })}
      {(signed ? [-range, 0, range] : [0, Math.round(range / 2), range]).map((n) => (
        <text
          key={n}
          x={x(n)}
          y={H - 6}
          textAnchor={n === range ? 'end' : n === lower ? 'start' : 'middle'}
        >
          {n}
        </text>
      ))}
      <text x={W - 4} y={H - 6} textAnchor="end">
        n
      </text>
    </svg>
  );
}
export function LineChart({
  series,
  height = 220,
  labels = ['0', '1'],
  yLabel = 'Amplitude',
  ariaLabel = 'Signal graph',
  nonNegative = false,
}: {
  series: { values: number[]; color: string; name: string; dash?: boolean }[];
  height?: number;
  labels?: string[];
  yLabel?: string;
  ariaLabel?: string;
  nonNegative?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const W = 800,
    H = height,
    left = 42,
    right = 14,
    top = 20,
    bottom = 28,
    values = series.flatMap((s) => s.values),
    lo = Math.min(0, ...values),
    hi = Math.max(0.001, ...values),
    pad = (hi - lo) * 0.12,
    min = nonNegative ? 0 : lo - pad,
    max = hi + pad;
  const X = (i: number, M: number) => left + (i / Math.max(1, M - 1)) * (W - left - right),
    Y = (v: number) => top + ((max - v) / (max - min)) * (H - top - bottom);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="line-chart" role="img" aria-label={ariaLabel}>
      <defs>
        <clipPath id={id}>
          <rect x={left} y={top} width={W - left - right} height={H - top - bottom} />
        </clipPath>
      </defs>
      {[0, 0.5, 1].map((k) => (
        <g key={k}>
          <line
            x1={left}
            x2={W - right}
            y1={top + k * (H - top - bottom)}
            y2={top + k * (H - top - bottom)}
            className="chart-grid"
          />
          <text x={left - 7} y={top + k * (H - top - bottom) + 4} textAnchor="end">
            {(max - k * (max - min)).toFixed(2)}
          </text>
        </g>
      ))}
      <line x1={left} x2={W - right} y1={Y(0)} y2={Y(0)} className="chart-axis" />
      <g clipPath={`url(#${id})`}>
        {series.map((s) => (
          <path
            key={s.name}
            d={s.values.map((v, i) => `${i ? 'L' : 'M'}${X(i, s.values.length)},${Y(v)}`).join(' ')}
            fill="none"
            stroke={
              (
                {
                  '#6de5ad': 'var(--plot-green)',
                  '#b29aef': 'var(--plot-purple)',
                  '#8dbff0': 'var(--plot-blue)',
                  '#efbf78': 'var(--plot-amber)',
                } as Record<string, string>
              )[s.color] || s.color
            }
            strokeWidth="2"
            strokeDasharray={s.dash ? '5 5' : undefined}
          />
        ))}
      </g>
      <text x={left} y={H - 6}>
        {labels[0]}
      </text>
      <text x={W - right} y={H - 6} textAnchor="end">
        {labels[1]}
      </text>
      <text x={left} y={12}>
        {yLabel}
      </text>
    </svg>
  );
}
export function ErrorChart({ values, N }: { values: number[]; N: number }) {
  const W = 320,
    H = 100,
    top = 12,
    bottom = 22,
    left = 32,
    range = Math.max(values[0], 1e-12);
  const x = (n: number) => left + (n / (values.length - 1)) * (W - left - 8),
    y = (v: number) => top + (1 - v / range) * (H - top - bottom);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="error-chart"
      role="img"
      aria-label="Mean squared error versus harmonic order"
    >
      <path
        d={values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')}
        stroke="var(--plot-amber)"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1={x(N)}
        x2={x(N)}
        y1={top}
        y2={H - bottom}
        stroke="var(--plot-amber)"
        strokeDasharray="3 3"
      />
      <circle cx={x(N)} cy={y(values[N])} r="3" fill="var(--plot-amber)" />
      <text x={1} y={top + 3}>
        {range.toFixed(2)}
      </text>
      <text x={left} y={H - 4}>
        0
      </text>
      <text x={W - 5} y={H - 4} textAnchor="end">
        100 · order N
      </text>
    </svg>
  );
}
