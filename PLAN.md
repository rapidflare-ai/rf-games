# Plan and handoff

Updated: 2026-10-30 (visual clues, penalties, mobile layouts, and result screens).

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
- [x] Add share cards with rendered images and a parody disclaimer. Index the games and About page with Rapidflare attribution and canonical URLs.
- [x] Replace the crowded landing pages with a first-visit splash and an on-demand help panel; draw Flare as a blue flame holding a wrench (Circuit Siege) or a question sign (Ten Questions).
- [x] Add the token based Vercel CLI workflow used by other Rapidflare repos, without a Vercel Git import.
- [x] Merge [PR #2](https://github.com/rapidflare-ai/rf-games/pull/2) with the workflow and deployment instructions.
- [x] Create the `rf-games` Vercel project in the Rapidflare team, without a Git import.
- [x] Add the `VERCEL_TOKEN` Actions secret, run the first deployment, and attach `games.rapidflare.ai` (HTTP 200 from Vercel on 2026-10-29).
- [x] Add drag and drop from the tray onto a bay, a visible pause planning mode, Q/W/E lane keys, part number keys, and an always visible quick guide. Clarify Flare Auto-Fit and when diagnostics advance.
- [x] Expand Circuit Siege to eight parts and eight faults, with matching SVG silhouettes in each bay and the tray. Wrong fits deduct 60 points and lock repairs for 1.6 seconds; number keys 1–8 remain available.
- [x] Move Flare's short guidance into a speech bubble beside its avatar. Use larger phone-friendly part tiles and show the active fault shape next to the bay diagnostic.
- [x] Make Ten Questions more visual with a prominent target card, larger part icons, and answer cards. Give both games bold win/loss screens that call out the rogue AI.
- [x] Enlarge Flare throughout both games and reshape the shared SVG with three visible flame tips, using the blog avatar as the reference.
- [x] Remove the launch-count score bonus so repeated launches cannot inflate Circuit Siege's score; start a fresh v4 local best for that revision and v5 after the wrong-fit penalty change.

## Resume here

[PR #4](https://github.com/rapidflare-ai/rf-games/pull/4) merged. The indexing, About, analytics, and guide changes are on `codex/games-indexing-analytics`. The game is live at `games.rapidflare.ai`; the repository deploys through GitHub Actions with a Vercel token and has no Vercel Git import. `README.md` has the deploy commands and Mixpanel setup. Analytics becomes active once the GitHub Actions `MIXPANEL_TOKEN` variable is set and a new deployment runs.

## First-release scope

1. Keep game logic independent of presentation, with seeded UTC daily waves and unseeded practice.
2. Build a touch-first arcade interface with three craft bays, changing fault diagnostics, an explicit launch step, visible threats, and a short first-play explanation.
3. Make Flare useful through fault clues and three automatic component fits per round. Give seasonal enemies distinct art, nicknames, and subtle AI badges.
4. Add seasonal themes, a result share flow, and local best-result persistence.
5. Check the deterministic rules, phone layout, keyboard flow, and static deployment configuration.

## Handoff notes

The site is static under `public/`; `vercel.json` points Vercel there. `public/engine.mjs` owns deterministic rules and diagnostics; `public/themes.mjs` owns theme data and the `ACTIVE_THEME` launch switch; `public/game.mjs` is the browser UI. Upcoming themes are disabled in the dropdown. `public/updates.html` is an email signup painted door: inputs are disabled and no addresses are collected. The daily challenge uses the UTC date so it is common worldwide. The game needs no runtime credentials; the deploy workflow needs a Vercel token.

Verification for the controls change: `node --test tests/*.test.mjs` passes all 18 checks. Browser play confirmed selecting a bay leaves its diagnostic unchanged; fitting the fighter's PCIe upgrade advances the bay to `1/2 · AI SIGNAL STILL LIVE`; dragging the jammer onto it completes the repair. Pausing froze the wave while leaving lane selection available, and pressing `3` fitted PCIe and resumed. The first bay is selected and visibly marked `ACTIVE BAY` at round start. A stale open `4173` browser tab showed the prior UI until reloaded; the current source and a fresh `4173` tab show Flare. Legacy internal names were removed from both games, and the separate candidate game in `GAMES.md` was renamed Repair the Bot.

Flare art follow-up: `public/flare.mjs` now draws a distinct left, center, and right flame tip. The shared CSS enlarges Flare on the intro card, repair bay, splash cast, and Ten Questions hero. Both local pages were visually checked at desktop width; the 18 rule and page checks still pass.

Scoring note: Circuit Siege has a bounded score after the launch-count bonus was removed: 100 per ghoul stopped, 250 per shelter heart left, and 60 off per wrong fit, with a maximum of 2350 for 16 ghouls. Both games still run entirely in the browser. Local best scores and shared text are unverified; a competitive leaderboard would require server-side validation of a play log against the daily scenario. Ten Questions cases and answers are published in client JavaScript, so its daily result is also not cheat resistant.

Open questions for a later iteration: whether to add a leaderboard, how to use consented Mixpanel data to measure return play, and whether to promote another game from `GAMES.md`.
