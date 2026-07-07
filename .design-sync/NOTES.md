# design-sync notes — 臨床学術WG Design System

## Shape: off-script (direct upload)

This repo is a Next.js site, not a component-library repo. The Claude Design
material lives in `design-system/` as a hand-authored, fully self-contained
bundle:

- 15 preview HTML files (`components/`, `foundations/`, `templates/`,
  `assets/og-export.html`), each with a first-line `<!-- @dsCard … -->` marker
  so the Design System pane builds its card index automatically.
- `tokens/tokens.css` — the token source of truth (mirrors the live site CSS
  `public/assets/styles.css` :root).
- `guidelines.md` — the AI-facing brand spec.
- `README.md` — human-facing provenance / sync instructions.
- `assets/ogp-candidate.png` — OGP export output (source: `assets/og-export.html`).

The generic `/design-sync` converter (package/storybook → `_ds_bundle.js` +
React components) does **not** apply here — there is nothing to build. Per the
skill's off-script clause, the bundle is uploaded as-is, preserving its layout
at the project root.

## Upload mapping

`localDir = design-system/`. Project paths mirror the bundle tree 1:1
(`components/*.html`, `foundations/*.html`, `templates/*.html`,
`tokens/tokens.css`, `guidelines.md`, `README.md`, `assets/*`).

No `_ds_sync.json` anchor is produced (the converter's hash sidecar recipe does
not fit this shape), so every re-sync re-uploads the full bundle. That is
correct for a 20-file bundle: cheap and idempotent.

## Re-sync

Update the bundle (tokens → previews order, per `design-system/README.md`),
then re-run `/design-sync`. The pinned `projectId` in `config.json` routes the
re-sync to this same project via the atomic path.
