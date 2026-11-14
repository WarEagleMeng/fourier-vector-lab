# Test report

Verified locally on 13 November 2026, Windows, Node.js 24.22.1, pnpm 11.25.0, installed Microsoft Edge controlled with Playwright 1.65.0. Tests ran in a real headless browser, not a static mockup. GitHub-hosted CI has not been run.

## Final results

| Check | Result |
| --- | --- |
| TypeScript `tsc -b` | PASS |
| Production `vite build` | PASS |
| Vitest, 5 test files | **45 passed, 0 failed** |
| Full Playwright suite | **18 passed, 0 failed**, 30.5 s |
| After final chart-axis corrections | **4 affected browser cases rechecked, all passed**, 10.8 s |
| Built dist served under `/fourier-vector-lab/` | PASS |
| External requests during production smoke check | 0 |
| Browser page errors during production smoke check | 0 |
| Pinned `pnpm install --frozen-lockfile` | PASS |
| Source melody/beat/chord comparison with supplied MATLAB | Exact match for all 35 entries in each array and all 9 pitch constants |
| Declared active software dependency licenses | Permissive; CC-BY-4.0 compatibility dataset separately attributed |

The full suite passed before a final visual correction to one-sided real spectra and nonnegative energy/magnitude axes. The four browser cases covering the changed real-signal, vector and music labs were then re-run, along with the entire numerical/component suite and production smoke check. Browser HTML output in playwright-report reflects the most recent selected run; a fresh full `test:e2e` reproduces all 18 cases. Tests are not marked passed merely because they were written.

## Numerical and component coverage (45 cases)

- Fourier/resampling/projection: 25 cases. A circle's single exponential; DC translation; known independent positive/negative frequencies; complete DFT round-trip including one Nyquist bin; Parseval normalization; omitted energy versus direct sampled MSE with disabled terms; monotonically decreasing paired-order error; N versus 2N+1; individual coefficient order; negative rotation sign; complex magnitude and full-quadrant phase; uniform perimeter sampling; duplicates; zero extent; smoothing; lecture square-wave coefficients; exact N=1 error formula; compact phase; lecture exponential; triangle/sawtooth convergence; square projection 4/pi; complex conjugation; orthogonality/Pythagoras; zero-energy basis; and the built-in circle through the actual processing pipeline.
- Contours: 6 cases. Ordered contiguous cell boundaries, disconnected objects, holes/tiny-hole filtering, diagonal contacts, transparent-background compositing, empty foreground.
- Experiment formats: 6 cases. JSON/share round-trip, malformed/oversized points, parameter bounds, bounded URLs, exact compact preset sharing, degenerate-path rejection.
- Music/FFT: 4 cases. Original assignment lengths and D triad pitches, exact integer sample durations and endpoint ramps/no clipping, independent voice muting, synthetic-tone FFT peak within one bin.
- Accessible components: 4 cases. Named DC-only slider, labeled harmonic enable/disable, keyboard negative-index inspection, nonnegative compact-spectrum axis.

Core floating-point identities generally use 1e−12-level coefficient tolerances, full reconstruction MSE below 1e−24 for small synthetic tests, and appropriately looser quadrature/convergence tolerances. Tests use independent expected coefficients or physical identities instead of snapshotting implementation output.

## Browser coverage (18 cases)

