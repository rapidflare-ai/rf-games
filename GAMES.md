# Game ideas

All three concepts use the same world: a rogue frontier AI animates machines, people resist with electronics, and a friendly AI helps. They are small mobile web games with a daily challenge, short rounds, practice, and a shareable result. Names are working titles.

| Game | Core loop | Replay hook | Seasonal expression |
| --- | --- | --- | --- |
| **Circuit Siege** | Flare reports a craft fault. Infer the right component, fit it, launch the craft from the shelter, and intercept approaching frontier-AI machines. Diagnostics change after each launch. | One seeded daily wave, a best score, and unlimited practice. | Halloween: AI-marked ghouls and a haunted factory. Winter: a gift-stealing rogue machine and toy workshop. |
| **Signal Jam** | Tap or hold to tune a signal and disable swarms of corrupted devices. | Fast skill rounds, streaks, and daily signal patterns. | Different threats, signal colors, music, and backgrounds. |
| **Patch the Bot** | Connect components to repair a friendly AI's circuit under a move limit. | A daily logic puzzle and a compact solution pattern to share. | Swappable circuit art, story text, and board goals. |

## First choice

**Haunted Circuit Siege** is the first implementation. Repairing craft makes the electronics theme tangible. Flare's diagnostics, clues, and limited automatic repairs make the friendly AI part of play, while the rules fit in a single screen and support future seasonal skins.

## Second game: Ten Questions Till Dawn

Built as the second game at `/ten-questions/`. Flare picks one part from a category of ten; the player asks yes-or-no questions from a fixed list, crosses out suspects using each part's spec line, and names the part. Each question moves the ghoul one step closer, a wrong guess three; ten steps and it reaches the shelter. The 100 puzzles (ten categories × ten parts, each with its own brief) are written ahead of time, and the daily case steps through all of them before repeating.

## Future possibilities

- Add new craft and components only when they create a clear strategic choice.
- Add curated special daily waves or community challenges after the basic loop proves fun.
- If people return, consider optional leaderboards with privacy and abuse protections. The first release deliberately needs no backend.
