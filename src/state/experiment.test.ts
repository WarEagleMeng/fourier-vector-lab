import { examplePath } from '../content/examples';
import { describe, it, expect } from 'vitest';
import { parseExperiment, encodeShare, decodeShare, type Experiment } from './experiment';
const x: Experiment = {
  version: 1,
  name: 'Square',
  points: [
    { re: 0, im: 0 },
    { re: 1, im: 0 },
    { re: 1, im: 1 },
  ],
  N: 12,
  speed: 1,
  smoothing: 0,
  disabled: [-1],
};
describe('local experiment formats', () => {
  it('round-trips an experiment without image data', () =>
    expect(decodeShare(encodeShare(x))).toEqual(x));
  it('rejects invalid point values and huge paths', () => {
    expect(() =>
      parseExperiment({ ...x, points: [{ re: Infinity, im: 0 }, ...x.points] }),
    ).toThrow();
    expect(() => parseExperiment({ ...x, points: Array(5000).fill({ re: 0, im: 0 }) })).toThrow();
  });
  it('rejects out of range order, smoothing and speed', () => {
    expect(() => parseExperiment({ ...x, N: 101 })).toThrow();
    expect(() => parseExperiment({ ...x, speed: -1 })).toThrow();
    expect(() => parseExperiment({ ...x, smoothing: 9 })).toThrow();
  });
  it('refuses oversized configuration links', () =>
    expect(() =>
      encodeShare({ ...x, points: Array(512).fill({ re: 1.23456789, im: 0.123456789 }) }),
    ).toThrow(/too large/));
});

it('preserves an exact heart preset and keeps its share link small', () => {
  const e = { ...x, name: 'Heart', points: examplePath('Heart') };
  const encoded = encodeShare(e);
  expect(encoded.length).toBeLessThan(1000);
  expect(decodeShare(encoded)).toEqual(e);
});
it('rejects degenerate paths before applying settings', () =>
  expect(() =>
    parseExperiment({
      ...x,
      points: [
        { re: 0, im: 0 },
        { re: 0, im: 0 },
      ],
    }),
  ).toThrow(/zero extent/));
