# frame-kit-skills

Two [Claude Code](https://claude.com/claude-code) skills for making portfolio images with [frame-kit](https://github.com/CrziDev/frame-kit). Point them at a project and get its best pages screenshotted and framed in a browser-window mockup, with a cover.

## Skills

- **`generate-frame`**: frames an image or a folder of screenshots (3840×2400 PNGs) and picks a cover from them.
- **`generate-project-frames`**: scans the current project, proposes its top 5 pages, screenshots the ones you pick with Playwright, then frames them with `generate-frame`.

## Install

1. Get the script: `git clone https://github.com/CrziDev/frame-kit && cd frame-kit && npm install`
2. Get the skills and copy them in:

```sh
git clone https://github.com/CrziDev/frame-kit-skills
cp -r frame-kit-skills/generate-* ~/.claude/skills/
```

The skills find frame-kit on first use (or ask for its path) and save the location in the installed `generate-frame/SKILL.md`, so clone it anywhere.

## Use

```
/generate-frame ~/Pictures/myapp/raw    # frame a folder, pick a cover
/generate-project-frames                # run inside a project; asks which pages to shoot
```
