# Fourier Vector Lab

An interactive static teaching website for EGEE 3110 Linear Systems. Start in the Drawing Studio, then connect complex contour signals with real Fourier reconstruction, projection/orthogonality, and the instructor's Amazing Grace synthesis.

## Publish with GitHub only (no local Node.js needed)

Upload this repository's source files to a GitHub repository named **fourier-vector-lab**. In **Settings → Pages**, select **GitHub Actions**, then run **Build and deploy Fourier Vector Lab** from the Actions tab. GitHub installs Node 24 and the pinned package manager, tests, builds and publishes the site for you. Every later commit to main updates it automatically.

Your address will be `https://YOUR-GITHUB-USERNAME.github.io/fourier-vector-lab/`. See **DEPLOYMENT_GUIDE.md** for the browser-only upload steps and the exact five updated files. Do not upload node_modules or dist.

## Optional local development (developers only)

This folder is the GitHub repository root. After starting the development server, open the Local URL printed by Vite (normally http://127.0.0.1:5173).

For a new computer, install Node.js 24 or later, open a terminal in this folder and run:

```sh
npx pnpm@11.25.0 install --frozen-lockfile
npx pnpm@11.25.0 dev
```

Open the Local address printed by Vite. Stop it with Ctrl+C. Node and the package manager are needed for development/building; visitors to the published site need only a browser.

```sh
npx pnpm@11.25.0 test          # numerical, contour, audio-data, format and component tests
npx pnpm@11.25.0 build         # TypeScript check + production bundle in dist/
npx pnpm@11.25.0 preview       # serve the production bundle
npx pnpm@11.25.0 test:e2e      # browser interactions, local installed Edge
```

On macOS/Linux, or without Edge, change the local `launchOptions.channel` in playwright.config.ts to `undefined` and run `npx pnpm@11.25.0 exec playwright install chromium`. Browser tests are optional developer checks; the publishing workflow runs numerical/component tests and a production build without installing browser binaries. Browser installation can require administrator-managed system dependencies on Linux.

Do not open index.html directly with file://; Vite serves the TypeScript modules.

## Implemented

- Five contour examples, local PNG/JPEG/WebP decoding and drag/drop, threshold/inversion, ordered boundary selection, freehand mouse/touch tracing, restricted safe SVG path import.
- 512-point periodic arc-length resampling, optional smoothing, normalized full DFT including signed frequencies and DC.
- Canvas head-to-tail epicycles, optional vector circles, original/reconstructed contours, trace, inspected harmonic, coordinate grid, playback, elapsed-time clock, steps, speed and loop.
- Paired orders N=0…100, automatic evolution, explicit individual coefficient sequence, fixed N=1/5/20 comparison.
- Interactive amplitude/phase spectra and harmonic inspector, temporary coefficient disabling, sampled MSE, relative RMS, energy and error/order curve.
- Real square/triangle/sawtooth/lecture-exponential and custom periodic sample reconstruction; individual components, residual, compact amplitude/phase spectra.
- Real/complex signal projection with an adjustable interval and complex c, residual energy, optimum, and Pythagorean demonstration.
- All 35 supplied Amazing Grace notes, beats, chord assignments and voicings, local Web Audio scheduling, FFT and waveform, note/chord highlighting and independent voice toggles.
- SVG/PNG reconstructed contours, CSV coefficients, validated JSON save/load, exact compact preset share links, bounded custom-contour links and browser-dependent WebM.
- Dark/light themes, desktop/tablet/phone layouts, collapsible side panels, presentation/fullscreen, guide, glossary, activities, keyboard controls and lab resets.

## Limits and pending enhancements

- One connected contour per reconstruction. Holes and disconnected boundaries are separate choices. No automatic portrait line-art segmentation or multi-path joining. Manual tracing is the fallback.
- Raster processing uses silhouettes, not a full Canny/semantic edge detector; scaled to 320 px maximum dimension. Very small boundaries (<8 pixel edges) are filtered; at most 40 longest loops are listed.
- SVG accepts path elements with one subpath, sampled by browser geometry. Flatten path/group transforms and convert text/basic shapes to paths before import. Imported open paths close with a final segment. SVG scripts/styles/links are never inserted into the page.
- Drawing period is normalized to one unit; playback at 1× takes 8 seconds and does not redefine the displayed mathematical frequencies. N≤100, M=512. Arbitrary resampling changes coefficients if traversal speed changes.
- Uploaded image decode is bounded to 20 MB, but the browser must decode the source before downscaling. Huge source dimensions can still use substantial transient memory. No worker is required for the bounded DFT/raster work.
- Comparison orders are fixed 1/5/20 and use the full coefficient set. Error/order curve also uses full paired sets; numeric error metrics use current enabled terms.
- JSON stores contour points, N, speed, smoothing and disabled indices. Playback/layer/comparison state and image pixels are intentionally not part of the version 1 experiment format. Switching lab tabs resets that lab's transient state; save JSON first to preserve a drawing experiment.
- WebM records at most 10 seconds, canvas content only (no HTML overlays or audio). Keep the tab active and canvas visible. Browser codecs/throttling can prevent capture. The app reports empty capture instead of exporting a header-only file. No MP4 fallback.
- Optional free-form expression parsing, arbitrary custom harmonic tables, panel resizing, user-selected comparison orders, automated harmonics beyond N=100, a full Legendre lab and offline service-worker caching are future enhancements. They are not simulated controls.
- Audio samples and scheduling are tested; physical speakers and subjective sound quality need instructor listening. Firefox/Safari, touch hardware and assistive technology were not independently certified.

## Documentation

- REFERENCE_ANALYSIS.md: supplied slide/MATLAB review and explicit discrepancies.
- MATHEMATICAL_NOTES.md: mathematical and numerical conventions.
- USER_GUIDE.md: classroom workflow and activities.
- DEPLOYMENT_GUIDE.md: step-by-step GitHub Pages publication for an instructor.
- TEST_REPORT.md: actual test runs, coverage and limits.
- THIRD_PARTY_LICENSES.md and DEPENDENCY_LICENSES.json: libraries, versions and license inventory.

## GitHub Pages

The included `.github/workflows/pages.yml` installs dependencies, runs numerical/component tests, builds and publishes `dist/` after you enable Pages with **GitHub Actions**. Production asset URLs use the explicit `/fourier-vector-lab/` base. The development server stays at `/` for local testing. No local Node.js installation or manual build is required to publish. No live deployment has been performed on your GitHub account; see DEPLOYMENT_GUIDE.md.

Tailwind 3 uses PostCSS; the unused optional Lightning CSS compiler is omitted explicitly in .pnpmfile.cjs to keep selected software dependencies permissive. See THIRD_PARTY_LICENSES.md for the compatibility dataset attribution.

The application source is MIT licensed. Instructor-provided decks, GIFs and MATLAB source are not redistributed or relicensed here; only reviewed numerical melody/beat/chord data are implemented with attribution. This project makes no claim to the original media licenses.
