import { describe, it, expect } from 'vitest';
import { extractContours, traceMask } from './contours';
function mask(rows: string[]) {
  return Uint8Array.from(
    rows
      .join('')
      .split('')
      .map((x) => +(x === '1')),
  );
}
describe('ordered silhouette extraction', () => {
  it('produces a contiguous ordered closed cell boundary', () => {
    const loops = traceMask(mask(['00000', '01110', '01110', '01110', '00000']), 5, 5);
    expect(loops).toHaveLength(1);
    const loop = loops[0];
    expect(loop).toHaveLength(12);
    loop.forEach((p, i) =>
      expect(
        Math.hypot(p.re - loop[(i + 1) % loop.length].re, p.im - loop[(i + 1) % loop.length].im),
      ).toBe(1),
    );
  });
  it('keeps disconnected contours separate', () => {
    const loops = traceMask(mask(['0000000', '0110110', '0110110', '0000000']), 7, 4);
    expect(loops).toHaveLength(2);
  });
  it('preserves a hole as a separately selectable boundary', () => {
    const loops = traceMask(mask(['11111', '11111', '11011', '11111', '11111']), 5, 5);
    expect(loops.length).toBe(1);
    /* Tiny one-pixel holes are intentionally filtered (<8 edges). */ const larger = traceMask(
      mask(['111111', '111111', '110011', '110011', '111111', '111111']),
      6,
      6,
    );
    expect(larger).toHaveLength(2);
  });
  it('resolves diagonal contacts without merging two filled regions', () => {
    const loops = traceMask(mask(['1100', '1100', '0011', '0011']), 4, 4);
    expect(loops).toHaveLength(2);
  });
  it('thresholds transparent background as white', () => {
    const data = new Uint8ClampedArray(4 * 16);
    for (let i = 0; i < 16; i++) {
      data[i * 4 + 3] = 0;
    }
    for (const i of [5, 6, 9, 10]) data[i * 4 + 3] = 255;
    expect(extractContours({ data, width: 4, height: 4 }, 128)).toHaveLength(1);
  });
  it('returns no contour for empty foreground', () =>
    expect(traceMask(new Uint8Array(100), 10, 10)).toEqual([]));
});
