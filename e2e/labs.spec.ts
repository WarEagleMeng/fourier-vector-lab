import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10 L90 10 L90 90 L10 90 Z"/><path d="M35 35 L65 35 L50 65 Z"/></svg>';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Fourier Drawing Studio/ })).toBeVisible();
});
test('animation advances, pauses, restarts and steps without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const stamp = page.locator('.time-stamp');
  await expect.poll(() => stamp.textContent()).not.toBe('t / T = 0.000');
  await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
  await page.waitForTimeout(150);
  const paused = await stamp.textContent();
  await page.waitForTimeout(250);
  expect(await stamp.textContent()).toBe(paused);
  await page.getByRole('button', { name: 'Restart animation' }).click();
  await expect(stamp).toHaveText('t / T = 0.000');
  await page.getByRole('button', { name: 'Step forward', exact: true }).click();
  await expect(stamp).toHaveText('t / T = 0.002');
  await page.getByRole('button', { name: 'Step backward', exact: true }).click();
  await expect(stamp).toHaveText('t / T = 0.000');
  expect(errors).toEqual([]);
});
test('supports DC-only, signed spectra and disabling a harmonic', async ({ page }) => {
  const range = page.getByRole('slider', { name: 'Harmonic order', exact: true });
  await range.fill('0');
  await expect(page.getByTestId('harmonic-order')).toHaveText('0');
  await expect(page.locator('.frequency-range')).toContainText('1 available terms');
  await range.fill('12');
  await page.getByLabel('Selected harmonic', { exact: true }).selectOption('-1');
  await expect(page.locator('.inspector-details')).toContainText('Clockwise');
  const before = await page.locator('.error-metrics').textContent();
  await page.getByRole('checkbox', { name: 'Enable this harmonic' }).uncheck();
  expect(await page.locator('.error-metrics').textContent()).not.toBe(before);
  await page.getByRole('button', { name: 'Amplitude harmonic 1', exact: true }).click();
  await expect(page.getByLabel('Selected harmonic', { exact: true })).toHaveValue('1');
});
test('examples, layers, comparison, coefficient progression and evolution', async ({ page }) => {
  await page.getByRole('button', { name: 'Star example' }).click();
  await expect(page.locator('.canvas-toolbar')).toContainText('Star');
  await page.getByRole('checkbox', { name: 'Vector circles', exact: true }).uncheck();
  await page.getByText('Coefficient order', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Progression' }).selectOption('individual');
  await page.getByRole('slider', { name: 'Included coefficients' }).fill('3');
  await expect(page.locator('.canvas-toolbar')).toContainText('3 enabled terms');
  await page.getByRole('checkbox', { name: 'Compare N = 1, 5, 20' }).check();
  await page.getByRole('slider', { name: 'Harmonic order', exact: true }).fill('3');
  await page.getByRole('button', { name: 'Evolve from N = 0' }).click();
  await expect(page.getByTestId('harmonic-order')).toHaveText('0');
  await expect(page.getByTestId('harmonic-order')).toHaveText('3', { timeout: 6000 });
});
test('imports multiple SVG paths and selects an ordered contour', async ({ page }) => {
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({ name: 'two-paths.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
  await expect(page.getByRole('combobox', { name: 'Select contour' })).toHaveValue('0');
  await expect(
    page.getByRole('combobox', { name: 'Select contour' }).locator('option'),
  ).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Select contour' }).selectOption('1');
  await expect(page.locator('.canvas-toolbar')).toContainText('SVG contour');
});
test('raster threshold, contour selection and local image comparison', async ({ page }) => {
  const buffer = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 100;
    c.height = 100;
    const x = c.getContext('2d')!;
    x.fillStyle = 'white';
    x.fillRect(0, 0, 100, 100);
    x.fillStyle = 'black';
    x.fillRect(10, 10, 30, 70);
    x.fillRect(60, 10, 30, 70);
    const blob = await new Promise<Blob>((resolve) => c.toBlob((b) => resolve(b!), 'image/png'));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({ name: 'two-regions.png', mimeType: 'image/png', buffer: Buffer.from(buffer) });
  await expect(page.getByAltText('Original uploaded image')).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Select contour' }).locator('option'),
  ).toHaveCount(2);
  await page.getByRole('slider', { name: 'Threshold' }).fill('100');
  await page.getByRole('combobox', { name: 'Select contour' }).selectOption('1');
  await expect(page.locator('.canvas-toolbar')).toContainText('Image contour');
});
test('manual drawing accepts pointer input and closes the path', async ({ page }) => {
  await page.getByRole('button', { name: 'Draw your own path' }).click();
  const pad = page.getByLabel('Freehand contour drawing');
  const box = (await pad.boundingBox())!;
  await page.mouse.move(box.x + 50, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 60, box.y + 60, { steps: 12 });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height - 40, { steps: 12 });
  await page.mouse.move(box.x + 50, box.y + 60, { steps: 12 });
  await page.mouse.up();
  await page.getByRole('button', { name: /Use closed path/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.canvas-toolbar')).toContainText('Hand-drawn contour');
});
test('JSON experiment saves and reloads settings', async ({ page }) => {
  await page.getByRole('slider', { name: 'Harmonic order', exact: true }).fill('27');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save JSON', exact: true }).click();
  const dl = await pending,
    filepath = (await dl.path())!,
    content = await fs.readFile(filepath, 'utf8');
  expect(JSON.parse(content).N).toBe(27);
  await page.getByRole('button', { name: 'Reset lab' }).click();
  await page
    .locator('input[type=file]')
    .nth(1)
    .setInputFiles({
      name: 'experiment.json',
      mimeType: 'application/json',
      buffer: Buffer.from(content),
    });
  await expect(page.getByTestId('harmonic-order')).toHaveText('27');
  await expect(page.getByRole('button', { name: 'Play animation', exact: true })).toBeVisible();
});
test('exports SVG, PNG and signed-frequency CSV', async ({ page }) => {
  for (const name of ['SVG', 'PNG', 'CSV']) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name, exact: true }).click();
    const dl = await pending,
      p = (await dl.path())!,
      stat = await fs.stat(p);
    expect(stat.size).toBeGreaterThan(100);
    if (name === 'SVG') expect(await fs.readFile(p, 'utf8')).toContain('<path');
    if (name === 'CSV') {
      const csv = await fs.readFile(p, 'utf8');
      expect(csv).toContain('-100,');
      expect(csv).toContain('100,');
      expect(csv.split('\n')).toHaveLength(202);
    }
  }
});
test('validates malformed configurations instead of crashing', async ({ page }) => {
  await page
    .locator('input[type=file]')
    .nth(1)
    .setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"version":1,"N":999}'),
    });
  await expect(page.locator('.status-banner')).toContainText('Invalid experiment');
  await expect(page.getByTestId('harmonic-order')).toHaveText('12');
});
test('real-signal lab changes waveform and supports custom samples', async ({ page }) => {
  await page.getByRole('button', { name: /Signal Reconstruction/ }).click();
  await page.getByLabel('Periodic waveform').selectOption('exponential');
  await expect(page.getByText('0.5043', { exact: true })).toBeVisible();
  await page.getByLabel('Periodic waveform').selectOption('custom');
  await page.getByLabel('Custom signal samples').fill('0,2,0,-2');
  await page.getByRole('button', { name: 'Apply samples' }).click();
  await expect(page.locator('p[role=status]')).toContainText('updated');
  await page.getByRole('slider', { name: 'Signal harmonic order' }).fill('0');
  await expect(page.getByRole('heading', { name: /Error signal/ })).toBeVisible();
});
test('projection lab reaches 4/pi and demonstrates orthogonality', async ({ page }) => {
  await page.getByRole('button', { name: /Signals as Vectors/ }).click();
  await page.getByRole('button', { name: 'Use optimal coefficient' }).click();
  await expect(page.getByRole('slider', { name: 'Real part of c' })).toHaveValue('1.27');
  await expect(page.locator('.projection-equation')).toContainText('1.2732');
  await page.getByRole('button', { name: 'Try an orthogonal pair' }).click();
  await expect(page.locator('.projection-equation')).toContainText('= 0 + j0');
  await page.getByLabel('Target signal').selectOption('exp1');
  await page.getByLabel('Basis signal').selectOption('exp1');
  await page.getByRole('button', { name: 'Use optimal coefficient' }).click();
  await expect(page.locator('.projection-equation')).toContainText('= 1.0000 + j0');
});
test('music schedules audio after gesture, highlights notes and stops voices', async ({ page }) => {
  await page.getByRole('button', { name: /Music Studio/ }).click();
  await page.getByRole('button', { name: 'Music note 5', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Current note/ })).toContainText('5 / 35');
  await page.getByRole('button', { name: 'Play from note 5' }).click();
  await expect(page.getByRole('button', { name: 'Play from note 5' })).toBeDisabled();
  await page.getByRole('button', { name: 'Stop music' }).click();
  await expect(page.getByRole('button', { name: /Play from note/ })).toBeEnabled();
  await page.getByRole('checkbox', { name: 'Melody voice' }).uncheck();
  await page.getByRole('checkbox', { name: 'Chord voices' }).uncheck();
  await page.getByRole('button', { name: /Play from note/ }).click();
  await expect(page.getByRole('status')).toContainText('Enable a melody or chord');
});
test('theme, classroom mode, guide, glossary and keyboard controls', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Present', exact: true }).click();
  await expect(page.locator('.app')).toHaveClass(/presentation-mode/);
  await page.getByRole('button', { name: 'Exit presentation' }).click();
  await page.getByRole('button', { name: 'Open guided introduction' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Glossary', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Parseval');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.locator('h1').click();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Play animation', exact: true })).toBeVisible();
  await page.keyboard.press('r');
  await expect(page.locator('.time-stamp')).toHaveText('t / T = 0.000');
});
test('WebM records a short animation when supported', async ({ page }) => {
  const supported = await page.evaluate(
    () => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm'),
  );
  test.skip(!supported, 'WebM unavailable');
  await page.getByRole('button', { name: 'WebM', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
  await page.waitForTimeout(1700);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Stop recording' }).click();
  const dl = await pending;
  expect(dl.suggestedFilename()).toMatch(/\.webm$/);
  expect((await fs.stat((await dl.path())!)).size).toBeGreaterThan(1000);
});
test('desktop, tablet and mobile fit viewport and produce visual evidence', async ({ page }) => {
  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['tablet', 900, 1100],
    ['mobile', 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await expect(page.locator('h1')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `qa/${name}-drawing.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.screenshot({ path: 'qa/light-drawing.png', fullPage: true });
});

test('copies an exact preset configuration and restores it from the URL', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          (window as unknown as { savedLink: string }).savedLink = text;
        },
      },
      configurable: true,
    });
  });
  await page.getByRole('slider', { name: 'Harmonic order', exact: true }).fill('38');
  const error = await page.locator('.error-metrics').textContent();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.locator('.status-banner')).toContainText('copied');
  const link = await page.evaluate(() => (window as unknown as { savedLink: string }).savedLink);
  expect(link.length).toBeLessThan(1000);
  await page.goto(link);
  await expect(page.getByTestId('harmonic-order')).toHaveText('38');
  expect(await page.locator('.error-metrics').textContent()).toBe(error);
});
test('fullscreen requests and exits the animation display', async ({ page }) => {
  await page.getByRole('button', { name: 'Fullscreen animation' }).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await page.getByRole('button', { name: 'Fullscreen animation' }).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
});

test('all laboratories render without page errors and offer reset controls', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.getByRole('button', { name: 'Circle example' }).click();
  await expect(page.locator('.canvas-toolbar')).toContainText('1 nonzero vectors');
  for (const [tab, filename] of [
    ['Signal Reconstruction', 'signal-lab'],
    ['Signals as Vectors', 'vector-lab'],
    ['Music Studio', 'music-lab'],
  ] as const) {
    await page.getByRole('button', { name: new RegExp(tab) }).click();
    await expect(page.getByRole('button', { name: 'Reset lab', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Reset lab', exact: true }).click();
    await page.screenshot({ path: `qa/${filename}.png`, fullPage: true });
    await page.setViewportSize({ width: 900, height: 1100 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  expect(errors).toEqual([]);
});
