# Rapid Games

Small, replayable browser games from Rapidflare, picked from the GAME menu at the top of every page. **Haunted Circuit Siege** (`/`): Flare, a friendly AI, helps people repair and launch craft against a rogue frontier AI's ghoulish machines.

## Play locally

Serve `public/` with any static file server, for example:

```bash
python3 -m http.server 4173 --directory public
```

Open <http://localhost:4173> for Circuit Siege or <http://localhost:4173/ten-questions/> for Ten Questions. There is no build step, account, database, or runtime dependency. Run the game logic checks for both games with `node --test tests/*.test.mjs`.

## Deploy on Vercel

Deployments use the Vercel CLI with a token; **do not import or connect the GitHub repository in Vercel**. The checked-in `vercel.json` serves `public/` without a build step. GitHub Actions deploys same-repository pull requests as previews and pushes to `main` as production.

One-time setup in the Rapidflare Vercel team (install the Vercel CLI first):

1. The `rf-games` project already exists in the team, created without a Git connection. If it ever needs recreating, use `vercel project add rf-games --scope rapidflare --token "$VERCEL_TOKEN"`. The deploy script targets it by project ID; update `scripts/deploy.sh` if it is recreated.
2. Create a Vercel token with access to the team and add it as the `VERCEL_TOKEN` **Actions secret** in `rapidflare-ai/rf-games`. Existing repositories' secrets cannot be read or copied from GitHub.
3. Push a branch for a preview deployment. Merging a PR into `main` deploys production automatically. Use **Deploy to Vercel → Run workflow** on `main` for a manual retry.
4. Verify the generated `vercel.app` URL: both games, `/about`, `/updates`, `robots.txt`, and `sitemap.xml`. Then add `games.rapidflare.ai` under the project's Domains and create the DNS record Vercel shows.

Anyone with the team token can also deploy directly from this checkout after installing the Vercel CLI:

```bash
# Supply VERCEL_TOKEN in the shell through your secure credential workflow.
scripts/deploy.sh preview
scripts/deploy.sh production
```

The script targets the `rf-games` project in the Rapidflare team. Production deploys publish immediately to any production domain attached to that project. No game runtime secrets are needed.

The games and the About page are indexable. Each page has a canonical URL and identifies Rapidflare in its metadata or page copy. `robots.txt` allows crawling and points to `sitemap.xml`. Sharing uses Open Graph and Twitter card tags.

Host the games on their own subdomain or domain (the share tags assume `https://games.rapidflare.ai`), not under a path of the marketing site. If the address changes, update canonical and share URLs in the HTML pages, `robots.txt`, and `sitemap.xml`. The share images in `public/og/` are rendered from `og/card.html` with `scripts/og-images.sh` (needs Google Chrome).

## Optional Mixpanel analytics

The game pages, About page, and Updates page show an optional analytics choice only when a Mixpanel project token is configured. The Mixpanel browser SDK loads only after a visitor accepts. Visitors can reopen **Analytics settings** and decline later. No event is sent before consent. The site tracks page views, About link clicks, game starts and finishes, Help opens, Flare Auto-Fit uses, and result shares. Game events include the game and daily or practice mode; no puzzle answers or personal information are sent in custom properties.

To enable production analytics, create or choose a Mixpanel project and copy its **project token** (the public browser token, not an API secret). In `rapidflare-ai/rf-games` on GitHub, add an Actions **variable** named `MIXPANEL_TOKEN` under **Settings → Secrets and variables → Actions**. The deploy workflow writes the token into `public/analytics-config.mjs` before publishing. Trigger a new deployment after setting it. To enable a manual deployment, set `MIXPANEL_TOKEN` in your shell before running `scripts/deploy.sh`. The checked-in config has an empty token, so local play and deployments without the variable run with analytics off.

## Project notes

- [GOAL.md](GOAL.md) captures the product direction and constraints.
- [GAMES.md](GAMES.md) records the candidate games and why Haunted Circuit Siege came first.
- [PLAN.md](PLAN.md) tracks implementation and handoff status.

Seasonal copy and colors live in `public/themes.mjs`; change `ACTIVE_THEME` there when a new skin launches. Other themes appear as disabled upcoming choices. The Updates page is a signup preview only and collects no addresses. Game rules, fault diagnostics, and the seeded daily wave live in `public/engine.mjs`.

Shared pieces live at the top of `public/`: `site.mjs` builds the GAME menu and the sound toggle, and `audio.mjs` synthesizes every sound effect with Web Audio (no audio files). Both games are fully keyboard-playable; the shortcuts are listed under each game.

Ten Questions Till Dawn has 100 hand-written puzzles in `public/ten-questions/cases.mjs`: ten categories of parts, ten parts each, and one brief per part. Nothing calls a model at runtime. The daily case steps through all 100 before repeating.
