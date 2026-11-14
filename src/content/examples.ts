import { TAU, normalizePath, type Complex } from '../math/fourier';
export const exampleNames = ['Heart', 'Circle', 'Square', 'Star', 'Portrait'] as const;
export type ExampleName = (typeof exampleNames)[number];
export function examplePath(name: string): Complex[] {
  if (name === 'Square')
    return [
      { re: -1, im: -1 },
      { re: 1, im: -1 },
      { re: 1, im: 1 },
      { re: -1, im: 1 },
    ];
  if (name === 'Star')
    return Array.from({ length: 10 }, (_, i) => {
      const a = Math.PI / 2 + (i * Math.PI) / 5,
        r = i % 2 ? 0.5 : 1.25;
      return { re: r * Math.cos(a), im: r * Math.sin(a) };
    });
  if (name === 'Portrait')
    return normalizePath(
      [
        [0.45, 1.4],
        [0.05, 1.6],
        [-0.45, 1.5],
        [-0.7, 1.2],
        [-0.72, 0.85],
        [-0.9, 0.6],
        [-0.75, 0.45],
        [-0.85, 0.3],
        [-0.62, 0.2],
        [-0.6, -0.12],
        [-0.3, -0.25],
        [-0.25, -0.6],
        [-0.9, -0.85],
        [-1.25, -1.4],
        [1.2, -1.4],
        [0.95, -0.8],
        [0.45, -0.5],
        [0.45, -0.1],
        [0.72, 0.3],
        [0.72, 0.85],
        [0.6, 1.2],
      ].map(([re, im]) => ({ re, im })),
    );
  const count = name === 'Circle' ? 512 : 360;
  return normalizePath(
    Array.from({ length: count }, (_, k) => {
      const t = (TAU * k) / count;
      return name === 'Circle'
        ? { re: Math.cos(t), im: Math.sin(t) }
        : {
            re: 16 * Math.sin(t) ** 3,
            im: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t),
          };
    }),
  );
}
export function pathD(points: Complex[], size = 64) {
  return (
    points
      .map(
        (p, i) =>
          `${i ? 'L' : 'M'}${(size / 2 + (p.re * size) / 3.4).toFixed(2)},${(size / 2 - (p.im * size) / 3.4).toFixed(2)}`,
      )
      .join(' ') + ' Z'
  );
}
