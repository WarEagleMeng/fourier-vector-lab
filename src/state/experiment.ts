import { exampleNames, examplePath } from '../content/examples';
import type { Complex } from '../math/fourier';
export type Experiment = {
  version: 1;
  name: string;
  points: Complex[];
  N: number;
  speed: number;
  smoothing: number;
  disabled: number[];
};
export function parseExperiment(value: unknown): Experiment {
  const x = value as Experiment;
  if (
    !x ||
    x.version !== 1 ||
    typeof x.name !== 'string' ||
    x.name.length > 100 ||
    !Array.isArray(x.points) ||
    x.points.length < 2 ||
    x.points.length > 4096 ||
    x.points.some(
      (p) =>
        !p ||
        !Number.isFinite(p.re) ||
        !Number.isFinite(p.im) ||
        Math.abs(p.re) > 100 ||
        Math.abs(p.im) > 100,
    ) ||
    !Number.isInteger(x.N) ||
    x.N < 0 ||
    x.N > 100 ||
    !Number.isFinite(x.speed) ||
    x.speed < 0.1 ||
    x.speed > 3 ||
    !Number.isInteger(x.smoothing) ||
    x.smoothing < 0 ||
    x.smoothing > 8 ||
    !Array.isArray(x.disabled) ||
    x.disabled.length > 201 ||
    x.disabled.some((n) => !Number.isInteger(n) || Math.abs(n) > 100)
  )
    throw new Error('Invalid experiment. Use a version 1 Fourier Vector Lab JSON file.');
  if (!x.points.some((p) => Math.hypot(p.re - x.points[0].re, p.im - x.points[0].im) > 1e-10))
    throw new Error('Experiment path has zero extent.');
  return {
    version: 1,
    name: x.name,
    points: x.points.map((p) => ({ re: p.re, im: p.im })),
    N: x.N,
    speed: x.speed,
    smoothing: x.smoothing,
    disabled: [...new Set(x.disabled)],
  };
}
export function download(name: string, data: Blob | string, type = 'text/plain') {
  const url = URL.createObjectURL(typeof data === 'string' ? new Blob([data], { type }) : data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export function encodeShare(x: Experiment) {
  const preset = exampleNames.find(
    (name) => name === x.name && JSON.stringify(examplePath(name)) === JSON.stringify(x.points),
  );
  const text = JSON.stringify(preset ? { ...x, points: undefined, preset } : x);
  if (text.length > 5500)
    throw new Error(
      'This contour is too large for a share link. Save JSON instead; uploaded images never enter URLs.',
    );
  return btoa(unescape(encodeURIComponent(text)));
}
export function decodeShare(hash: string) {
  if (hash.length > 10000) throw new Error('Share link is too large.');
  const x = JSON.parse(decodeURIComponent(escape(atob(hash))));
  if (x.preset) {
    if (!exampleNames.includes(x.preset)) throw new Error('Unknown drawing preset.');
    x.points = examplePath(x.preset);
  }
  return parseExperiment(x);
}
