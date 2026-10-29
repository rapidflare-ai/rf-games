# Goal: Rapid Games

Create a small, public, phone-friendly web game line with a distinctive electronics and AI premise. A dangerous frontier AI has merged with machines, while a friendly AI helps humans improvise electronic defenses. The games can evoke Rapidflare's domain without product pitches inside the play experience.

## Product principles

- A complete round should take about a minute, be understandable in a few seconds, and invite another try.
- A shared daily challenge creates a reason to return and a result worth sharing. Practice remains available without an account.
- The visual style can be compact 1980s arcade art. Performance, clear controls, and interaction matter more than elaborate graphics.
- The game runs on mobile web and deploys as a lightweight static site on Vercel.
- Themes are data-driven so the same rules can wear Halloween, winter holiday, or other timely skins. One theme is set live in code; upcoming themes appear as disabled “coming soon” choices. Styling must never change the fairness of a daily challenge.
- Keep the villain and characters original. Satire can target the idea of overconfident frontier AI without copying a real company's name, mark, mascot, or a film character.
- Rapidflare appears only in the linked footer credit: “Designed and designed for fun by Rapidflare.” Marketing and hosting can make the connection outside the game.

## First release: Haunted Circuit Siege

Halloween is the first theme. Frontier AI ghouls march toward a human shelter. Players select a craft bay, infer which electronic component solves its fault diagnostic, and launch the repaired craft from the shelter to intercept them. A scout drone starts with a position fault solved by a GPS antenna; a fighter jet needs an expansion bus upgrade before its jammer; each bay gets new diagnostics after a launch. Patch is a friendly AI that explains faults and can fit three parts per round. Wrong fits cost points. Each UTC day has one deterministic wave; practice waves are unlimited.

The Halloween enemies should look like ghouls and have original frontier-AI nicknames and a subtle “AI” mark. The launch should include a responsive dark arcade presentation, keyboard and touch controls, clear feedback, accessible labels and reduced-motion support, a result card that can be copied or shared, and locally saved best daily results. It should need no login, cookies, analytics, server, or paid assets.

An Updates page can preview occasional email notices when new seasonal games launch. It should promise no spam or unrelated marketing and clearly state that signup is not available yet. No email addresses are collected in the first release.

## Success signals

- A new player can start and understand how to repair and launch a craft without reading a long manual.
- A phone player can finish a round without horizontal scrolling or tiny tap targets.
- The daily wave is identical for people playing on different devices on the same UTC date.
- The share text communicates a result and a link without revealing the wave sequence.
- A new theme can be added by editing one configuration module and CSS tokens, without changing game rules.

See [GAMES.md](GAMES.md) for future concepts and [PLAN.md](PLAN.md) for implementation status.
