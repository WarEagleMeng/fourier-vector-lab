import { describe, it, expect } from 'vitest';
import {
  TAU,
  dft,
  coefficient,
  sampleSynthesis,
  synthesize,
  activeCoefficients,
  metrics,
  abs2,
  directMse,
  resampleClosed,
  smoothClosed,
  projection,
  innerProduct,
  errorCurve,
} from './fourier';
import { trigCoefficients, trigSum } from './signals';
import { examplePath } from '../content/examples';
const synthetic = [coefficient(0, 2, -0.5), coefficient(1, 0.3, 0.4), coefficient(-3, -0.2, 0.7)];
describe('normalized complex Fourier transform', () => {
  it('a circle has only a single positive rotating exponential', () => {
    const M = 128,
      points = Array.from({ length: M }, (_, k) => ({
        re: Math.cos((TAU * k) / M),
        im: Math.sin((TAU * k) / M),
      })),
      cs = dft(points);
    expect(cs.find((c) => c.n === 1)!.re).toBeCloseTo(1, 12);
    expect(cs.filter((c) => c.n !== 1).every((c) => c.magnitude < 1e-12)).toBe(true);
    expect(directMse(points, sampleSynthesis(activeCoefficients(cs, 1), M))).toBeLessThan(1e-25);
  });
  it('translation is a nonzero DC coefficient', () => {
    const pts = sampleSynthesis([coefficient(0, 2, -3), coefficient(1, 1, 0)], 128),
      cs = dft(pts),
      dc = cs.find((c) => c.n === 0)!;
    expect(dc.re).toBeCloseTo(2, 12);
    expect(dc.im).toBeCloseTo(-3, 12);
    expect(directMse(pts, sampleSynthesis(activeCoefficients(cs, 1), 128))).toBeLessThan(1e-24);
  });
  it('recovers known independent positive and negative coefficients', () => {
    const cs = dft(sampleSynthesis(synthetic, 128));
    for (const known of synthetic) {
      const actual = cs.find((c) => c.n === known.n)!;
      expect(actual.re).toBeCloseTo(known.re, 12);
      expect(actual.im).toBeCloseTo(known.im, 12);
    }
    expect(cs.find((c) => c.n === 3)!.magnitude).toBeLessThan(1e-12);
  });
  it('reconstructs every sample using all DFT bins, including Nyquist once', () => {
    const points = Array.from({ length: 64 }, (_, i) => ({
      re: Math.sin(i * 1.19) + (-1) ** i * 0.2,
      im: Math.cos(i * 0.72),
    }));
    const cs = dft(points);
    expect(new Set(cs.map((c) => c.n)).size).toBe(64);
    expect(directMse(points, sampleSynthesis(cs, 64))).toBeLessThan(1e-24);
  });
  it('implements Parseval with 1/M forward normalization', () => {
    const points = sampleSynthesis(synthetic, 128),
      cs = dft(points);
    expect(points.reduce((s, p) => s + abs2(p), 0) / 128).toBeCloseTo(
      cs.reduce((s, c) => s + abs2(c), 0),
      12,
    );
  });
  it('omitted energy matches direct sampled error even for disabled harmonics', () => {
    const points = sampleSynthesis(synthetic, 128),
      cs = dft(points),
      selected = activeCoefficients(cs, 3, [1]);
    expect(metrics(points, cs, selected).mse).toBeCloseTo(
      directMse(points, sampleSynthesis(selected, 128)),
      12,
    );
    expect(metrics(points, cs, selected).mse).toBeCloseTo(0.25, 12);
  });
  it('decreases squared error monotonically as paired order increases', () => {
    const points = resampleClosed(examplePath('Heart'), 128),
      cs = dft(points),
      curve = errorCurve(cs, 50);
    for (let n = 1; n < curve.length; n++)
      expect(curve[n]).toBeLessThanOrEqual(curve[n - 1] + 1e-14);
    expect(curve[20]).toBeLessThan(curve[1]);
  });
  it('order zero contains DC and paired order N has at most 2N+1 terms', () => {
    const cs = dft(sampleSynthesis(synthetic, 128));
    expect(activeCoefficients(cs, 0).map((c) => c.n)).toEqual([0]);
    expect(activeCoefficients(cs, 12)).toHaveLength(25);
  });
  it('individual ordering is explicitly DC,+1,-1,+2,-2', () => {
    const cs = dft(sampleSynthesis(synthetic, 128));
    expect(activeCoefficients(cs, 10, [], 'individual', 5).map((c) => c.n)).toEqual([
      0, 1, -1, 2, -2,
    ]);
  });
  it('negative frequency rotates clockwise in y-up coordinates', () => {
    const p = synthesize([coefficient(-1, 1, 0)], 0.25);
    expect(p.re).toBeCloseTo(0, 12);
    expect(p.im).toBeCloseTo(-1, 12);
  });
  it('calculates magnitude and the full-quadrant phase', () => {
    const c = coefficient(2, -3, 4);
    expect(c.magnitude).toBe(5);
    expect(c.phase).toBeCloseTo(2.214297435588181, 12);
  });
});
describe('uniform closed contour resampling', () => {
  it('uses equal arc lengths and omits the repeated endpoint', () => {
    const square = [
        { re: 0, im: 0 },
        { re: 2, im: 0 },
        { re: 2, im: 2 },
        { re: 0, im: 2 },
        { re: 0, im: 0 },
      ],
      p = resampleClosed(square, 16);
    expect(p).toHaveLength(16);
    expect(p[0]).toEqual({ re: 0, im: 0 });
    for (let i = 0; i < 16; i++)
      expect(Math.hypot(p[i].re - p[(i + 1) % 16].re, p[i].im - p[(i + 1) % 16].im)).toBeCloseTo(
        0.5,
        12,
      );
  });
  it('ignores duplicate vertices without NaN', () => {
    const p = resampleClosed(
      [
        { re: 0, im: 0 },
        { re: 0, im: 0 },
        { re: 1, im: 0 },
        { re: 1, im: 1 },
      ],
      32,
    );
    expect(p.every((q) => Number.isFinite(q.re) && Number.isFinite(q.im))).toBe(true);
  });
  it('rejects zero extent', () =>
    expect(() =>
      resampleClosed([
        { re: 0, im: 0 },
        { re: 0, im: 0 },
      ]),
    ).toThrow());
  it('smoothing retains periodic boundaries and constant signals', () => {
    const p = Array.from({ length: 8 }, () => ({ re: 2, im: 3 }));
    expect(smoothClosed(p, 4)).toEqual(p);
  });
});
describe('real Fourier series and projection', () => {
  it('matches the Lecture 31 square-wave coefficients', () => {
    const { dc, terms } = trigCoefficients('square', 10);
    expect(dc).toBe(0);
    terms.forEach((c) => {
      expect(c.a).toBe(0);
      expect(c.b).toBeCloseTo(c.n % 2 ? 4 / (Math.PI * c.n) : 0, 12);
    });
  });
  it('evaluates the exact N=1 energy formula (lecture table typo documented)', () => {
    expect(2 * Math.PI - 16 / Math.PI).toBeCloseTo(1.1902271282389352, 12);
  });
  it('uses signed compact phase atan2(-b,a)', () => {
    const c = trigCoefficients('square', 1).terms[0];
    expect(c.phase).toBeCloseTo(-Math.PI / 2, 12);
  });
  it('matches Lecture 32 periodic exponential mean and first component', () => {
    const { dc, terms } = trigCoefficients('exponential', 3);
    expect(dc).toBeCloseTo(0.5042795, 6);
    expect(terms[0].amplitude).toBeCloseTo(0.24461, 3);
    expect((terms[0].phase * 180) / Math.PI).toBeCloseTo(-75.96376, 4);
  });
  it('triangle and sawtooth converge at continuity points', () => {
    const tr = trigCoefficients('triangle', 100),
      sw = trigCoefficients('sawtooth', 100);
    expect(trigSum(tr.dc, tr.terms, 0.125)).toBeCloseTo(0.5, 4);
    expect(trigSum(sw.dc, sw.terms, 0.25)).toBeCloseTo(-0.5, 2);
  });
  it('projects a square wave onto sin(t) with c=4/pi', () => {
    const M = 4096,
      dt = TAU / M,
      g = Array.from({ length: M }, (_, k) => ({ re: Math.sin((k + 0.5) * dt), im: 0 })),
      x = g.map((g) => ({ re: g.re >= 0 ? 1 : -1, im: 0 }));
    expect(projection(x, g, dt).re).toBeCloseTo(4 / Math.PI, 6);
  });
  it('conjugates the second argument for complex projection', () => {
    const g = Array.from({ length: 128 }, (_, k) => ({
        re: Math.cos((TAU * k) / 128),
        im: Math.sin((TAU * k) / 128),
      })),
      x = g.map((p) => ({ re: 2 * p.re - 3 * p.im, im: 3 * p.re + 2 * p.im })),
      c = projection(x, g, 1 / 128);
    expect(c.re).toBeCloseTo(2, 12);
    expect(c.im).toBeCloseTo(3, 12);
  });
  it('sine/cosine are orthogonal on a whole period, and satisfy Pythagoras', () => {
    const M = 1024,
      dt = TAU / M,
      x = Array.from({ length: M }, (_, k) => ({ re: Math.sin((k + 0.5) * dt), im: 0 })),
      y = Array.from({ length: M }, (_, k) => ({ re: Math.cos((k + 0.5) * dt), im: 0 }));
    expect(innerProduct(x, y, dt).re).toBeCloseTo(0, 12);
    const z = x.map((p, i) => ({ re: p.re + y[i].re, im: 0 }));
    expect(innerProduct(z, z, dt).re).toBeCloseTo(
      innerProduct(x, x, dt).re + innerProduct(y, y, dt).re,
      12,
    );
  });
  it('rejects a zero-energy basis', () =>
    expect(() => projection([{ re: 1, im: 0 }], [{ re: 0, im: 0 }], 1)).toThrow());
});

it('the built-in circle stays a single exponential through the actual resampling pipeline', () => {
  const points = resampleClosed(smoothClosed(resampleClosed(examplePath('Circle')), 0)),
    cs = dft(points);
  expect(cs.filter((c) => c.magnitude > 1e-9).map((c) => c.n)).toEqual([1]);
  expect(metrics(points, cs, activeCoefficients(cs, 1)).relativeRms).toBeLessThan(1e-10);
});
