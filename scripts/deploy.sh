#!/usr/bin/env bash
# Builds the SPA and swaps the nginx document root to a new release directory.
# The server's nginx root should point at $DEPLOY_PATH/current.
set -euo pipefail

cd "$(dirname "$0")/.."

: "${DEPLOY_HOST:?Set DEPLOY_HOST}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH}"

npm run typecheck
npm run build

archive="$(mktemp -t saga-dist).tgz"
tar -czf "$archive" -C dist .
release="$DEPLOY_PATH/releases/$(date +%Y%m%d%H%M%S)"

scp "$archive" "$DEPLOY_HOST:/tmp/saga-dist.tgz"
ssh "$DEPLOY_HOST" "mkdir -p '$release' && tar -xzf /tmp/saga-dist.tgz -C '$release' && ln -sfn '$release' '$DEPLOY_PATH/current' && sudo nginx -s reload"
rm -f "$archive"
