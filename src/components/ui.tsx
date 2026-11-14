import type { ReactNode } from 'react';
export function Section({
  title,
  number,
  children,
  className = '',
}: {
  title: string;
  number?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel-section ${className}`}>
      <div className="section-heading">
        {number && <span className="section-num">{number}</span>}
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}
export function Range({
  label,
  value,
  min = 0,
  max,
  step = 1,
  onChange,
  suffix = '',
  hint,
}: {
  label: string;
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (x: number) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="range-label">
      <span>
        {label}
        <output>
          {Number.isInteger(value) ? value : Number(value.toFixed(3))}
          {suffix}
        </output>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Toggle({
  label,
  checked,
  onChange,
  color,
}: {
  label: string;
  checked: boolean;
  onChange: (x: boolean) => void;
  color?: string;
}) {
  return (
    <label className="toggle-label">
      <span>
        {color && <i style={{ background: color }} />}
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
export function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
    </div>
  );
}
export function Info({ children }: { children: ReactNode }) {
  return (
    <div className="info-note">
      <span aria-hidden="true">i</span>
      <p>{children}</p>
    </div>
  );
}
export const fnum = (x: number, d = 4) => (Math.abs(x) < 1e-10 ? '0' : x.toFixed(d));