1. Elapsed-time animation advances, pauses, restarts and steps; no page errors.
2. DC-only N=0, signed spectra, inspector direction, coefficient disabling changes error.
3. Examples, visible layers, order comparison, individual coefficient count, automated evolution.
4. Multiple safe SVG paths and contour selection.
5. Browser-generated two-region PNG upload, original image/contour comparison, threshold and contour selection.
6. Freehand pointer drawing and closed path acceptance.
7. JSON download and load restore order and pause state.
8. SVG, PNG and signed-frequency CSV downloads contain data and expected structure.
9. Malformed JSON reports an error without crashing or changing order.
10. Real waveforms, lecture exponential mean, custom samples and DC-only reconstruction.
11. Optimal 4/pi projection, orthogonal sine/cosine and a complex exponential basis.
12. Gesture-triggered Web Audio schedule, note selection and voice stopping/muting.
13. Theme, presentation, guide/glossary dialogs, Escape and drawing shortcuts.
14. WebM capture produces a nontrivial video file rather than a header-only container.
15. Desktop 1440x1000, tablet 900x1100, mobile 390x844 fit without horizontal overflow; dark/light screenshots.
16. Share link preserves the exact preset/settings/error after loading.
17. Fullscreen enters and exits through the browser API.
18. Every lab renders without page errors, offers reset, and fits a tablet viewport; the built-in circle reports one nonzero vector.

## Visual review and production check

Rendered screenshots of the Drawing Studio at desktop/tablet/mobile widths, dark/light themes, and all three additional labs were visually inspected. Review files remain in qa/ locally. The in-app browser inspection runtime could not initialize; Playwright/installed Edge supplied browser automation and screenshots instead.

The built output was also served from an ephemeral HTTP server under `/fourier-vector-lab/`, exercising relative Vite asset paths as used by a repository GitHub Pages site. It displayed the drawing, accepted N=100, then opened Signal Reconstruction. The server shut down after the check. The production directory includes source license and third-party notices.

At N=100, an 89-interval requestAnimationFrame sample in headless Edge had median 16.7 ms and 95th percentile 16.8 ms (about 60 Hz). This is a development-machine observation, not a student-laptop or mobile performance guarantee. See qa/production-check.json for the raw summary.

## Issues discovered and fixed

- The Lecture 31 N=1 error-energy table entry disagrees with its exact displayed formula. Documented explicitly; tests use 2pi−16/pi=1.1902271282389352.
- Signed zero at an audio fade endpoint is numerically zero; the assertion now compares absolute zero.
- WebM capture while the browser scrolled the canvas offscreen could create an empty header. Recording brings the canvas into view, flushes chunks periodically and rejects empty capture. Active-tab/canvas visibility limitations are documented.
- Real compact spectra originally inherited a signed drawing axis. They now show nonnegative harmonic indices. Energy/magnitude plots use a nonnegative vertical domain.
- Light-theme plot colors were darkened for readability; drawing summation limits were laid out explicitly, and disabled/individual sums show an enabled-index set.
- Tailwind's selected CSS build path was changed to PostCSS to omit an unused MPL compiler. Its stylesheet directive and a stale development server were corrected/restarted, then build and browser checks passed.

## Verification limits and pending items

- No live GitHub repository, Pages deployment, remote workflow or organization policy has been configured or tested. The deployment workflow and novice guide are provided.
- Audio scheduling, generated samples, durations, FFT and headroom were tested. Physical speakers, subjective melody recognition and listening quality were not independently auditioned.
- Firefox/Safari, hardware touch/stylus input, screen readers and projector hardware were not tested. Manual drawing was exercised with Playwright pointer input; touch uses the same pointer handlers.
- No claim of automatic semantic portrait extraction: one threshold-derived ordered boundary is reconstructed at a time. Multi-path joining and general SVG transform/compound-path support remain outside this implementation and are described in README/USER_GUIDE.
- WebM depends on the browser's encoder and visibility behavior. Native browser fullscreen/clipboard permissions can vary.
- Slide images and GIF keyframes were reviewed; PowerPoint entrance/build timing was not played click by click. See REFERENCE_ANALYSIS.md.

## Reproduce

```sh
npx pnpm@11.25.0 install --frozen-lockfile
npx pnpm@11.25.0 test
npx pnpm@11.25.0 build
npx pnpm@11.25.0 test:e2e
node scripts/verify-built-site.mjs
node scripts/license-inventory.mjs
```

The default local browser is installed Edge; CI uses installed Playwright Chromium. See README for other local systems. Stop an old dev server after changing dependencies; Playwright starts and cleans up its own fresh server when no server is already running.
