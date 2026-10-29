# Agent guide: rf-games

`rf-games` is an independent public repository in the Rapidflare workspace. Keep Git operations inside this checkout; do not stage or commit files in `rf-workspace` or neighboring repos.

## Read first

- `GOAL.md`: product intent and constraints.
- `GAMES.md`: candidate games and future ideas.
- `PLAN.md`: current handoff and remaining work.

## Implementation

The first game is a buildless static site in `public/`. `engine.mjs` contains game rules and deterministic wave generation, `themes.mjs` contains seasonal presentation data, and `game.mjs` controls the browser interface. Avoid adding a framework, server, user account, or external asset dependency unless the game needs one.

Run `node --test tests/*.test.mjs` for rule checks. For visual checks, serve `public/` from a local static server and test a narrow phone viewport as well as desktop. Vercel serves `public/` according to `vercel.json`.

The daily wave is keyed to the UTC date. Keep theme changes independent from gameplay so a day's challenge remains comparable. Patch's friendly help and the repair-and-launch interaction are core to the first game. Do not put Rapidflare product messaging in the game; retain the linked footer credit from `GOAL.md`.
