---
name: generate-project-frames
description: Use when the user types /generate-project-frames, or wants portfolio/showcase images of the current project, i.e. its best pages screenshotted and framed.
---

# Generate project frames

**REQUIRED SUB-SKILL:** generate-frame. Run its step 1 (locate and check the tool) first; stop if the tool is missing. `<frame-kit>` below is the path it resolves.

## 1. Scan
Find the user-facing pages: routes, page/view components, admin resources (Filament, Nova…), nav menus. Note how to run the app, the logins, and which role sees which page.

## 2. Propose top 5
Rank by portfolio value: core workflow screen > dashboards/charts > data-rich lists with images > reports > the rest. Skip auth, plain forms and settings.
List each with: name, path, role, one-line reason.

## 3. Ask
AskUserQuestion, multiSelect, two questions (max 4 options each): picks 1–3 and picks 4–5. Add a light/dark question if the app has both themes.

## 4. Check data
Start the app if it isn't running, on a free port. Open the chosen pages. Empty or placeholder data → tell the user and offer to seed realistic demo data into a separate database. Never modify the dev database without a yes.

## 5. Capture
Write a throwaway Playwright script in the scratchpad:
- `import { launchBrowser } from '<frame-kit>/src/frame.mjs'` (absolute path).
- Context: viewport 1440×900, deviceScaleFactor 2, the chosen colorScheme, plus the app's own theme switch (e.g. localStorage).
- Log in per role. Wait for networkidle and charts. Scroll lazy content into view. Hide toasts, debug bars and scrollbars.
- Interactive screens (cart, editor, board): add sample content first.
- Save `NN-<slug>.png`, in proposal order, to `~/Pictures/<project>-portfolio/raw/`.

Read every PNG. Fix and re-shoot bad ones.

## 6. Frame
Run generate-frame on the raw folder with `--url "<app host>/{name}"` and let it pick the cover. Report the raw and framed folders.
