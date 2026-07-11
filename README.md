# Pipeline Defense

A QA-themed tower defense game. Bugs ride your CI/CD pipeline from `git push` toward
production: place test layers along the path to catch them before they ship.

**Play it:** open `index.html`, or deploy the repo to any static host (Vercel, Netlify,
GitHub Pages). No build step, no dependencies.

## How to play

1. Pick an environment: **STARTUP** (easy), **COMPANY**, **CORPORATION**, or **HYPERSCALER** (extreme).
2. Spend your budget on test towers (unit, Cypress, Playwright, Docker, perf, AI assertion and more).
   Each tower has different damage against different bug types.
3. Send waves. Kill bugs early in the pipeline for a **shift-left score bonus** (up to 10x).
4. Towers accumulate **flakiness** (test debt) every wave and start missing shots:
   run **AI Triage** or upgrade them to stabilize.
5. Clear every wave to secure the pipeline, then keep going in **endless overtime** if you dare.

### Controls

| Input | Action |
|---|---|
| Click empty cell | Place selected tower |
| Tap empty cell (touch) | Preview placement; tap again to confirm |
| Click tower | Inspect / upgrade / sell / change targeting |
| Right-click / `Esc` | Cancel |
| `Space` | Send wave (early call = cash bonus) |
| `P` / `F` / `M` | Pause / cycle speed (1x/2x/4x) / mute |
| `T` | AI Triage |
| `U` / `X` | Upgrade / sell selected tower |
| `1`-`0`, `A` | Select tower type |

### Mechanics

- **Synergy**: adjacent towers fire 15% faster.
- **Targeting modes**: each tower can prioritize first / last / strongest / weakest.
- **Bug abilities**: mutations split on death, idempotency bugs duplicate when hit,
  memory leaks regenerate, permission escalations are immune to unit tests.
- **Between-wave events**: tech debt sprints, infra incidents, pair reviews and more.
- **Endless mode**: after winning, waves keep scaling in HP and pace.

### High scores

The high score list covers all environments and is reachable from the level select
screen (🏆 High Scores) and from the end-of-game screen. Scores and per-level bests are
stored in your browser. An optional remote scores API can be wired via `SCORES_ENDPOINT`
in `js/main.js`; it falls back to local storage when unset or unreachable.

## Development

- Working agreement: see `CLAUDE.md`.
- Smoke test: `scripts/smoke-test.sh` drives the real game headlessly in Chromium and
  fails unless the driver prints `TEST-PASS`. Run it before pushing.
- The layout is responsive: the board scales to fill the space between the side panels
  on desktop (capped to the viewport height) and stacks vertically on mobile. The canvas
  backing store follows `devicePixelRatio` so scaling stays crisp.
- Mobile play uses its own chrome: a fixed bottom HUD (budget, lives, wave, send-wave),
  a horizontal swipe strip for the tower shop, a floating bottom sheet for the tower
  inspector, and two-tap placement (tap to preview, tap again to confirm).

## Project layout

```
index.html      : markup and panels
css/style.css   : styles (responsive down to mobile)
js/data.js      : towers, bugs, levels, waves, endless generator
js/audio.js     : WebAudio sound effects (no assets)
js/entities.js  : Bug / Tower / Projectile / particles
js/main.js      : game state, loop, rendering, input, UI
scripts/        : headless smoke-test harness
```
