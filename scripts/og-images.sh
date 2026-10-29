#!/usr/bin/env bash
# Regenerates the social share images in public/og/ from og/card.html. Needs Google Chrome.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
PORT=${PORT:-4199}
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill "$SERVER"' EXIT
sleep 1
mkdir -p public/og
for game in circuit-siege ten-questions; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 \
    --virtual-time-budget=3000 --screenshot="public/og/$game.png" \
    "http://localhost:$PORT/og/card.html?game=$game" 2>/dev/null
done
echo "Wrote public/og/circuit-siege.png and public/og/ten-questions.png"
