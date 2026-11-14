# Third-party libraries and licenses

All selected application and build/test **software** dependencies use permissive licenses (MIT/MIT-0/ISC/BSD/Apache-2.0). The browser compatibility **dataset** caniuse-lite is CC-BY-4.0 and is attributed below. There are no paid APIs or remote runtime libraries.

The exact dependency graph is pinned in pnpm-lock.yaml. DEPENDENCY_LICENSES.json inventories the installed graph, including platform-specific optional packages present on the audit computer. THIRD_PARTY_NOTICES.txt preserves the license/copyright/notice files found in those packages. Keep these documents with redistributed source. The inventory generator does not certify legal conclusions; it records declared package metadata and notices.

## Direct dependencies

| Library | Installed version | Purpose | License |
| --- | --- | --- | --- |
| react | 19.3.1 | UI components | MIT |
| react-dom | 19.3.1 | Browser DOM renderer | MIT |
| lucide-react | 0.468.0 | Inline SVG icons | ISC |
| @types/react | 19.3.0 | React TypeScript definitions | MIT |
| @types/react-dom | 19.3.0 | React DOM TypeScript definitions | MIT |
| @types/node | 24.19.2 | Node TypeScript definitions | MIT |
| @vitejs/plugin-react | 5.2.0 | React compilation/HMR | MIT |
| vite | 7.3.8 | Development server and static build | MIT |
| typescript | 5.9.3 | Type checking | Apache-2.0 |
| tailwindcss | 3.4.19 | CSS utility framework and preflight | MIT |
| vitest | 3.2.7 | Numerical and component test runner | MIT |
| @playwright/test | 1.65.0 | Browser interaction tests | Apache-2.0 |
| @testing-library/react | 16.3.3 | Accessible component tests | MIT |
| @testing-library/jest-dom | 6.9.1 | DOM assertions | MIT |
| jsdom | 26.1.0 | DOM test environment | MIT |
| prettier | 3.10.1 | Source formatting | MIT |
| postcss | 8.5.32 | CSS build processing | MIT |

## Dataset attribution

caniuse-lite, by the caniuse-lite/caniuse contributors, provides browser-compatibility data to Browserslist during the build. Source: https://github.com/browserslist/caniuse-lite and upstream https://caniuse.com/. License: Creative Commons Attribution 4.0 International (https://creativecommons.org/licenses/by/4.0/). The dataset is consumed unchanged. Its original notice and license text are retained in THIRD_PARTY_NOTICES.txt. This dataset is build tooling, not an uploaded student dataset or external runtime call.

## Optional compiler choice

The project uses Tailwind 3.4.19 with the PostCSS pipeline. Vite's unused optional Lightning CSS peer is omitted by the explicit `.pnpmfile.cjs` metadata hook; no Vite runtime source is modified. This avoids selecting an MPL-licensed compiler for this project's requested permissive software toolchain. Do not enable Vite's Lightning CSS transformer without reviewing this decision and its license.

## Regenerate the inventory

After an intentional dependency change, install with the pinned pnpm version and run:

```sh
node scripts/license-inventory.mjs
```

The script follows the installed graph, honors the same Vite optional-peer omission, and writes JSON plus full notices. A different OS can have different optional binary packages. Inspect the printed nonPermissiveSoftware list before accepting dependency updates. The GitHub workflow uses the same lockfile and hook.

## Instructor reference materials

The original lecture decks, their logos/figures/GIFs and MATLAB source are not included in the app source archive. They have not been relicensed as MIT. Educational notation, examples and the preserved note/beat/chord assignments are attributed to the supplied EGEE 3110 materials in REFERENCE_ANALYSIS.md and the About dialog. No external illustration or portrait animation has been copied into the site. Built-in contour geometry is original programmatic geometry.

## Other tools

Node.js, pnpm, installed Microsoft Edge and Microsoft PowerPoint were used as development/review tools and are not bundled with the source. GitHub workflow actions and browser binaries are fetched by their respective platforms and retain their own licenses. The app's MIT LICENSE applies to the original source only.
