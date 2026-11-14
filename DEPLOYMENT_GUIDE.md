# Publish Fourier Vector Lab using GitHub only

You do **not** need Node.js, pnpm, Git, or a terminal on your computer. GitHub Actions installs the tools on GitHub's own runner, builds the source, and publishes the compiled site automatically.

## 1. Create the repository

1. Sign in at https://github.com/ in your browser.
2. Click **New repository** and name it exactly **fourier-vector-lab**.
3. Choose **Public** for a free public teaching site. Private-repository Pages availability depends on your plan.
4. Create the repository. If GitHub asks for an initial README, leave it unchecked because this project includes one.

## 2. Upload the prepared files

Use the contents of the local **fourier-vector-lab-github** folder.

1. Open the repository and choose **uploading an existing file** (for an empty repository), or **Add file → Upload files**.
2. Upload the folder's **contents**, keeping the same directory structure. Do not upload an outer folder named fourier-vector-lab-github. The repository home page must show package.json, index.html and src directly.
3. Include the dotfiles: `.gitignore`, `.npmrc`, `.pnpmfile.cjs`, `.prettierignore`, `.prettierrc.json`, and the `.github` folder. In particular `.pnpmfile.cjs` and pnpm-workspace.yaml are part of the locked dependency setup.
4. Choose **Commit changes** on the **main** branch.

If the browser's file picker omits hidden folders, create the workflow separately on GitHub: **Add file → Create new file**, enter `.github/workflows/pages.yml` as its full name, paste the contents of the supplied pages.yml, then commit. The slashes create the folders for you. Use the same technique for any omitted root dotfile. Keep only this one Pages deployment workflow.

Do not upload node_modules, dist, qa, playwright-report, test-results, source ZIP archives, tsconfig.tsbuildinfo or the instructor's reference decks. The prepared folder already excludes them. GitHub builds dist itself. The site source index.html is required; dist/index.html is generated.

## 3. Turn on GitHub Pages

1. In the repository, choose **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**. Do not select Deploy from a branch.
3. Open the **Actions** tab and select **Build and deploy Fourier Vector Lab**.
4. If a run already failed before Pages was enabled, choose **Re-run all jobs**. Otherwise use **Run workflow → main → Run workflow** for the first deployment.
5. Wait for the **build** and **deploy** jobs to turn green. Open the website link shown in the successful deployment or in Settings → Pages.

Your site address will be:

`https://YOUR-GITHUB-USERNAME.github.io/fourier-vector-lab/`

Replace YOUR-GITHUB-USERNAME with your account name. The repository name, capitalization and trailing slash matter for asset URLs. No username needs to be entered into the source files.

## 4. Future updates

Upload your changed source files through GitHub's website and commit to main. Every commit to main automatically installs the locked dependencies, runs numerical/component tests, builds the application and deploys dist. You do not run a local build or upload compiled output.

## Files changed for this deployment setup

If you have not uploaded anything yet, upload **all contents** of fourier-vector-lab-github. If you already uploaded the earlier prepared version, replace exactly these five files at their matching paths:

| File | Purpose |
| --- | --- |
| `vite.config.ts` | Production and production-preview base `/fourier-vector-lab/`; local development/tests use `/`. |
| `.github/workflows/pages.yml` | GitHub installs Node 24 and the pinned pnpm version, installs locked dependencies, tests, builds and deploys. |
| `scripts/verify-built-site.mjs` | Developer verification of every emitted file under the repository subdirectory, plus browser smoke checks. |
| `README.md` | Publishing-first instructions; local Node setup is optional. |
| `DEPLOYMENT_GUIDE.md` | This browser-only guide. |

There are no new application dependencies, lockfile changes or required manual asset edits. Keep all other source files from the prepared upload folder.

## How assets are handled

Vite rewrites compiled JavaScript/CSS and imported asset URLs to start with `/fourier-vector-lab/`. Files in public are copied into dist; any future references to them in source should use `import.meta.env.BASE_URL + 'filename'` rather than a hardcoded root `/filename`. Uploaded student images use local browser blob URLs and do not depend on the hosting path. The supplied examples/icons are drawn in code, so there are no missing external drawing images to upload. The site uses tab state rather than server-side page routes; hash-based experiment links preserve the repository path.

## If something fails

- **No workflow listed:** check that `.github/workflows/pages.yml` exists at the repository root, not in a nested upload folder.
- **Pages configuration error:** select GitHub Actions in Settings → Pages, then re-run the workflow.
- **No automatic run:** confirm the branch is main and Actions is enabled for the repository. Commit a source change or use Run workflow.
- **Dependency installation fails:** ensure package.json, pnpm-lock.yaml, pnpm-workspace.yaml and .pnpmfile.cjs were all uploaded from the same prepared folder. Do not edit the lockfile in the browser.
- **404 or unstyled page:** use the full `/fourier-vector-lab/` site address and keep the configured repository name. Check that the workflow publishes dist, not the source directory. Review the failed job log in Actions.
- **Organization restriction:** an organization administrator may need to allow the standard GitHub Actions or Pages deployment. No personal access token or repository secret is required for this workflow.

## Verification and limits

The production build and asset/browser verification are run locally by the development agent. They check files under the exact `/fourier-vector-lab/` prefix. The workflow itself can only be confirmed end-to-end after you upload to your repository and enable Pages; no GitHub account changes or live publication were performed here. The automated deployment runs numerical/component checks; the separate Playwright browser suite remains in the source for developer use and is not required to publish.

Optional developer commands (not required for the instructor): `npx pnpm@11.25.0 install --frozen-lockfile`, `npx pnpm@11.25.0 test`, `npx pnpm@11.25.0 build`, and `node scripts/verify-built-site.mjs` with a supported local browser installed.

Official references: https://vite.dev/guide/static-deploy#github-pages and https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages .
