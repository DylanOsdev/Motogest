# Local CI replica

This project runs its CI locally via `pnpm ci:local`. The script in `scripts/ci-local.sh` mirrors `.github/workflows/ci.yml` exactly, so a green local run is equivalent to a green GitHub Actions run.

## Why local CI

GitHub Actions is currently blocked on the maintainer's account (billing constraint outside our control). Without it, chained PRs and feature branches receive no automated validation. The local replica fills that gap.

When Actions becomes available again, the local script remains useful as fast pre-merge validation — it catches issues before pushing without waiting on a remote runner.

## Quick start

```bash
# First time only (sets core.hooksPath = .githooks automatically)
pnpm install

# Run the full pipeline before merging a PR
pnpm ci:local

# Fast subset (lint + unit + build only) — the same checks pre-push runs
pnpm ci:local:fast
```

## What runs

| Stage | Full | Fast | Equivalent CI step |
|-------|:----:|:----:|--------------------|
| `docker compose up postgres redis` | ✅ | ✅ | service containers |
| Recreate test database | ✅ | ✅ | (CI starts fresh each run) |
| `pnpm install --frozen-lockfile` | ✅ | ✅ | install |
| `pnpm lint` | ✅ | ✅ | lint |
| Build `@taller-saas/shared` | ✅ | ✅ | build shared |
| Prisma generate + migrate deploy | ✅ | ✅ | prisma steps |
| API unit tests | ✅ | ✅ | test API |
| API E2E tests (RLS via `taller_app`) | ✅ | ❌ | test E2E |
| Web tests | ✅ | ❌ | test Web |
| `pnpm build` (final) | ✅ | ❌ | build |

The fast path takes ~1–2 minutes and is what `git push` runs as a pre-push hook. The full path takes ~5–10 minutes and must be run manually before merging.

## Hooks

The repository ships hooks under `.githooks/` and points Git at them via `core.hooksPath`. The `prepare` script in the root `package.json` configures this automatically when you run `pnpm install`.

| Hook | What it runs |
|------|--------------|
| `pre-commit` | Gentleman Guardian Angel (`gga run`) if installed; otherwise no-op |
| `pre-push` | `pnpm ci:local:fast` (lint + unit + build) |

To bypass either hook in an emergency:

```bash
git commit --no-verify   # skip pre-commit (GGA review)
git push --no-verify     # skip pre-push (fast checks)
```

If you bypass, document the reason in the PR. The hooks exist to catch regressions before they spread.

## Environment variables

The script supplies these env vars to match `ci.yml` exactly:

- `DATABASE_URL` — `postgresql://taller:taller_dev@localhost:5432/taller_saas_test` (owner role for migrations + unit tests)
- `DATABASE_URL_TEST` — `postgresql://taller_app:taller_app_dev@localhost:5432/taller_saas_test?schema=public` (E2E uses the `taller_app` role with `NOSUPERUSER NOBYPASSRLS` to enforce RLS)
- `DATABASE_URL_TEST_SEED` — owner role, used by E2E test setup to seed without RLS
- `REDIS_URL` — `redis://localhost:6379`
- `JWT_SECRET` — `test-secret`

## Troubleshooting

**Services do not become healthy in 30s**
```
docker compose ps
docker compose logs postgres
```
Check ports 5432 and 6379 are not occupied by another service.

**E2E fails with `password authentication failed for user "taller_app"`**
The `taller_app` role is created by the `20260517052700_enable_rls` migration. Ensure migrations have been applied to `taller_saas_test`. The script does this automatically, but if you ran it once, then dropped and recreated the database manually outside the script, the role is gone.

**`pnpm install` rewrites the lockfile**
The script uses `--frozen-lockfile`. If your local lockfile is out of sync, the script aborts. Run `pnpm install` once without the flag, commit the lockfile, then retry.

**Hooks do not run after cloning**
Run `pnpm install` once. The `prepare` script wires `core.hooksPath = .githooks`. Verify with `git config --get core.hooksPath`.

## Relationship to GitHub Actions

The local script does NOT replace GitHub Actions — it complements it. When Actions is unblocked:

- Push runs trigger `ci.yml` on `main`, `develop`, and feature-branch PRs (per the trigger expansion in PR #13).
- Local `pnpm ci:local` remains useful as a fast pre-push gate.
- The workflows stay in lockstep — any change to `ci.yml` should also update `scripts/ci-local.sh`.

Treat the two as a single unit. If you change one, change the other.
