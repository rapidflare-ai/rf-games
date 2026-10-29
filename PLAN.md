# Plan and handoff

Updated: 2026-10-29.

## Current status

- [x] Create the public `rapidflare-ai/rf-games` repository and implementation branch.
- [x] Capture product direction in `GOAL.md` and candidate games in `GAMES.md`.
- [x] Implement and verify Haunted Circuit Siege.
- [ ] Publish the implementation branch and open a pull request.
- [ ] Connect the GitHub repository to Vercel and choose a public domain when ready. The local Vercel CLI currently reports an invalid token, so repository import needs a refreshed Vercel login or an existing team integration.

## First-release scope

1. Keep game logic independent of presentation, with seeded UTC daily waves and unseeded practice.
2. Build a touch-first arcade interface with three lanes, two devices, visible energy and threat states, and a short first-play explanation.
3. Add seasonal themes, a result share flow, and local best-result persistence.
4. Check the deterministic rules, phone layout, keyboard flow, and static deployment configuration.

## Handoff notes

The site is static under `public/`; `vercel.json` points Vercel there. `public/engine.mjs` owns deterministic rules; `public/themes.mjs` owns theme data and date selection; `public/game.mjs` is the browser UI. The daily challenge uses the UTC date so it is common worldwide. No service credentials are required.

Verification so far: `node --test tests/*.test.mjs` passes (five rule checks); a local static server returned HTTP 200; browser play confirmed start, arming, a completed round, and theme switching. A simple scripted defense stopped all 19 machines in the October 29 wave and survived all 31 October seeds, showing the rounds can be won. A 390px browser viewport check confirmed the board and controls fit after starting a round, and the browser console showed no errors.

Open questions for a later iteration: whether to add a leaderboard, how to measure return play without tracking, and whether to promote a second game from `GAMES.md`.
