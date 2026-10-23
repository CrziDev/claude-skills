---
name: generate-frame
description: Use when the user types /generate-frame, or gives an image or folder of screenshots to put in a browser-window mockup frame, or wants a portfolio/showcase cover image from screenshots.
---

# Generate frame

Turns existing screenshots into framed PNGs with [frame-kit](https://github.com/CrziDev/frame-kit), which does all rendering. This skill locates the tool, runs it, checks the results and picks a cover. To screenshot a project's pages first, use generate-project-frames.

## 1. Locate and check frame-kit
Call the folder `<frame-kit>`. Use the first that has `cli.mjs` and a `package.json` named `frame-kit`:
1. `$FRAME_KIT_DIR`
2. the folder behind a `frame-kit` command on PATH (`readlink -f "$(command -v frame-kit)"`, its folder)
3. a search of `~/projects ~/code ~/dev ~`, depth ≤ 4, skipping `node_modules` (several matches → ask which)
4. ask the user; if they have none, suggest `git clone https://github.com/CrziDev/frame-kit`

Then:
- `node_modules` missing → `npm install` in `<frame-kit>`.
- Run `node <frame-kit>/cli.mjs --help` and build commands only from options it lists. If `--resolution` or `--fit` is absent, the install is older: omit them and tell the user to `git pull`.
- "Chromium not found" → `npx playwright install chromium` in `<frame-kit>`, or set `CHROME_PATH`.

Do not write the path into any skill file.

## 2. Frame
`node <frame-kit>/cli.mjs single <image|folder> --out <framed dir> [options]`
- `--out`: always pass it. Default is `<input dir>/framed/`, which nests inside a raw folder. Keep framed images apart from sources.
- `--url "<host>/{name}"`: address-bar text; `{name}` = file name without its `NN-` prefix. Use the app's real host and paths when known, else omit.
- `--style paper`: receipts, invoices, printouts. A folder run uses one style, so re-run just those files individually with `--style paper` and the same `--out`.
- `--resolution standard|high|max`: default `max` (3840×2400). Use `standard` (1920×1200) for READMEs and quick previews, `high` (2560×1600) for web and slides. Larger output is crisper frame and text, not more detail in the screenshot. Use one resolution per batch.
- `--fit auto|contain|cover`: default `auto` (whole screenshot; very tall pages cropped from the top). Change only to fix a bad crop.

Exit code 1 means some files failed; the others are still written and the failures are listed on stderr. Fix the cause (unreadable or corrupt image, unsupported type, over 50 MB) and re-run only those files. If every file fails, suspect Chromium.

## 3. Cover (folder input only)
Look at the images, then pick two that complement each other:
- back: overview of the product (dashboard, analytics, home), landscape, readable at thumbnail size.
- front: the screen showing what the app does, with real content, a different layout from the back.
- never: login, empty states, error pages, very tall full-page shots, receipts, or the same screen twice.

`node <frame-kit>/cli.mjs cover <back> <front> --back-url "…" --front-url "…" --out <framed dir>/00-cover.png` (same `--resolution`). Pass the source screenshots, not framed ones. Only one image worth showing, or the user wants a headline? Use `headline` (see `--help`).

## 4. Verify and report
1. `node <this skill>/scripts/verify-frames.mjs <input> <framed dir> --resolution <preset>` checks every input has a valid PNG of the right size, plus the cover. It does not judge appearance.
2. Read every output PNG (and the cover). Look for a blank or partly loaded screenshot, cropped-off content, unreadably small text, wrong style (receipt in a browser window), a wrong address bar. Re-run only the affected files with adjusted options, then re-verify. If you cannot view images, say so.
3. Report: framed folder, files that failed or were redone, the cover pair, and in a sentence why the two complement each other.
