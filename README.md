# claude-skills

A collection of the personal [Claude Code](https://claude.com/claude-code) skills I use. Each folder is one skill with a `SKILL.md`.

## Skills

| Skill | What it does |
|---|---|
| `generate-frame` | Frames an image or a folder of screenshots in a browser-window mockup (3840×2400 PNGs) and picks a cover. Uses [frame-kit](https://github.com/CrziDev/frame-kit). |
| `generate-project-frames` | Scans the current project, proposes its top 5 pages, screenshots the ones you pick, and frames them for portfolio images. Uses `generate-frame`. |

## Install

Copy the skills you want into `~/.claude/skills/`:

```sh
git clone https://github.com/CrziDev/claude-skills
cp -r claude-skills/generate-frame claude-skills/generate-project-frames ~/.claude/skills/
```

Or symlink them to stay in sync with the repo: `ln -s "$PWD/claude-skills/generate-frame" ~/.claude/skills/`.

## Notes

- `generate-frame` and `generate-project-frames` need [frame-kit](https://github.com/CrziDev/frame-kit) (`npm install` once). They find it on first use, or ask for its path, and save the location in the installed `SKILL.md`.
