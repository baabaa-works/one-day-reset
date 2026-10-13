# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` holds the shared repository guidelines (also read by Codex); this file adds only what is specific to working in the code. User-facing copy is Traditional Chinese (zh-TW).

## What this is

A static, dependency-free reflection tool: a 3-question "90-second snapshot" entry flow plus the original 28-node "workbench". No backend, no build, no lint, no package.json. Published as plain files on GitHub Pages. Everything user-written stays in the browser's `localStorage`.

## Commands

```bash
node scripts/preview.cjs                    # serves http://127.0.0.1:4173 (only index.html, growth-tools.html, assets/)
node --check assets/growth.js               # syntax check; repeat per changed file
node tests/analytics-check.cjs              # Node-only: privacy/dedupe/attribution invariants (vm-loads assets/analytics*.js; quota is covered by tests/storage-quota-v2.js)
node tests/calendar-check.cjs               # Node-only: ICS output
node scripts/verify.cjs <abs-path-to-playwright-package>/cli.js [startSuite]   # whole browser suite; needs preview server running
```

Browser tests are Playwright CLI scripts, not a test runner. Run one suite (preview server must be up):

```bash
playwright-cli open http://127.0.0.1:4173 --browser=msedge
playwright-cli run-code --filename=tests/share-v2.js
playwright-cli eval "window.shareV2Report"
```

Each `tests/*.js` is an `async page => {...}` body that throws on the first failed check and leaves a `window.<name>Report` object with a `passed` count; `verify.cjs` maps suite name → report key (`browser-flow`→`testReport`, `entry-v2`→`entryV2Report`, …) and fails on an empty report. Mobile suites use `-s=mobile ... --device="iPhone 15"`. If `playwright-cli` isn't on PATH, use `node <playwright-package>/cli.js cli`. The tests **clear localStorage/sessionStorage** of their context — only run them in the isolated test browser. Output lands in `test-results/` and `.playwright-cli/` (both gitignored).

## Architecture

There is no module system. `index.html` loads classic scripts that communicate through frozen `window` globals, and **load order matters**:

1. Inline `<script>` in `index.html` — the original workbench (28 nodes, state, render, JSON import/export). Owns key `one-day-reset-tw-v1` and exposes `window.ResetWorkbench` (`read`, `move`, `checkpoints`, `bring`). It is the only extension boundary into the legacy state; `verify.cjs` regex-extracts the first `<script>…</script>` to syntax-check it, so keep it first and un-attributed.
2. `analytics-config.js` → `analytics.js` → `privacy.js` → `calendar.js` → `local-ui.js` → `safety.js` → `workbench.js` → `growth.js` → `voice.js` (self-contained; adds 「用說的」 mic buttons to text fields via a MutationObserver and writes through normal `input` events). Later files read earlier globals at load time (`ResetAnalytics`, `ResetCalendar`, `ResetLocalUI`, `ResetWorkbench`).
3. `growth.js` renders the snapshot / share-card UI into `#growth` and toggles the legacy `#app`. `workbench.js` layers the second-round features (one-question-at-a-time mobile flow, six reminders → ICS, six-grid card, 7/30-day review) onto the legacy workbench via the `reset:workbench` event instead of editing its state format.
4. `growth-tools.html` is a separate owner page (no login, local data only) built from `analytics-config.js` + `analytics.js` + `analytics-panel.js`. Not linked from the visitor home page.

`ResetLocalUI` is the shared fallback layer for in-app browsers (Threads/Instagram/LINE): clipboard → manual-select dialog, download → long-press image, storage probe. New share/copy/download code should go through it and fire the matching local-only failure event rather than assume the API works.

### localStorage keys (separate on purpose)

| Key | Owner | Notes |
| --- | --- | --- |
| `one-day-reset-tw-v1` | index.html | Workbench state. **Format and key are frozen**; imports also accept the legacy raw `{morning, evening}` shape. |
| `one-day-reset-snapshot-v1` | growth.js | Snapshot draft (`answers`, `tags`, `identity`, `scheduledAt`, `step`, optional `done`). |
| `one-day-reset-workbench-options-v1` | workbench.js | Reminder prompts/times, skips, position, `brought` (snapshot answers already carried into the workbench). Not part of the JSON backup. |
| `one-day-reset-game-card-v1` | workbench.js | Explicitly saved six-grid card. Not part of the JSON backup. |
| `one-day-reset-analytics-v1` / `-session-v1` / `-consent-v1` | analytics.js | Counters only; 30-minute same-tab session window. |

### Analytics and privacy constraints (enforced in code, tested by `analytics-check.cjs`)

- Events, property names and property values are allowlists in `analytics.js`; unknown values are dropped, never stored. Never add free text, answers, UA strings or IDs to an event.
- `utm_campaign` / `utm_content` / `s=` short links are only recognized if registered in `analytics-config.js` (`campaigns`, `contents`, `shortLinks`); otherwise they bucket as `unregistered`. Adding a new post code means editing that file and `docs/growth-analytics.md`.
- `RESET_ANALYTICS_CONFIG.enabled` is `true` with the owner's public Umami `websiteId` (owner consented 2026-10-13). The owner chose opt-out: allowlisted anonymous events send by default on the published hostname only, visitors can stop them in 「隱私與資料」, and DNT/GPC always block. Do not widen what is sent, remove the stop control or change the ID without the owner asking.
- Share cards: the default card is generic; personal text only enters a card after an explicit choice + confirmation, lives in memory, and never goes into URLs or analytics. Calendar/ICS and Google Calendar links carry reminder prompts only, never workbench answers.

## Docs worth knowing

`README.md` (zh-TW) is the authoritative description of flows, short links and the privacy model; `docs/growth-analytics.md` defines each event; `docs/verification-report.md` records what was and was not verified (real-device/crawler limits). Update README and these docs when behavior or test counts change. `og:image` in `index.html` assumes the GitHub Pages URL — adjust if the base URL changes.
