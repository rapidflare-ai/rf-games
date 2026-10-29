# Rapid Games

Small, replayable browser games from Rapidflare. The first game is **Haunted Circuit Siege**: defend a neighborhood from a rogue frontier AI and its possessed machines with a friendly AI and a few electronic components.

## Play locally

Serve `public/` with any static file server, for example:

```bash
python3 -m http.server 4173 --directory public
```

Open <http://localhost:4173>. There is no build step, account, database, or runtime dependency. Run the game logic checks with `node --test tests/*.test.mjs`.

## Deploy on Vercel

Import this repository as a new Vercel project. The checked-in `vercel.json` selects the `public/` output directory and skips the build. Connect the repository to get preview deployments on pull requests. Publishing to a public domain is a separate Vercel project decision.

## Project notes

- [GOAL.md](GOAL.md) captures the product direction and constraints.
- [GAMES.md](GAMES.md) records the candidate games and why Haunted Circuit Siege came first.
- [PLAN.md](PLAN.md) tracks implementation and handoff status.

Seasonal copy and colors live in `public/themes.mjs`. Game rules and the seeded daily wave live in `public/engine.mjs`.
