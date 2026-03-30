# Companion Fitness

Companion Fitness is a Vite + React app for paired workout tracking and challenge progress.

## Local Development

```bash
npm install
npm run dev
```

### Workspace source-of-truth guardrail

This workspace contains a tracked Git clone at `_cf_main_check/` and a top-level working copy.

To avoid code drift between copies:

- Git commits and pushes should happen in `_cf_main_check/`.
- Top-level npm scripts are intentionally routed to `_cf_main_check`.
- If you run `npm run dev` from the top-level folder, it now starts the app from `_cf_main_check`.

## Build

```bash
npm run build
```

## Deployment (Important)

### Source of truth

Production for `https://teampaintbrush.github.io/companion-fitness/` is deployed from:

- Repository: `TeamPaintbrush/companion-fitness`
- Branch: `main`
- Path/Artifact: GitHub Actions workflow build from source (`dist`), then Pages deploy

### Do not use `gh-pages` branch for this app

This repository uses `.github/workflows/deploy.yml` to deploy GitHub Pages on pushes to `main`.

Because of that:

- Publishing manually to a `gh-pages` branch will not be the final live source.
- The workflow deployment from `main` can override manual `gh-pages` publishes.

### Required base path

Builds for production must use base path:

- `VITE_BASE_URL=/companion-fitness/`

If this is wrong, assets will fail to load on GitHub Pages.

## Deployment Checklist

1. Ensure latest app code is committed to `main`.
2. Confirm `VITE_BASE_URL` is set for production workflow.
3. Push to `main`.
4. Wait for GitHub Actions Pages deployment to complete.
5. Verify live HTML references current asset hash under `/companion-fitness/assets/`.
