#!/usr/bin/env bash
set -euo pipefail

target="${1:-preview}"
if [[ "$target" != preview && "$target" != production ]]; then
  echo 'Usage: scripts/deploy.sh [preview|production]' >&2
  exit 2
fi
if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo 'VERCEL_TOKEN is required. Add it to your environment before deploying.' >&2
  exit 2
fi
if ! command -v vercel >/dev/null 2>&1; then
  echo 'Vercel CLI is required. Install it with: npm install --global vercel' >&2
  exit 2
fi

cd "$(dirname "$0")/.."

export VERCEL_ORG_ID=team_9M9iwOU6o3Njuzwov6Joyu4N
export VERCEL_PROJECT_ID=rf-games

args=(deploy --yes --archive=tgz --scope rapidflare --token "$VERCEL_TOKEN")
if [[ "$target" == production ]]; then
  args+=(--prod)
fi

vercel "${args[@]}"
