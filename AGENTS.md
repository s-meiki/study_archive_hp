# Repository Guidelines

## Project Structure & Module Organization
Public-facing files live in `public/`: `public/index.html`, `public/assets/`, `public/data/site-content.js`, and `public/uploads/`. Local content operations live in `admin/`, with the editor at `admin/index.html`. Keep source workbooks in `content/source/`, automation in `scripts/`, and operational notes in `docs/`. Treat `prototype/` as reference-only and `.obsidian/` as local workspace metadata.

## Build, Test, and Development Commands
This repository has no build step or package manager.

```bash
open public/index.html
```

Open `public/index.html` directly for the public page. For routine updates, open `admin/index.html`, edit or add an archive, then save/export the generated data. To refresh content from Excel, run `python3 scripts/import_archives_from_xlsx.py --source content/source/lecture-archives.xlsx`. For browser testing with a local server, run `python3 -m http.server 4173` and use `http://localhost:4173/public/`.

## Coding Style & Naming Conventions
Use 2-space indentation in HTML, CSS, and JavaScript. Prefer plain browser JavaScript without build tooling, and keep functions small and single-purpose. Use `camelCase` for variables and functions. In generated content, keep keys stable and dates in `YYYY-MM-DD`. If classification or summary rules change, update `scripts/import_archives_from_xlsx.py` instead of hand-editing generated output.

## Testing Guidelines
There is no automated test suite yet, so verify changes manually in the browser. At minimum, check theme switching, keyword search, asset/year filters, featured content, and empty/error states in `public/index.html`. For admin changes, confirm `admin/index.html` can reflect edits and write to `public/data/site-content.js`. After running the importer, validate that every `themeId` matches an entry in `themes` and records render in descending date order.

## Commit & Pull Request Guidelines
Follow the current short imperative style for commit subjects, for example `Refine admin workflow layout`. Keep each commit focused on one concern. Pull requests should include a short summary, note any content/schema changes in `public/data/site-content.js`, attach screenshots for UI changes, and mention the manual checks you ran.

## Content & Safety Notes
This site is for educational archive content. Before merging, verify patient details are anonymized, external recording links are correct, and disclaimer text remains intact.
