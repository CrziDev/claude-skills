---
name: generate-frame
description: Use when the user types /generate-frame, or gives an image or folder of screenshots to put in a browser-window mockup frame, or wants a portfolio/showcase cover image from screenshots.
---

# Generate frame

Tool: frame-kit, at `<frame-kit>` (see step 1). Output: 3840×2400 PNGs.

Frame-kit location: `(not set)`

## 1. Locate and check the tool
1. Use the path on the `Frame-kit location:` line above if it is set and `<path>/cli.mjs` exists.
2. Otherwise search for a folder with `cli.mjs` and `"name": "frame-kit"` in its `package.json`: `~/projects`, `~/code`, `~/dev`, `~`, depth ≤ 4, skipping `node_modules`. One match → use it. Several → ask which.
3. Nothing found → ask the user for the path. Still missing → stop and suggest cloning the frame-kit repo.
4. Save the path: edit the `Frame-kit location:` line in this file (the installed SKILL.md) to the resolved absolute path, so later runs skip the search. Update it again if the path stops working.
5. `<frame-kit>/node_modules` missing → `npm install` in that folder.

## 2. Frame
`node <frame-kit>/cli.mjs single <image|folder> [options]`
- `--url "<host>/{name}"`: address-bar text; `{name}` = file name without the `NN-` prefix. Use the app's real host and paths when known; otherwise omit.
- `--style paper`: receipts, invoices, printouts, portrait images. A folder run uses one style for every image, so re-run these files one at a time with `--style paper`.
- `--out <dir>`: default `<input dir>/framed/`.

## 3. Cover (folder input only)
Read the images, then pick:
- back: the overview screen (dashboard, analytics, home).
- front: the screen showing what the app does (POS, editor, main workflow) with real content.
- never: login, empty states, very tall full-page shots, receipts.

`node <frame-kit>/cli.mjs cover <back> <front> --back-url "…" --front-url "…"` → `framed/00-cover.png`.

## 4. Verify and report
Read every output PNG. A broken image, bad crop or wrong style → fix and re-run that file. Report the output folder and the two cover picks.
