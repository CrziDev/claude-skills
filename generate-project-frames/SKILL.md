---
name: generate-project-frames
description: Use when the user types /generate-project-frames, or wants portfolio/showcase images of the current project, i.e. its best pages screenshotted and framed.
---

# Generate project frames

Screenshots the current project's best pages, then frames them. This skill owns discovery, app preparation and raw screenshot quality; **REQUIRED SUB-SKILL:** generate-frame owns framing and the cover. Run its step 1 first (locate and check frame-kit) and stop if that fails. `<frame-kit>` is the path it resolves.

Outputs, never mixed: raw → `~/Pictures/<project>-portfolio/raw/`, framed → `~/Pictures/<project>-portfolio/framed/`.

## 1. Scan
Find user-facing pages: routes, page/view components, admin resources (Filament, Nova…), nav menus. Read the code for how to run the app, which roles exist, and which role sees which page. Don't guess ports, URLs or logins; verify them by running the app or asking.

## 2. Propose up to 5
Decide what kind of product this is, then rank pages by how well they show what it really does. The question is: *what would make a stranger understand this product from one image?*

| Product | Strongest pages |
|---|---|
| Business/admin app (POS, CRM, inventory) | the core workflow with real rows, then dashboard, then data-rich lists |
| Dashboard/analytics | main dashboard, one drill-down, one report |
| Content/marketing/e-commerce site | landing/hero, listing, detail page, cart or checkout |
| Editor/builder/creative tool | the canvas with content, then a gallery or project list |
| Developer tool/docs | main UI in use, a result/output view |

Skip login, plain forms, settings, error pages, and near-duplicates. Fewer than 5 is fine. List each with name, path, role, and one-line reason.

## 3. Ask
AskUserQuestion, multiSelect (max 4 options per question; split into two questions if needed). Capture must not start before the user picks. Also ask: light or dark (only if the app has both), and which role/account to use. Credentials come from the user's environment or an existing session; never write them into scripts, files or output, and never work around access controls (a page the chosen role can't see is skipped, not forced).

## 4. Prepare the app
- Start the app if it isn't running, on a free port; remember to stop what you started.
- Open the chosen pages. Empty or placeholder data → say so and offer realistic demo data. Seeding needs an explicit yes, goes into a separate or throwaway database, and the dev database is never touched without one. Prefer states the UI can create (add items to the cart) over database writes.
- Don't add dependencies or files to the user's project. Scripts live in the scratchpad.

## 5. Capture
Write a scratchpad script that imports `capturePages` from `<this skill>/scripts/capture.mjs`:

```js
import { capturePages } from '<this skill>/scripts/capture.mjs';
const results = await capturePages({
  frameKit: '<frame-kit>', outDir: '<raw dir>', colorScheme: 'light',   // one scheme for the batch
  storageState: process.env.APP_STORAGE_STATE,        // saved session; or login: async (page) => {...} reading process.env
  setup: (ctx) => ctx.addInitScript(() => localStorage.setItem('theme', 'light')),  // the app's own theme switch, if any
  pages: [{ name: '01-dashboard', url: 'http://localhost:8000/admin', prepare: async (page) => { /* open the cart, dismiss the tour… */ } }],
});
console.log(JSON.stringify(results, null, 2));
```

It uses one 1440×900 @2x context for the whole batch (PNGs are 2880×1800), waits for network idle, fonts and lazy content, and reports `issues` per page: console/page errors, HTTP ≥ 400, redirects (usually a missing login), broken images, visible spinners/skeletons, overlays/cookie banners, empty chart containers. Name files `NN-<slug>.png` in proposal order. Pass the app's own selectors via `loadingSelectors`/`overlaySelectors`/`hideCss` (toasts, debug bars).

Interactive screens (cart, editor, board) need sample content added in `prepare` first.

For every page with issues: fix it (dismiss the overlay, wait for the element, log in) and re-shoot only that page; or tell the user it is unfixable and drop it. A warning you judge harmless (e.g. a favicon 404) is fine; say so. Then read every PNG: real content, nothing half-loaded, no private data (emails, tokens, real customer names) that shouldn't be published; check with the user if unsure.

## 6. Frame
Run generate-frame steps 2–4 with the raw folder as input: `--out <framed dir>`, `--url "<app host>/{name}"`, one `--resolution` (default max). A partial failure is reported, not hidden: re-shoot or re-frame just the failed files. Report the raw folder, framed folder, cover pair, pages dropped and why, and any limitation (e.g. images not inspected).
