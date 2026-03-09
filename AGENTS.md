# Repository Guidelines

## Project Structure & Module Organization
`index.html` is the public page entry point and `admin.html` is the local content-management surface. Runtime code lives in `assets/`, source content can be managed through `admin.html` or stored in `content/source/lecture-archives.xlsx`, and the public site reads generated data from `data/site-content.js`. Automation scripts live in `scripts/`. Planning notes and content rules live in `docs/`, and `prototype/study-archive-prototype.html` is reference material rather than production code. Treat `.obsidian/` as local workspace metadata unless a task explicitly targets it.

## Build, Test, and Development Commands
This repository has no build step or package manager.

```bash
open index.html
```

Opening `index.html` directly works because the app reads `data/site-content.js` as a normal script. For routine updates, open `admin.html`, edit or add an archive, and save/export the generated data. To refresh content from Excel, run `python3 scripts/import_archives_from_xlsx.py --source content/source/lecture-archives.xlsx`. If you prefer a local server for browser testing, run `python3 -m http.server 4173` from the repository root and open `http://localhost:4173`.

## Coding Style & Naming Conventions
Use 2-space indentation in HTML, CSS, and JavaScript to match the existing files. Prefer plain ES modules-free browser JavaScript and keep logic in small functions like `renderArchives()` or `loadSiteData()`. Use `camelCase` for variables and functions, and keep DOM references suffixed with `El` (for example, `themeListEl`). In generated content, keep object keys stable and format dates as `YYYY-MM-DD`. If you change classification or summary rules, update `scripts/import_archives_from_xlsx.py` instead of hand-editing generated output.

## Testing Guidelines
There is no automated test suite yet, so verify changes manually in the browser. At minimum, confirm theme switching, keyword search, asset/year filters, featured content, and empty/error states. After running the importer, validate that every `themeId` matches an entry in `themes`, links are intentional, and new records render in descending date order.

## Commit & Pull Request Guidelines
Git history is not included in this workspace, so follow a simple imperative style for commit subjects: `Add home-care archive entry`, `Refine archive filter copy`. Keep commits focused on one concern. Pull requests should include a short summary, note any content/schema changes in `data/site-content.js`, attach screenshots for UI changes, and mention the manual checks you ran.

## Content & Safety Notes
This site is for educational archive content. Before merging, verify patient details are anonymized, external recording links are correct, and disclaimer text remains intact.
