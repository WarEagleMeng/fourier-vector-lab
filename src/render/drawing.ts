import { synthesize, TAU, type Complex, type Coefficient } from '../math/fourier';
export type Layers = {
  vectors: boolean;
  circles: boolean;
  original: boolean;
  reconstruction: boolean;
  trace: boolean;
  contribution: boolean;
  grid: boolean;
};
export type DrawingScene = {
  points: Complex[];
  curve: Complex[];
  cs: Coefficient[];
  t: number;
  trace: Complex[];
  layers: Layers;
  inspected?: Coefficient;
  comparison?: Complex[][];
  light?: boolean;
};
export function drawScene(canvas: HTMLCanvasElement, scene: DrawingScene) {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const green = scene.light ? '#087749' : '#6de5ad',
    purple = scene.light ? '#7144b7' : '#b29aef',
    blue = scene.light ? '#366da5' : '#8dbff0',
    amber = scene.light ? '#916014' : '#efbf78';
  const light = scene.light,
    muted = light ? '#73849a' : '#596779',
    fg = light ? '#263e52' : '#c1cbd9',
    bg = light ? '#f5f8fb' : '#0b1420';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  // Fit original and reconstructed paths, never change scaling during playback.
  const max = Math.max(
    1.7,
    ...scene.points.map((p) => Math.max(Math.abs(p.re), Math.abs(p.im))),
    ...scene.curve.map((p) => Math.max(Math.abs(p.re), Math.abs(p.im))),
  );
  const scale = Math.min(width, height) / (2 * max + 1),
    cx = width / 2,
    cy = height / 2;
  const X = (x: number) => cx + x * scale,
    Y = (y: number) => cy - y * scale;
  if (scene.layers.grid) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = light ? '#e0e7ef' : '#192433';
    for (let i = -Math.ceil(width / scale); i <= width / scale; i++) {
      ctx.beginPath();
      ctx.moveTo(X(i * 0.5), 0);
      ctx.lineTo(X(i * 0.5), height);
      ctx.stroke();
    }
    for (let i = -Math.ceil(height / scale); i <= height / scale; i++) {
      ctx.beginPath();
      ctx.moveTo(0, Y(i * 0.5));
      ctx.lineTo(width, Y(i * 0.5));
      ctx.stroke();
    }
    ctx.strokeStyle = light ? '#c6d2df' : '#2a3749';
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();
    ctx.fillStyle = muted;
    ctx.font = '11px monospace';
    ctx.fillText('Re', width - 28, cy - 9);
    ctx.fillText('Im', cx + 10, 23);
    ctx.fillText('0', cx + 7, cy + 16);
  }
  const path = (points: Complex[], color: string, line = 1, dash: number[] = [], close = true) => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = line;
    ctx.setLineDash(dash);
    points.forEach((p, i) => (i ? ctx.lineTo(X(p.re), Y(p.im)) : ctx.moveTo(X(p.re), Y(p.im))));
    if (close) ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  };
  if (scene.layers.original) path(scene.points, light ? '#a1b0bf' : '#405165', 1, [4, 5]);
  scene.comparison?.forEach((c, i) => path(c, ['#bba0f0', '#f0ae6e', '#7dbaeb'][i], 1, [5, 5]));
  if (scene.layers.reconstruction) path(scene.curve, light ? '#8cae9f' : '#254f43', 1.5);
  if (scene.layers.trace) path(scene.trace, green, 2.5, [], false);
  let origin: Complex = { re: 0, im: 0 };
  scene.cs.forEach((c) => {
    const step = synthesize([c], scene.t),
      end = { re: origin.re + step.re, im: origin.im + step.im };
    const selected = c.n === scene.inspected?.n;
    if (scene.layers.circles && c.n !== 0 && c.magnitude * scale > 0.6) {
      ctx.beginPath();
      ctx.arc(X(origin.re), Y(origin.im), c.magnitude * scale, 0, TAU);
      ctx.strokeStyle = selected ? '#e9b96588' : light ? '#5476ac35' : '#7b9ed143';
      ctx.lineWidth = selected ? 1.8 : 1;
      ctx.stroke();
    }
    if (scene.layers.vectors && c.magnitude * scale > 0.4) {
      const color = selected ? amber : c.n < 0 ? purple : c.n === 0 ? fg : blue;
      ctx.strokeStyle = color;
      ctx.lineWidth = selected ? 2 : 1.3;
      ctx.beginPath();
      ctx.moveTo(X(origin.re), Y(origin.im));
      ctx.lineTo(X(end.re), Y(end.im));
      ctx.stroke();
      const a = Math.atan2(-step.im, step.re),
        s = 4;
      ctx.beginPath();
      ctx.moveTo(X(end.re), Y(end.im));
      ctx.lineTo(X(end.re) - s * Math.cos(a - 0.45), Y(end.im) - s * Math.sin(a - 0.45));
      ctx.moveTo(X(end.re), Y(end.im));
      ctx.lineTo(X(end.re) - s * Math.cos(a + 0.45), Y(end.im) - s * Math.sin(a + 0.45));
      ctx.stroke();
    }
    origin = end;
  });
  if (scene.layers.contribution && scene.inspected) {
    const p = synthesize([scene.inspected], scene.t);
    path([{ re: 0, im: 0 }, p], amber, 2, [], false);
    ctx.fillStyle = amber;
    ctx.font = '12px monospace';
    ctx.fillText(`n = ${scene.inspected.n} alone`, X(p.re) + 8, Y(p.im));
  }
  ctx.beginPath();
  ctx.arc(X(origin.re), Y(origin.im), 4.2, 0, TAU);
  ctx.fillStyle = green;
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#6de5ad';
  ctx.fill();
  ctx.shadowBlur = 0;
}
