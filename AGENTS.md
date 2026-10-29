# Agent guide: rf-games

`rf-games` is an independent public repository in the Rapidflare workspace. Keep Git operations inside this checkout; do not stage or commit files in `rf-workspace` or neighboring repos.

## Read first

- `GOAL.md`: product intent and constraints.
- `GAMES.md`: candidate games and future ideas.
- `PLAN.md`: current handoff and remaining work.

## Implementation

The site is buildless and static, in `public/`, and holds two games picked from a shared GAME menu. Haunted Circuit Siege lives at the root: `engine.mjs` contains game rules and deterministic wave generation, `themes.mjs` contains seasonal presentation data (including ghoul names, also used by the second game), and `game.mjs` controls the browser interface. Ten Questions Till Dawn lives in `public/ten-questions/`: `cases.mjs` holds its 100 hand-written puzzles, `engine.mjs` its rules, and `game.mjs` its interface. `site.mjs` (game menu, sound toggle) and `audio.mjs` (synthesized sound effects) are shared. Avoid adding a framework, server, user account, or external asset dependency unless the game needs one.

Run `node --test tests/*.test.mjs` for rule checks. For visual checks, serve `public/` from a local static server and test a narrow phone viewport as well as desktop. Vercel serves `public/` according to `vercel.json`.

The daily wave is keyed to the UTC date. Keep theme changes independent from gameplay so a day's challenge remains comparable. Flare's friendly help and the repair-and-launch interaction are core to the first game. Keep both games fully playable by keyboard and screen reader: every action needs a shortcut, a visible focus state and a status message. Do not put Rapidflare product messaging in the game; retain the linked footer credit from `GOAL.md`.
