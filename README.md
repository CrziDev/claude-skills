# claude-skills

A collection of the personal [Claude Code](https://claude.com/claude-code) skills I use. Each folder is one skill with a `SKILL.md`.

## Skills

| Skill | What it does |
|---|---|
| `generate-frame` | Frames an image or a folder of screenshots in a browser-window mockup and picks a cover. Output is 3840×2400 by default; `--resolution` picks 1920×1200 or 2560×1600. Uses [frame-kit](https://github.com/CrziDev/frame-kit). |
| `generate-project-frames` | Scans the current project, proposes its best pages (up to 5, ranked for the kind of product), screenshots the ones you pick, checks the shots for errors, and hands them to `generate-frame`. |

Use `generate-frame` when you already have screenshots. Use `generate-project-frames` when you want them taken from your running app; it calls `generate-frame` for the framing. Install both together.

## Install

Prerequisites: Node 18+ and [frame-kit](https://github.com/CrziDev/frame-kit) (`npm install` once in its folder; Chromium is found automatically or installed with `npx playwright install chromium`).

```sh
git clone https://github.com/CrziDev/claude-skills
cp -r claude-skills/generate-frame claude-skills/generate-project-frames ~/.claude/skills/
```

Or symlink them to stay in sync with the repo: `ln -s "$PWD/claude-skills/generate-frame" ~/.claude/skills/`.

## How frame-kit is found

Nothing is saved. Each run checks, in order: `$FRAME_KIT_DIR`, a `frame-kit` command on PATH, then a search of `~/projects`, `~/code`, `~/dev` and `~` (depth ≤ 4). If none match it asks for the path. To skip the search, `export FRAME_KIT_DIR=~/path/to/frame-kit`.

## Where files go

`generate-project-frames` writes to `~/Pictures/<project>-portfolio/`: `raw/` for screenshots and `framed/` for framed images plus `00-cover.png`. `generate-frame` on its own writes to the `--out` folder, defaulting to `<input dir>/framed/`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Chromium not found` | `npx playwright install chromium` in the frame-kit folder, or set `CHROME_PATH` |
| `Unknown option --resolution` / `--fit` | frame-kit is older than the skills expect: `git pull` in it |
| Some images `FAILED`, exit code 1 | The rest were still framed. Fix or replace the listed files and re-run only those |
| Screenshot is the login page | The capture redirected to login. Provide a saved session (`storageState`) or log in via the script's `login` hook; the skill won't bypass access |
| Spinner, empty chart or banner in a shot | Reported as an `issue` in capture output; the page is re-shot after waiting for or dismissing it |

## Tests

`node --test test/*.test.mjs` checks the output verifier and the capture helper (against a local test server) and runs them through frame-kit. It needs frame-kit installed next to this repo or at `$FRAME_KIT_DIR`; the capture tests are skipped otherwise.
