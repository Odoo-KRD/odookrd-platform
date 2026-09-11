#!/usr/bin/env bash
#
# Deploys the currently checked-out commit.
#
# Exists mainly so SENTRY_RELEASE is set every time rather than when someone
# remembers. Without it, Sentry cannot tell you which deploy introduced an
# issue, which is most of the value of having releases at all.
#
# Usage (from the repository root):
#   ./deploy/deploy.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_ENV="apps/api/.env"
PORTAL_ENV="apps/portal/.env.local"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree is dirty. Commit or stash before deploying." >&2
  exit 1
fi

RELEASE="$(git rev-parse --short HEAD)"
echo "Deploying ${RELEASE}"

# --- tag the release in both environments ---------------------------------
set_release() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    echo "warning: $file not found, skipping release tag" >&2
    return
  fi

  if grep -q '^SENTRY_RELEASE=' "$file"; then
    sed -i "s/^SENTRY_RELEASE=.*/SENTRY_RELEASE=${RELEASE}/" "$file"
  else
    printf '\nSENTRY_RELEASE=%s\n' "$RELEASE" >> "$file"
  fi

  echo "  tagged $file"
}

set_release "$API_ENV"
set_release "$PORTAL_ENV"

# --- build ----------------------------------------------------------------
pnpm install --frozen-lockfile
pnpm --filter api prisma:generate
pnpm build

# --- restart --------------------------------------------------------------
sudo systemctl restart odookrd-api odookrd-portal

# --- verify ---------------------------------------------------------------
# A deploy that leaves the service down should say so here rather than being
# discovered by a monitor a few minutes later.
echo "Waiting for services to answer..."

for attempt in $(seq 1 15); do
  api_status="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/health/ready || true)"
  portal_status="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/health || true)"

  if [[ "$api_status" == "200" && "$portal_status" == "200" ]]; then
    echo "Deployed ${RELEASE}: API and portal healthy."
    exit 0
  fi

  sleep 2
done

echo "error: services did not become healthy (api=${api_status:-none} portal=${portal_status:-none})." >&2
echo "Check: sudo journalctl -u odookrd-api -u odookrd-portal --since '2 minutes ago'" >&2
exit 1
