# CLAUDE.md: working agreement for this repo

Pipeline Defense: QA-themed tower defense game. Zero-dependency static site: vanilla JS + canvas, classic script tags in load order, no build step, no package.json. Deployed as-is to Vercel. Layout: `index.html` (markup), `css/style.css`, `js/data.js` (towers/bugs/levels/waves), `js/audio.js` (WebAudio SFX), `js/entities.js` (Bug/Tower/Projectile/particles), `js/main.js` (state, loop, render, input, UI). Read `README.md` before non-trivial work.

## Documentation is part of "done"

- **Every gameplay change ships with its docs in the same PR.** Never leave doc updates as a later chore.
- **New tower, bug type, level, or mechanic**: update all three places together: the `README.md` mechanics/controls sections, the in-game legend and info panels in `index.html`, and the shop button descriptions. They drift apart fast otherwise.
- **Changed behavior → update the affected README section** in the same PR. Balance changes (damage tables, wave compositions, costs in `js/data.js`) get a one-line rationale in the PR description.
- Keep copy free of em dashes everywhere (code strings and docs): use periods, commas, or colons; en dashes only for numeric ranges. This is grep-checkable, keep it that way.

## Every feature needs a test plan

For each feature, before it merges:

1. **Test cases**: write the scenarios down in the PR description: happy path, boundary cases (budget exactly at cost, last life, final wave), and interactions with existing mechanics (flakiness, events, endless scaling).
2. **Automated smoke test**: run `scripts/smoke-test.sh`. It drives the real game headlessly (Chromium, no framework) through level select, placement, invalid-placement rejection, several waves, upgrade/sell/targeting, and the XSS-escape check, and fails unless `TEST-PASS` is printed. Extend the driver in `scripts/smoke-driver.html` when you add mechanics it should cover.
3. **Visual check**: capture screenshots with headless Chromium (`--screenshot --window-size=...`) at desktop (1500x1000) and mobile (390x844) widths for any layout or rendering change. Look at them; do not just confirm the file exists.
4. Keep game logic callable without user input (plain globals like `chooseLevel`, `placeTower`, `update`): that is what makes the headless driver possible. Do not hide state behind closures or modules without updating the harness.

## Model + sub-agent strategy

- **Plan with the strongest model; execute with cheaper ones.** Analysis, game-balance decisions, and final integration stay on the most capable model. Well-scoped mechanical tasks (new wave tables, CSS tweaks, doc sync) can go to sub-agents on cheaper tiers via the Agent tool's `model` param.
- Give each sub-agent a precise brief: files to read, the no-build-step constraint, the doc + smoke-test requirements above, and instructions to run `scripts/smoke-test.sh` before reporting done.
- The planning model keeps ownership of merges, balance sign-off, and anything touching score persistence.

## Workflow rules (learned the hard way)

- Always branch PRs off `main`; never stack on another open branch (it silently drops commits when the base merges first).
- Squash-merge and delete the branch; keep zero open PRs as the resting state.
- One PR per concern.
- No dependencies and no build step without explicit approval. The game must keep working when `index.html` is opened straight from disk.
- Scores: leaderboard and bests live in `localStorage`. `SCORES_ENDPOINT` in `js/main.js` may point to an optional public scores API; it must fail soft to local storage, and nothing secret ever goes in this repo (it is fully client-side).
- Anything user-visible that is injected into `innerHTML` (player names, level labels) goes through `escapeHtml`. No exceptions.
