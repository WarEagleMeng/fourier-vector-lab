/** Cartesian complex coordinates: +x right, +y up. T=1; analysis exponent negative. */
export type Complex = { re: number; im: number };
export type Coefficient = Complex & { n: number; magnitude: number; phase: number };
export const TAU = 2 * Math.PI;
export const abs2 = (z: Complex) => z.re * z.re + z.im * z.im;
export const magnitude = (z: Complex) => Math.hypot(z.re, z.im);
export function coefficient(n: number, re: number, im: number): Coefficient {
  return { n, re, im, magnitude: Math.hypot(re, im), phase: Math.atan2(im, re) };
}
/** Closed polygon resampling, no duplicated period endpoint; zero-length edges ignored. */
export function resampleClosed(input: Complex[], count = 512): Complex[] {
  if (!Number.isInteger(count) || count < 2) throw new Error('Sample count must be an integer ≥2.');
  const points = input.filter(
    (q, i) =>
      i === 0 || magnitude({ re: q.re - input[i - 1].re, im: q.im - input[i - 1].im }) > 1e-12,
  );
  if (
    points.length > 1 &&
    Math.hypot(points[0].re - points.at(-1)!.re, points[0].im - points.at(-1)!.im) < 1e-12
  )
    points.pop();
  if (points.length < 2 || points.some((q) => !Number.isFinite(q.re) || !Number.isFinite(q.im)))
    throw new Error('Draw a nonzero path with at least two distinct points.');
  const lengths = points.map((a, i) => {
    const b = points[(i + 1) % points.length];
    return Math.hypot(b.re - a.re, b.im - a.im);
  });
  const total = lengths.reduce((a, b) => a + b, 0);
  if (total < 1e-10) throw new Error('Path is too short.');
  let edge = 0,
    start = 0;
  return Array.from({ length: count }, (_, i) => {
    const s = (total * i) / count;
    while (edge < points.length - 1 && start + lengths[edge] < s) {
      start += lengths[edge++];
    }
    const a = points[edge],
      b = points[(edge + 1) % points.length],
      u = (s - start) / lengths[edge];
    return { re: a.re + (b.re - a.re) * u, im: a.im + (b.im - a.im) * u };
  });
}
export function smoothClosed(points: Complex[], passes: number): Complex[] {
  let out = points;
  for (let j = 0; j < passes; j++)
    out = out.map((q, i) => {
      const a = out[(i - 1 + out.length) % out.length],
        b = out[(i + 1) % out.length];
      return { re: (a.re + 2 * q.re + b.re) / 4, im: (a.im + 2 * q.im + b.im) / 4 };
    });
  return out;
}
export function normalizePath(points: Complex[]): Complex[] {
  if (points.length < 2) throw new Error('Path needs at least two points.');
  const xs = points.map((q) => q.re),
    ys = points.map((q) => q.im),
    xmin = Math.min(...xs),
    xmax = Math.max(...xs),
    ymin = Math.min(...ys),
    ymax = Math.max(...ys),
    scale = Math.max(xmax - xmin, ymax - ymin);
  if (scale < 1e-12) throw new Error('Path has zero extent.');
  return points.map((q) => ({
    re: ((q.re - (xmin + xmax) / 2) * 2.5) / scale,
    im: ((q.im - (ymin + ymax) / 2) * 2.5) / scale,
  }));
}
/** Complete M-bin DFT. For even M, Nyquist appears exactly once at n=-M/2. */
export function dft(points: Complex[]): Coefficient[] {
  const M = points.length;
  if (!M) throw new Error('No samples.');
  return Array.from({ length: M }, (_, i) => {
    const n = i - Math.floor(M / 2);
    let re = 0,
      im = 0;
    for (let k = 0; k < M; k++) {
      const a = (-TAU * n * k) / M,
        c = Math.cos(a),
        s = Math.sin(a),
        p = points[k];
      re += p.re * c - p.im * s;
      im += p.re * s + p.im * c;
    }
    return coefficient(n, re / M, im / M);
  });
}
export function activeCoefficients(
  cs: Coefficient[],
  N: number,
  disabled: number[] = [],
  mode: 'paired' | 'individual' = 'paired',
  terms = 2 * N + 1,
): Coefficient[] {
  const list = cs
    .filter((c) => Math.abs(c.n) <= N)
    .sort((a, b) => Math.abs(a.n) - Math.abs(b.n) || b.n - a.n);
  return (mode === 'individual' ? list.slice(0, terms) : list).filter(
    (c) => !disabled.includes(c.n),
  );
}
export function synthesize(cs: Coefficient[], t: number): Complex {
  let re = 0,
    im = 0;
  for (const c of cs) {
    const a = TAU * c.n * t,
      co = Math.cos(a),
      si = Math.sin(a);
    re += c.re * co - c.im * si;
    im += c.re * si + c.im * co;
  }
  return { re, im };
}
export const sampleSynthesis = (cs: Coefficient[], M = 512) =>
  Array.from({ length: M }, (_, k) => synthesize(cs, k / M));
export function metrics(points: Complex[], cs: Coefficient[], selected: Coefficient[]) {
  const total = points.reduce((s, p) => s + abs2(p), 0) / points.length;
  const indices = new Set(selected.map((c) => c.n));
  const omitted = cs.reduce((s, c) => s + (indices.has(c.n) ? 0 : abs2(c)), 0);
  return {
    mse: omitted,
    relativeRms: total > 1e-20 ? Math.sqrt(omitted / total) : 0,
    energy: total > 1e-20 ? Math.max(0, 1 - omitted / total) : 1,
    total,
  };
}
export function directMse(a: Complex[], b: Complex[]) {
  if (a.length !== b.length) throw new Error('Sample lengths must match.');
  return a.reduce((s, p, i) => s + (p.re - b[i].re) ** 2 + (p.im - b[i].im) ** 2, 0) / a.length;
}
export function errorCurve(cs: Coefficient[], max = 100) {
  return Array.from({ length: max + 1 }, (_, N) =>
    cs.reduce((s, c) => s + (Math.abs(c.n) > N ? abs2(c) : 0), 0),
  );
}
export function innerProduct(x: Complex[], g: Complex[], dt: number): Complex {
  if (x.length !== g.length) throw new Error('Sample lengths must match.');
  return x.reduce(
    (s, p, i) => ({
      re: s.re + (p.re * g[i].re + p.im * g[i].im) * dt,
      im: s.im + (p.im * g[i].re - p.re * g[i].im) * dt,
    }),
    { re: 0, im: 0 },
  );
}
export function projection(x: Complex[], g: Complex[], dt: number): Complex {
  const a = innerProduct(x, g, dt),
    b = innerProduct(g, g, dt).re;
  if (b < 1e-14) throw new Error('Basis has zero energy on this interval.');
  return { re: a.re / b, im: a.im / b };
}
