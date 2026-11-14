import { normalizePath, type Complex } from '../math/fourier';
export type Raster = { data: Uint8ClampedArray; width: number; height: number };
/** Oriented boundaries of occupied pixel cells; never an unordered edge-pixel cloud. */
export function traceMask(mask: Uint8Array, width: number, height: number): Complex[][] {
  type Edge = { x: number; y: number; X: number; Y: number; dir: number; used: boolean };
  const edges: Edge[] = [],
    starts = new Map<string, number[]>();
  const add = (x: number, y: number, X: number, Y: number, dir: number) => {
    const key = x + ',' + y;
    const i = edges.push({ x, y, X, Y, dir, used: false }) - 1;
    starts.set(key, [...(starts.get(key) || []), i]);
  };
  const on = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && !!mask[y * width + x];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (on(x, y)) {
        if (!on(x, y - 1)) add(x, y, x + 1, y, 0);
        if (!on(x + 1, y)) add(x + 1, y, x + 1, y + 1, 1);
        if (!on(x, y + 1)) add(x + 1, y + 1, x, y + 1, 2);
        if (!on(x - 1, y)) add(x, y + 1, x, y, 3);
      }
  const loops: Complex[][] = [];
  for (const first of edges) {
    if (first.used) continue;
    let e = first;
    const loop: Complex[] = [];
    let closed = false;
    for (let guard = 0; guard <= edges.length; guard++) {
      e.used = true;
      loop.push({ re: e.x, im: -e.y });
      if (e.X === first.x && e.Y === first.y) {
        closed = true;
        break;
      }
      const next = (starts.get(e.X + ',' + e.Y) || [])
        .map((i) => edges[i])
        .filter((a) => !a.used)
        .sort((a, b) => {
          const rank = (d: number) => [1, 0, 3, 2].indexOf((d - e.dir + 4) % 4);
          return rank(a.dir) - rank(b.dir);
        })[0];
      if (!next) break;
      e = next;
    }
    if (closed && loop.length >= 8) loops.push(loop);
  }
  return loops.sort((a, b) => b.length - a.length).slice(0, 40);
}
export function extractContours(raster: Raster, threshold: number, invert = false): Complex[][] {
  const mask = new Uint8Array(raster.width * raster.height);
  for (let i = 0; i < mask.length; i++) {
    const j = i * 4,
      alpha = raster.data[j + 3] / 255;
    const gray =
      alpha *
        (0.2126 * raster.data[j] + 0.7152 * raster.data[j + 1] + 0.0722 * raster.data[j + 2]) +
      255 * (1 - alpha);
    mask[i] = Number(invert ? gray >= threshold : gray < threshold);
  }
  return traceMask(mask, raster.width, raster.height);
}
export async function decodeRaster(file: File): Promise<{ raster: Raster; url: string }> {
  if (file.size > 20 * 1024 * 1024) throw new Error('Choose an image smaller than 20 MB.');
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('Use PNG, JPEG, WebP, or an SVG path.');
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
    const scale = Math.min(1, 320 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return { url, raster: { data, width: canvas.width, height: canvas.height } };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('This image could not be decoded.');
  }
}
export function svgContours(source: string): Complex[][] {
  if (source.length > 1_000_000) throw new Error('SVG exceeds 1 MB.');
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid SVG.');
  const paths = Array.from(doc.querySelectorAll('path')).slice(0, 40);
  if (!paths.length)
    throw new Error('This SVG needs a path element. Convert shapes/text to paths first.');
  return paths.map((el) => {
    if (el.hasAttribute('transform') || el.closest('g[transform]'))
      throw new Error('Flatten SVG transforms before importing.');
    const d = el.getAttribute('d') || '';
    if ((d.match(/[Mm]/g) || []).length > 1)
      throw new Error('Split compound SVG paths into separate path elements first.');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    const length = path.getTotalLength();
    if (!Number.isFinite(length) || length < 1e-6) throw new Error('SVG path has zero length.');
    return normalizePath(
      Array.from({ length: 1024 }, (_, k) => {
        const q = path.getPointAtLength((k * length) / 1024);
        return { re: q.x, im: -q.y };
      }),
    );
  });
}
