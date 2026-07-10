# Pipeline Defense

A QA-themed tower defense game. Bugs ride your CI/CD pipeline from `git push` toward
production — place test layers along the path to catch them before they ship.

**Play it:** open `index.html`, or deploy the repo to any static host (Vercel, Netlify,
GitHub Pages). No build step, no dependencies.

## How to play

1. Pick an environment: **STARTUP** (easy) → **COMPANY** → **CORPORATION** → **HYPERSCALER** (extreme).
2. Spend your budget on test towers (unit, Cypress, Playwright, Docker, perf, AI assertion…).
   Each tower has different damage against different bug types.
3. Send waves. Kill bugs early in the pipeline for a **shift-left score bonus** (up to 10×).
4. Towers accumulate **flakiness** (test debt) every wave and start missing shots —
   run **AI Triage** or upgrade them to stabilize.
5. Clear every wave to secure the pipeline, then keep going in **endless overtime** if you dare.

### Controls

| Input | Action |
|---|---|
| Click empty cell | Place selected tower |
| Click tower | Inspect / upgrade / sell / change targeting |
| Right-click / `Esc` | Cancel |
| `Space` | Send wave (early call = cash bonus) |
| `P` / `F` / `M` | Pause / cycle speed (1×/2×/4×) / mute |
| `T` | AI Triage |
| `U` / `X` | Upgrade / sell selected tower |
| `1`–`0`, `A` | Select tower type |

### Mechanics

- **Synergy** — adjacent towers fire 15% faster.
- **Targeting modes** — each tower can prioritize first / last / strongest / weakest.
- **Bug abilities** — mutations split on death, idempotency bugs duplicate when hit,
  memory leaks regenerate, permission escalations are immune to unit tests.
- **Between-wave events** — tech debt sprints, infra incidents, pair reviews…
- **Endless mode** — after winning, waves keep scaling in HP and pace.

Best scores and the leaderboard are stored locally in your browser.

## Project layout

```
index.html      — markup & panels
css/style.css   — styles (responsive down to mobile)
js/data.js      — towers, bugs, levels, waves, endless generator
js/audio.js     — WebAudio sound effects (no assets)
js/entities.js  — Bug / Tower / Projectile / particles
js/main.js      — game state, loop, rendering, input, UI
```
