# Repository Guidelines

## Project Structure & Module Organization
The public site is a Next.js App Router app in `app/`, with routes `/`, `/archives`, `/archives/[archiveId]`, `/courses`, `/courses/[courseId]`, `/dashboard`, `/calendar`, `/about`, `/contact`, `/terms`, and `/privacy`. Shared UI primitives live in `app/ui/` and layout components in `app/components/`. `public/` holds static assets (`public/images/`, `public/uploads/`) and generated data files (`public/data/site-content.js`, `learning-content.js`, `quiz-bank.js`, `annual-meetings-2026.js`) — never hand-edit generated data. Local content operations live in `admin/`, with the editor at `admin/index.html` and its assets in `admin/assets/`. Keep source workbooks in `content/source/`, course definitions in `content/courses/`, quiz sources in `content/quizzes/`, automation in `scripts/`, and operational notes in `docs/`. Treat `prototype/` as reference-only and `.obsidian/` as local workspace metadata.

## Build, Test, and Development Commands
Install dependencies with `npm install`, then:

```bash
npm run dev    # dev server at http://localhost:3000
npm run build  # production build (verify before merging)
```

Generated data is rebuilt with `npm run learning:build`, `npm run quiz:build`, and `npm run meetings:refresh` (each has a `:dry` variant for a dry run). To refresh archive content from Excel, run `python3 scripts/import_archives_from_xlsx.py --source content/source/lecture-archives.xlsx`. The admin editor stays a static page: run `python3 -m http.server 4173` from the repo root and open `http://localhost:4173/admin/`.

## Coding Style & Naming Conventions
Use 2-space indentation in HTML, CSS, TypeScript, and JavaScript. The Next.js app (`app/`) is TypeScript/React with CSS Modules; the admin editor (`admin/`) stays plain browser JavaScript without build tooling. Keep functions small and single-purpose, and use `camelCase` for variables and functions. In generated content, keep keys stable and dates in `YYYY-MM-DD`. If classification or summary rules change, update `scripts/import_archives_from_xlsx.py` instead of hand-editing generated output.

## Testing Guidelines
There is no automated test suite yet, so run `npm run build` and verify changes manually in the browser. At minimum, check theme switching, keyword search and filters on `/archives`, featured content on `/`, the learning flow (lesson progress → quiz → badges) across `/courses/[courseId]` and `/dashboard`, the meetings calendar on `/calendar`, and empty/error states. For admin changes, confirm `admin/index.html` can reflect edits and write to `public/data/site-content.js`. After running the importer, validate that every `themeId` matches an entry in `themes` and records render in descending date order.

## Commit & Pull Request Guidelines
Follow the current short imperative style for commit subjects, for example `Refine admin workflow layout`. Keep each commit focused on one concern. Pull requests should include a short summary, note any content/schema changes in `public/data/*.js`, attach screenshots for UI changes, and mention the manual checks you ran.

## Content & Safety Notes
This site is for educational archive content. Before merging, verify patient details are anonymized, external recording links are correct, and disclaimer text remains intact.
