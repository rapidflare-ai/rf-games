# Rapid Games

Small, replayable browser games from Rapidflare, picked from the GAME menu at the top of every page. **Haunted Circuit Siege** (`/`): Flare, a friendly AI, helps people repair and launch craft against a rogue frontier AI's ghoulish machines.

## Play locally

Serve `public/` with any static file server, for example:

```bash
python3 -m http.server 4173 --directory public
```

Open <http://localhost:4173> for Circuit Siege or <http://localhost:4173/ten-questions/> for Ten Questions. There is no build step, account, database, or runtime dependency. Run the game logic checks for both games with `node --test tests/*.test.mjs`.

## Deploy on Vercel

Import this repository as a new Vercel project. The checked-in `vercel.json` selects the `public/` output directory and skips the build. Connect the repository to get preview deployments on pull requests. Publishing to a public domain is a separate Vercel project decision.

## Project notes

- [GOAL.md](GOAL.md) captures the product direction and constraints.
- [GAMES.md](GAMES.md) records the candidate games and why Haunted Circuit Siege came first.
- [PLAN.md](PLAN.md) tracks implementation and handoff status.

Seasonal copy and colors live in `public/themes.mjs`; change `ACTIVE_THEME` there when a new skin launches. Other themes appear as disabled upcoming choices. The Updates page is a signup preview only and collects no addresses. Game rules, fault diagnostics, and the seeded daily wave live in `public/engine.mjs`.

Shared pieces live at the top of `public/`: `site.mjs` builds the GAME menu and the sound toggle, and `audio.mjs` synthesizes every sound effect with Web Audio (no audio files). Both games are fully keyboard-playable; the shortcuts are listed under each game.

Ten Questions Till Dawn has 100 hand-written puzzles in `public/ten-questions/cases.mjs`: ten categories of parts, ten parts each, and one brief per part. Nothing calls a model at runtime. The daily case steps through all 100 before repeating.
