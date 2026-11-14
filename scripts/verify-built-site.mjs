import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const prefix = '/fourier-vector-lab/';
await fs.mkdir(path.join(root, 'qa'), { recursive: true });

// Serve only the repository subdirectory: accidental root URLs must fail.
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
    const relative = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
    const file = path.resolve(dist, relative);
    if (!file.startsWith(dist + path.sep)) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(file);
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  const html = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
  const references = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map((m) => m[1]);
  if (!references.some((s) => s.endsWith('.js')) || !references.some((s) => s.endsWith('.css'))) throw new Error('Missing JS or CSS entry.');
  for (const ref of references) if (!ref.startsWith(prefix)) throw new Error(`Asset escaped repository base: ${ref}`);
  const files = (await fs.readdir(dist, { recursive: true, withFileTypes: true })).filter((f) => f.isFile());
  for (const file of files) {
    const absolute = path.join(file.parentPath, file.name);
    const relative = path.relative(dist, absolute).split(path.sep).map(encodeURIComponent).join('/');
    const response = await fetch(origin + prefix + relative);
    if (!response.ok) throw new Error(`Asset HTTP ${response.status}: ${relative}`);
    const served = Buffer.from(await response.arrayBuffer());
    if (!served.equals(await fs.readFile(absolute))) throw new Error(`Asset bytes differ: ${relative}`);
  }
  browser = await chromium.launch({ channel: process.env.CI ? undefined : 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], failed = [], external = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => failed.push(r.url()));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) failed.push(`${r.status()} ${r.url()}`); });
  page.on('request', (r) => { if (!r.url().startsWith(origin) && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) external.push(r.url()); });
  await page.goto(origin + prefix);
  await expect(page.getByRole('heading', { name: /Fourier Drawing Studio/ })).toBeVisible();
  await page.getByRole('slider', { name: 'Harmonic order', exact: true }).fill('100');
  await page.locator('.canvas-wrap').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('.time-stamp').textContent()).not.toBe('t / T = 0.000');
  await page.screenshot({ path: path.join(root, 'qa', 'production-drawing.png'), fullPage: true });
  for (const [tab, heading] of [['Signal Reconstruction', 'Signal Reconstruction'], ['Signals as Vectors', 'Signals as Vectors'], ['Music Studio', 'Fourier Music Studio']]) {
    await page.getByRole('button', { name: new RegExp(tab) }).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  if (errors.length || failed.length || external.length) throw new Error(JSON.stringify({ errors, failed, external }));
  const result = { ok: true, base: prefix, builtAssetsVerified: files.length, htmlAssetReferences: references, pageErrors: errors, failedRequests: failed, externalRequests: external, laboratoriesOpened: 4 };
  await fs.writeFile(path.join(root, 'qa', 'pages-deployment-check.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
