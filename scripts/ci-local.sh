#!/usr/bin/env bash
# scripts/ci-local.sh
#
# Local replica of .github/workflows/ci.yml. Use this when GitHub Actions
# is unavailable (billing block, offline work) or to validate a change
# before pushing.
#
# Usage:
#   pnpm ci:local         # full pipeline (fast + e2e + web + build)
#   pnpm ci:local --fast  # skip e2e + web + build (lint + unit only, ~1-2 min)
#
# Environment expected:
#   - docker + docker compose available
#   - pnpm installed (declared via packageManager in root package.json)
#   - Project root on PATH (cwd is set automatically)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ---------------------------------------------------------------------
# Config — must match .github/workflows/ci.yml exactly
#
# These are NOT readonly because the test functions below pass them
# inline as per-command env overrides (VAR="$VAR" cmd ...), which bash
# rejects on readonly variables even when the value is unchanged.
# ---------------------------------------------------------------------
DB_USER="taller"
DB_PASS="taller_dev"
DB_NAME="taller_saas_test"
DB_HOST="localhost"
DB_PORT="5432"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="test-secret"

DATABASE_URL_OWNER="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
DATABASE_URL_APP="postgresql://taller_app:taller_app_dev@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# ---------------------------------------------------------------------
# Mode
# ---------------------------------------------------------------------
MODE="full"
for arg in "$@"; do
  case "$arg" in
    --fast) MODE="fast" ;;
    --help|-h)
      cat <<'HELP'
scripts/ci-local.sh — local replica of .github/workflows/ci.yml

Use when GitHub Actions is unavailable (billing block, offline work) or
to validate a change before pushing.

Usage:
  pnpm ci:local              full pipeline (lint + unit + e2e + web + build)
  pnpm ci:local:fast         fast pipeline (lint + unit only, ~1-2 min)
  bash scripts/ci-local.sh --help

Requires:
  - docker + docker compose
  - pnpm (declared via packageManager in root package.json)
HELP
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Run with --help for usage." >&2
      exit 2
      ;;
  esac
done

# ---------------------------------------------------------------------
# Pretty output
# ---------------------------------------------------------------------
readonly C_BLUE='\033[0;34m'
readonly C_GREEN='\033[0;32m'
readonly C_YELLOW='\033[1;33m'
readonly C_RED='\033[0;31m'
readonly C_BOLD='\033[1m'
readonly C_RESET='\033[0m'

step() { printf "\n${C_BOLD}${C_BLUE}▶ %s${C_RESET}\n" "$1"; }
ok()   { printf "${C_GREEN}✓ %s${C_RESET}\n" "$1"; }
warn() { printf "${C_YELLOW}⚠ %s${C_RESET}\n" "$1"; }
fail() { printf "${C_RED}✗ %s${C_RESET}\n" "$1" >&2; exit 1; }

start_time=$(date +%s)

# ---------------------------------------------------------------------
# 1. Bring up services
# ---------------------------------------------------------------------
ensure_services() {
  step "Bringing up postgres + redis (docker compose)"
  docker compose up -d postgres redis >/dev/null

  step "Waiting for services healthy"
  local attempts=30
  while (( attempts > 0 )); do
    if docker compose exec -T postgres pg_isready -U "$DB_USER" >/dev/null 2>&1 \
       && docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
      ok "postgres + redis healthy"
      return
    fi
    sleep 1
    (( attempts-- ))
  done
  fail "Services did not become healthy in 30s"
}

# ---------------------------------------------------------------------
# 2. Recreate test database (fresh state every run)
# ---------------------------------------------------------------------
recreate_test_db() {
  step "Recreating test database '$DB_NAME'"
  docker compose exec -T postgres psql -U "$DB_USER" -d postgres -c \
    "DROP DATABASE IF EXISTS $DB_NAME;" >/dev/null
  docker compose exec -T postgres psql -U "$DB_USER" -d postgres -c \
    "CREATE DATABASE $DB_NAME OWNER $DB_USER;" >/dev/null
  ok "database '$DB_NAME' ready"
}

# ---------------------------------------------------------------------
# 3. Install + lint + build shared
# ---------------------------------------------------------------------
install_deps() {
  step "pnpm install --frozen-lockfile"
  pnpm install --frozen-lockfile
  ok "deps installed"
}

run_lint() {
  step "pnpm lint"
  pnpm lint
  ok "lint clean"
}

build_shared() {
  step "build @taller-saas/shared"
  pnpm --filter @taller-saas/shared build
  ok "@taller-saas/shared built"
}

# ---------------------------------------------------------------------
# 4. Prisma generate + migrate
# ---------------------------------------------------------------------
prisma_setup() {
  step "Prisma generate"
  pnpm --filter @taller-saas/api prisma:generate
  ok "prisma client generated"

  step "Prisma migrate deploy"
  DATABASE_URL="$DATABASE_URL_OWNER" \
    pnpm --filter @taller-saas/api exec prisma migrate deploy
  ok "migrations applied"
}

# ---------------------------------------------------------------------
# 5. API unit tests
# ---------------------------------------------------------------------
test_api_unit() {
  step "API unit tests"
  DATABASE_URL="$DATABASE_URL_OWNER" \
  REDIS_URL="$REDIS_URL" \
  JWT_SECRET="$JWT_SECRET" \
    pnpm --filter @taller-saas/api test
  ok "API unit tests green"
}

# ---------------------------------------------------------------------
# 6. API E2E tests (uses taller_app role with NOSUPERUSER NOBYPASSRLS)
# ---------------------------------------------------------------------
test_api_e2e() {
  step "API E2E tests (RLS-enforced via taller_app role)"
  DATABASE_URL="$DATABASE_URL_APP" \
  DATABASE_URL_TEST="$DATABASE_URL_APP" \
  DATABASE_URL_TEST_SEED="$DATABASE_URL_OWNER" \
  JWT_SECRET="$JWT_SECRET" \
    pnpm --filter @taller-saas/api test:e2e
  ok "API E2E tests green"
}

# ---------------------------------------------------------------------
# 7. Web tests
# ---------------------------------------------------------------------
test_web() {
  step "Web tests"
  pnpm --filter @taller-saas/web test
  ok "Web tests green"
}

# ---------------------------------------------------------------------
# 8. Final build (parity with CI's last step)
# ---------------------------------------------------------------------
final_build() {
  step "Build all packages"
  pnpm build
  ok "build green"
}

# ---------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------
ensure_services
recreate_test_db
install_deps
run_lint
build_shared
prisma_setup
test_api_unit

if [[ "$MODE" == "full" ]]; then
  test_api_e2e
  test_web
  final_build
else
  warn "Fast mode: skipping E2E, web tests, and final build."
  warn "Run without --fast before merging."
fi

elapsed=$(( $(date +%s) - start_time ))
printf "\n${C_BOLD}${C_GREEN}✅ Local CI passed in %dm%ds${C_RESET}\n" $((elapsed / 60)) $((elapsed % 60))
