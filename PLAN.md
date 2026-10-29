# Plan and handoff

Updated: 2026-10-29 (second game, accessibility and sound pass).

## Current status

- [x] Create the public `rapidflare-ai/rf-games` repository and implementation branch.
- [x] Capture product direction in `GOAL.md` and candidate games in `GAMES.md`.
- [x] Implement and verify Haunted Circuit Siege.
- [x] Publish the implementation branch and open [PR #1](https://github.com/rapidflare-ai/rf-games/pull/1).
- [x] Replace explicit component requests with fault diagnostics that players solve, with the friendly AI (now Flare) as a limited assist.
- [x] Set Halloween as the active theme in code and show disabled upcoming themes in the selector.
- [x] Add an Updates page that explains future launch emails and clearly states signup is not available yet.
- [x] Rename the friendly AI to Flare and the ghouls to Chat al Ghoul, Doppelghoul, Clod and Grog; add Grog as a fourth enemy that dozes off and lurches, and give Clod a stomp.
- [x] Slow Circuit Siege down: a simulated player making one move every 1.6 s now survives every October seed (it needed one move a second before).
- [x] Add pause, keyboard shortcuts for every action, focus management, synthesized sound with a mute toggle, and a shared GAME menu.
- [x] Build Ten Questions Till Dawn with 100 pre-written puzzles and a daily rotation through all of them.
- [ ] Connect the GitHub repository to Vercel and choose a public domain when ready. The local Vercel CLI currently reports an invalid token, so repository import needs a refreshed Vercel login or an existing team integration.

## First-release scope

1. Keep game logic independent of presentation, with seeded UTC daily waves and unseeded practice.
2. Build a touch-first arcade interface with three craft bays, changing fault diagnostics, an explicit launch step, visible threats, and a short first-play explanation.
3. Make Flare useful through fault clues and three automatic component fits per round. Give seasonal enemies distinct art, nicknames, and subtle AI badges.
4. Add seasonal themes, a result share flow, and local best-result persistence.
5. Check the deterministic rules, phone layout, keyboard flow, and static deployment configuration.

## Handoff notes

The site is static under `public/`; `vercel.json` points Vercel there. `public/engine.mjs` owns deterministic rules and diagnostics; `public/themes.mjs` owns theme data and the `ACTIVE_THEME` launch switch; `public/game.mjs` is the browser UI. Upcoming themes are disabled in the dropdown. `public/updates.html` is an email signup painted door: inputs are disabled and no addresses are collected. The daily challenge uses the UTC date so it is common worldwide. No service credentials are required.

Verification after the diagnostic and theme-lock revision: `node --test tests/*.test.mjs` passes (seven rule checks); browser play confirmed the diagnostic appears instead of a named part, no tray component is highlighted, a wrong fit does not disclose the answer, and a correct fit enables launch. The active Halloween theme and disabled “coming soon” options rendered correctly. The Updates page rendered with both signup controls disabled and an explicit no-collection message. Both pages fit a 390px viewport without horizontal overflow. Earlier repair-and-launch verification also confirmed a full result flow and that a scripted defense survived all 31 October seeds. Vercel preview remains pending because the CLI token is invalid and the browser requires login.

Open questions for a later iteration: whether to add a leaderboard, how to measure return play without tracking, and whether to promote a second game from `GAMES.md`.
