import { TAU } from './fourier';
export type SignalKind = 'square' | 'triangle' | 'sawtooth' | 'exponential' | 'custom';
export type Trig = { n: number; a: number; b: number; amplitude: number; phase: number };
export function realSignal(kind: SignalKind, u: number, custom: number[] = []): number {
  const t = TAU * (((u % 1) + 1) % 1);
  switch (kind) {
    case 'square':
      return t < Math.PI ? 1 : -1;
    case 'triangle':
      return (2 / Math.PI) * Math.asin(Math.sin(t));
    case 'sawtooth':
      return t / Math.PI - 1;
    case 'exponential':
      return Math.exp(-t / 4);
    case 'custom': {
      const k = (((u % 1) + 1) % 1) * custom.length,
        i = Math.floor(k),
        v = k - i;
      return custom.length
        ? custom[i % custom.length] * (1 - v) + custom[(i + 1) % custom.length] * v
        : 0;
    }
  }
}
export function trigCoefficients(
  kind: SignalKind,
  N: number,
  custom: number[] = [],
): { dc: number; terms: Trig[] } {
  const dc =
    kind === 'exponential'
      ? (2 * (1 - Math.exp(-Math.PI / 2))) / Math.PI
      : kind === 'custom'
        ? custom.reduce((s, v) => s + v, 0) / custom.length || 0
        : 0;
  const terms = Array.from({ length: N }, (_, i) => {
    const n = i + 1;
    let a = 0,
      b = 0;
    if (kind === 'square' && n % 2) b = 4 / (Math.PI * n);
    if (kind === 'triangle' && n % 2) b = (8 / (Math.PI ** 2 * n * n)) * (-1) ** ((n - 1) / 2);
    if (kind === 'sawtooth') b = -2 / (Math.PI * n);
    if (kind === 'exponential') {
      a = (2 * dc) / (1 + 16 * n * n);
      b = (8 * n * dc) / (1 + 16 * n * n);
    }
    if (kind === 'custom') {
      const M = 2048;
      for (let k = 0; k < M; k++) {
        const u = (k + 0.5) / M,
          v = realSignal(kind, u, custom);
        a += (2 * v * Math.cos(TAU * n * u)) / M;
        b += (2 * v * Math.sin(TAU * n * u)) / M;
      }
    }
    return { n, a, b, amplitude: Math.hypot(a, b), phase: Math.atan2(-b, a) };
  });
  return { dc, terms };
}
export function trigSum(dc: number, terms: Trig[], u: number) {
  return (
    dc +
    terms.reduce((s, c) => s + c.a * Math.cos(TAU * c.n * u) + c.b * Math.sin(TAU * c.n * u), 0)
  );
}
