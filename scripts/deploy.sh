#!/usr/bin/env bash
# Deploy exactly what is committed at HEAD, and nothing the build never reads.
#
# Why: on 24 Sept a deploy from the working copy overwrote a day of uncommitted work, and every deploy was
# uploading ~59 MB (ledger snapshots, SQL grids, research docs) that the Next.js build does not use. This
# script refuses to run with uncommitted changes, exports HEAD with `git archive`, drops the data archives,
# and deploys that directory.
#
# Usage: scripts/deploy.sh "<proxy-path>"
#   The proxy path comes from the Netlify MCP deploy-site tool (it is a short-lived signed URL).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted changes. Commit (and push) first: deploys come from HEAD only." >&2
  git status --short >&2
  exit 1
fi
PROXY="${1:?pass the proxy path from the Netlify deploy-site tool}"
SITE_ID="78eef734-43c6-4ab4-8b93-3384df0fe013"
STAGE="$(mktemp -d)"
git archive HEAD | tar -x -C "$STAGE"
# Not read by the build or at runtime (reports/ is: /about/accuracy reads it).
# Keep scripts/sql/council_register.json: lib/councils.ts imports it as the fallback when the council_register table is
# missing or unreachable, so the build fails without it.
find "$STAGE/scripts/sql" -mindepth 1 ! -name council_register.json -exec rm -rf {} +
rm -rf "$STAGE/snapshots" "$STAGE/scripts/sql-2024" "$STAGE/scripts/claims" "$STAGE/docs"
echo "Deploying $(git rev-parse --short HEAD) ($(du -sh "$STAGE" | cut -f1) staged) to site $SITE_ID"
cd "$STAGE"
npx -y @netlify/mcp@latest --site-id "$SITE_ID" --no-wait --proxy-path "$PROXY"
