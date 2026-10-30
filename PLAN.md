# Plan and handoff

Updated: 2026-10-29 (Haunted Circuit Siege controls pass).

## Current status

- [x] Create the public `rapidflare-ai/rf-games` repository and implementation branch.
- [x] Capture product direction in `GOAL.md` and candidate games in `GAMES.md`.
- [x] Implement and verify Haunted Circuit Siege.
- [x] Publish and merge [PR #1](https://github.com/rapidflare-ai/rf-games/pull/1).
- [x] Replace explicit component requests with fault diagnostics that players solve, with the friendly AI (now Flare) as a limited assist.
- [x] Set Halloween as the active theme in code and show disabled upcoming themes in the selector.
- [x] Add an Updates page that explains future launch emails and clearly states signup is not available yet.
- [x] Rename the friendly AI to Flare and the ghouls to Chat al Ghoul, Doppelghoul, Clod and Grog; add Grog as a fourth enemy that dozes off and lurches, and give Clod a stomp.
- [x] Slow Circuit Siege down: a simulated player making one move every 1.6 s now survives every October seed (it needed one move a second before).
- [x] Add pause, keyboard shortcuts for every action, focus management, synthesized sound with a mute toggle, and a shared GAME menu.
- [x] Build Ten Questions Till Dawn with 100 pre-written puzzles and a daily rotation through all of them.
- [x] Keep the games out of search (noindex meta and header), add share cards with rendered images, and add a parody disclaimer.
- [x] Replace the crowded landing pages with a first-visit splash and an on-demand help panel; draw Flare as a blue flame holding a wrench (Circuit Siege) or a question sign (Ten Questions).
- [x] Add the token based Vercel CLI workflow used by other Rapidflare repos, without a Vercel Git import.
- [x] Merge [PR #2](https://github.com/rapidflare-ai/rf-games/pull/2) with the workflow and deployment instructions.
- [x] Create the `rf-games` Vercel project in the Rapidflare team, without a Git import.
- [x] Add the `VERCEL_TOKEN` Actions secret, run the first deployment, and attach `games.rapidflare.ai` (HTTP 200 from Vercel on 2026-10-29).
- [x] Add drag and drop from the tray onto a bay, a visible pause planning mode, Q/W/E lane keys, 1–5 part keys, and an always visible quick guide. Clarify Flare Auto-Fit and when diagnostics advance.

## Resume here

The current controls change is on `codex/haunted-drag-drop`, branched from `origin/main` at `155b5fb` after PR #2 merged. Open its PR, review the preview deployment, and merge when ready. The game is live at `games.rapidflare.ai`; the repository deploys through GitHub Actions with a Vercel token and has no Vercel Git import. `README.md` has the deploy commands, and `scripts/deploy.sh` also deploys by hand for someone with the token.

## First-release scope

1. Keep game logic independent of presentation, with seeded UTC daily waves and unseeded practice.
2. Build a touch-first arcade interface with three craft bays, changing fault diagnostics, an explicit launch step, visible threats, and a short first-play explanation.
3. Make Flare useful through fault clues and three automatic component fits per round. Give seasonal enemies distinct art, nicknames, and subtle AI badges.
4. Add seasonal themes, a result share flow, and local best-result persistence.
5. Check the deterministic rules, phone layout, keyboard flow, and static deployment configuration.

## Handoff notes

The site is static under `public/`; `vercel.json` points Vercel there. `public/engine.mjs` owns deterministic rules and diagnostics; `public/themes.mjs` owns theme data and the `ACTIVE_THEME` launch switch; `public/game.mjs` is the browser UI. Upcoming themes are disabled in the dropdown. `public/updates.html` is an email signup painted door: inputs are disabled and no addresses are collected. The daily challenge uses the UTC date so it is common worldwide. The game needs no runtime credentials; the deploy workflow needs a Vercel token.

Verification for the controls change: `node --test tests/*.test.mjs` passes all 18 checks. Browser play confirmed selecting a bay leaves its diagnostic unchanged; fitting the fighter's PCIe upgrade advances the bay to `1/2 · AI SIGNAL STILL LIVE`; dragging the jammer onto it completes the repair. Pausing froze the wave while leaving lane selection available, and pressing `3` fitted PCIe and resumed. The first bay is selected and visibly marked `ACTIVE BAY` at round start. A stale open `4173` browser tab showed the prior UI until reloaded; the current source and a fresh `4173` tab show Flare. Legacy internal names were removed from both games, and the separate candidate game in `GAMES.md` was renamed Repair the Bot.

Open questions for a later iteration: whether to add a leaderboard, how to measure return play without tracking, and whether to promote a second game from `GAMES.md`.
