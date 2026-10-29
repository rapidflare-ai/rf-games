# Plan and handoff

Updated: 2026-10-29 (second game, accessibility and sound pass).

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
- [x] Open [PR #2](https://github.com/rapidflare-ai/rf-games/pull/2) with the workflow and deployment instructions.
- [x] Create the `rf-games` Vercel project in the Rapidflare team, without a Git import.
- [ ] Add the `VERCEL_TOKEN` Actions secret, run the first deployment, and attach `games.rapidflare.ai` (the share tags assume it; update them if a different address is chosen).

## Resume here

[PR #2](https://github.com/rapidflare-ai/rf-games/pull/2) (`codex/token-vercel-deploy`) adds the deploy workflow; it has been rebased onto `main` after both games merged. The `rf-games` Vercel project exists in the Rapidflare team with no Git import. Do not import or connect the GitHub repository in Vercel.

1. Create a Vercel token with access to the Rapidflare team and add it as the `VERCEL_TOKEN` repository Actions secret in `rapidflare-ai/rf-games`. GitHub does not expose existing secrets, so the `rf-ux`/`rf-docs` token cannot be copied.
2. Rerun PR #2's **Deploy to Vercel** workflow and check its preview URL: both games, `/updates`, and the `X-Robots-Tag: noindex` header.
3. Merge PR #2; the push to `main` starts the first production deployment. If needed, dispatch the workflow on `main` manually to retry.
4. Add `games.rapidflare.ai` under the project's Domains and create the DNS record Vercel shows. Then check the share cards in a link-preview debugger.

`README.md` has the deploy commands, and `scripts/deploy.sh` also deploys by hand for someone with the token.

## First-release scope

1. Keep game logic independent of presentation, with seeded UTC daily waves and unseeded practice.
2. Build a touch-first arcade interface with three craft bays, changing fault diagnostics, an explicit launch step, visible threats, and a short first-play explanation.
3. Make Flare useful through fault clues and three automatic component fits per round. Give seasonal enemies distinct art, nicknames, and subtle AI badges.
4. Add seasonal themes, a result share flow, and local best-result persistence.
5. Check the deterministic rules, phone layout, keyboard flow, and static deployment configuration.

## Handoff notes

The site is static under `public/`; `vercel.json` points Vercel there. `public/engine.mjs` owns deterministic rules and diagnostics; `public/themes.mjs` owns theme data and the `ACTIVE_THEME` launch switch; `public/game.mjs` is the browser UI. Upcoming themes are disabled in the dropdown. `public/updates.html` is an email signup painted door: inputs are disabled and no addresses are collected. The daily challenge uses the UTC date so it is common worldwide. The game needs no runtime credentials; the deploy workflow needs a Vercel token.

Verification after the diagnostic and theme-lock revision: `node --test tests/*.test.mjs` passes (seven rule checks); browser play confirmed the diagnostic appears instead of a named part, no tray component is highlighted, a wrong fit does not disclose the answer, and a correct fit enables launch. The active Halloween theme and disabled “coming soon” options rendered correctly. The Updates page rendered with both signup controls disabled and an explicit no-collection message. Both pages fit a 390px viewport without horizontal overflow. Earlier repair-and-launch verification also confirmed a full result flow and that a scripted defense survived all 31 October seeds. Vercel preview remains pending until the project and token are provisioned.

PR #2's latest Actions run passed checkout, Node setup, and the seven game checks, then stopped at the explicit token check. This confirms that the repository secret is the immediate setup blocker. The deployment script also passed `bash -n` and a mock CLI check for preview and production flags; workflow YAML parsed successfully. No live Vercel deployment has been tested yet.

Open questions for a later iteration: whether to add a leaderboard, how to measure return play without tracking, and whether to promote a second game from `GAMES.md`.
