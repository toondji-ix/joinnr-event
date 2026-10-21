# Workspace setup

Updated 16 October 2026. Scaffold only: no business features, authentication, cloud integration, application tables or queue processing. The two setup-only messages prove framework entry points; they are not product designs.

## Prerequisites and version baseline

- Node 22: recommended/pinned development and CI patch **22.23.3** (`.nvmrc`, `.node-version`). Compatibility floor is 22.13.0; the inspected machine runs 22.13.0. Upgrade the local runtime using your normal version manager before production work.
- pnpm **12.11.2**, pinned in `packageManager` and engines. Use one package manager and the shared `pnpm-lock.yaml`; do not add npm/yarn lockfiles.
- Git for version control. The scaffold initializes a local repository on `main`; no commit or remote is created. Configure the remote and branch protections when repository hosting is chosen.
- Native PostgreSQL 17/18 tools for the disposable database lab, or optional Docker Engine/Desktop with Compose v2. PostgreSQL 18.6 is installed and verified locally; Docker remains unverified. The ordinary application Compose configuration is separate from the disposable native lab.

On Windows use `npm.cmd` if PowerShell's execution policy blocks `npm.ps1`; do not weaken the machine execution policy. pnpm's `.cmd` launcher is available on the inspected machine.

## Setup sequence

From the repository root:

```sh
pnpm doctor
pnpm install --frozen-lockfile --ignore-scripts
pnpm setup:local
pnpm check
pnpm build
```

Package lifecycle scripts are disabled in workspace policy and explicitly at installation. A dependency that genuinely needs one must be reviewed and narrowly allowed in a future PR; never enable all scripts merely to silence an install warning. Installing downloads substantial framework/native tooling; ensure at least 3 GB free before installation/build and allow additional space for Docker images. pnpm uses its normal per-user content-addressable store; the lockfile lives only at the workspace root.

Release-age exceptions cover exact Expo versions resolved for this scaffold; strict mode prevents silently extending them on updates. These exceptions do not assert a security audit. React Hooks/JSX accessibility lint plugins require compatible supported versions before UI feature work; manual accessibility testing remains independently required.

`setup:local` creates `.env` once with a cryptographically random local password and never prints it; reruns preserve the existing file. `.env.example` contains only local nonsecret names/defaults, no fake cloud credentials. No API key or cloud account is required. Do not put secrets in `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variables.

## Workspace map

| Path                           | Purpose / current state                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `apps/web`                     | Next.js App Router shell; setup-only page, no UI flows or BFF auth                              |
| `apps/mobile`                  | Expo/React Native shell, no router/permissions/native project identifiers or product screens    |
| `apps/api`                     | NestJS server bound to 127.0.0.1:4000; no registered controllers, 404 is expected               |
| `apps/worker`                  | Standalone Nest context; initializes and closes; no listener or consumers                       |
| `packages/domain`              | Reserved pure domain package; intentionally no business exports                                 |
| `packages/contracts`           | Generated client-safe types for three foundation operations; full API coverage remains deferred |
| `packages/tokens`              | Reserved token package; no invented unapproved design system                                    |
| `scripts`                      | Doctor, local environment setup, API dev runner and repository checks                           |
| `infra/local` / `compose.yaml` | Loopback-only PostgreSQL/pgvector, extension bootstrap only                                     |
| `tests`                        | Test strategy; no fake product tests                                                            |

Shared packages are compiled before application commands. They expose compiled JavaScript and declarations, not application internals. No cloud SDK, AI SDK, ORM, test-runner dependency or remote service is installed just for a future possibility. [ADR 0001](adr/0001-workspace-foundation.md) records the trade-offs.

## Commands

| Command                                         | Behavior                                                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm doctor`                                   | Check runtime/package-manager tools; missing Docker is reported as optional for framework work             |
| `pnpm check:repo`                               | Local document links, private/exact-pinned manifests, workspace count and basic import-boundary guardrails |
| `pnpm format` / `pnpm format:check`             | Apply / verify Prettier formatting                                                                         |
| `pnpm lint`                                     | ESLint 10 with TypeScript and Next standalone framework rules, zero warnings                               |
| `pnpm typecheck`                                | Compile shared packages, then typecheck seven workspaces                                                   |
| `pnpm check`                                    | Repository checks + formatting + lint + typecheck                                                          |
| `pnpm build`                                    | Compile shared/backend packages, Next production build, Android and iOS JavaScript exports                 |
| `pnpm dev:web`                                  | Web dev server on 127.0.0.1:3000                                                                           |
| `pnpm dev:api`                                  | Initial TypeScript build, compiler watch and Node output watch on 127.0.0.1:4000                           |
| `pnpm dev:mobile`                               | Localhost Metro; use emulator or USB forwarding; no tunnel/public exposure by default                      |
| `pnpm check:worker`                             | Compile and initialize/close worker shell                                                                  |
| `pnpm setup:local`                              | Generate ignored local-only .env without overwriting existing settings                                     |
| `pnpm infra:up` / `infra:status` / `infra:down` | Start/check/stop local database; stop preserves volume                                                     |

Run long-lived servers in separate terminals. API source changes are compiled and restart the output watcher; compilation errors remain visible, and the last successful local build may remain running until corrected. Stop with Ctrl+C. There is intentionally no `test` success script while no product tests exist.

Mobile `build` exports JavaScript/assets for both platforms; it does **not** compile/sign/install an IPA/APK, prove native startup or submit to stores. Native build identifiers, app/universal links, EAS configuration/signing and device testing belong to D-13/EX-06. iOS native compilation requires macOS/Xcode or an authorized build service. No development bundle should be published as a finished app.

## Local database

After installing and starting Docker:

```sh
pnpm setup:local
pnpm infra:up
pnpm infra:status
```

Compose pins the pgvector `pg17` manifest by digest, binds only to 127.0.0.1:5432 by default, persists data in `postgres-data`, checks `pg_isready` and enables `vector` on first initialization. Override `POSTGRES_PORT` locally if necessary. Existing volumes do not rerun initialization scripts or adopt changed bootstrap passwords automatically. No reset/delete-volume command is provided. Check disk space before pulling the image. The local bootstrap account is not a production runtime identity; no application is wired to it yet.

## Hosted CI and repository management

The scaffold CI is configured to check Windows/Linux and build all framework projects; it has not run on GitHub and does not deploy or claim feature/security certification. GitHub Actions activate after the local repository is pushed. Dependabot configuration and a PR template are included. Assign actual owners before adding CODEOWNERS; configure protected main/required checks and secrets access through repository settings. No identity, repo URL or team slug is fabricated.

## Contract foundation commands

`pnpm contracts:generate` lints the three-operation OpenAPI specification and regenerates shared types. `pnpm contracts:check` validates the spec, rejects stale generated output and runs schema/example/negative-case tests. Root `pnpm check` includes this gate. These are development-only checks; there is no runtime request validation or implemented route yet. See [ADR 0002](adr/0002-contract-foundation.md).

## Dependency security status

`pnpm run audit:dependencies` currently fails with two high and one moderate transitive advisory. [The audit record](dependency-risk.md) gives exact paths, sources and EX-00-S01 remediation criteria. No advisories are suppressed. CI is configured to fail this separate gate until remediation.

## Verification record

Verified locally on Windows with Node 22.13.0 and pnpm 12.11.2:

- Frozen offline install with lifecycle scripts disabled: passed.
- Dependency peer check: passed, no peer issues.
- Repository link/manifest/boundary checks, formatting, lint and seven-workspace typecheck: passed.
- Shared-package builds, API/worker compilation and Next production build: passed.
- Expo Android and iOS JavaScript/Hermes exports: passed; these are not signed native builds.
- Local smoke checks: API boot + absent business route returns 404; production web setup page returns 200; child servers stopped afterward.
- Worker initializes and closes successfully without consumers or jobs.
- Local .env generated without printing values; git check-ignore confirms it is excluded. No cloud credentials created.
- Dependency audit: failed as documented (2 high, 1 moderate); no suppressions or forced incompatible overrides.

Not verified: Docker/Compose runtime (Docker unavailable), native device/IPA/APK builds, development hot-reload behavior, Linux execution, GitHub-hosted CI, authentication/provider/cloud flows or any product acceptance tests. CI targets Node 22.23.3; that newer runtime was not installed or tested locally. The audit gate deliberately prevents a fully green pipeline until EX-00-S01 is resolved.

## Primary technical references

### Isolated database feasibility check

The extended `pnpm database:check` first builds shared/API packages, then runs the native SQL lab plus [migration and pg-driver pool/concurrency assertions](adr/0008-migrations-and-pool-transactions.md). Pinned local tooling: pg 8.23.1, node-pg-migrate 9.0.0 and @types/pg 8.23.1. It uses a third disposable database for SQL test migrations and restricted LOGIN credentials; no installed-service data or application database is used. Replay, advisory lock exclusion, failed DDL/ledger rollback, same-backend context cleanup, broken-connection disposal and three physical contention cases passed on PostgreSQL 18.6. The helper is not wired into API routes. The optional Docker mode still exercises only the earlier SQL assertions.

`pnpm database:preflight:check` runs refusal tests for arbitrary connection arguments, Docker host/context and PostgreSQL connection/data overrides, and relative binary paths. It is included in `pnpm check`; it creates no server/container and is not an SQL/RLS test.

`pnpm database:check` defaults to a disposable native cluster with a random loopback port/password under ignored `.local/postgres-lab-*`. It discovers matching PostgreSQL 17/18 tools on PATH or in standard Windows install directories; set `JOINNR_PG_BIN` to an absolute bin directory if needed. It never uses the installed service or asks for its credentials. Allow at least 500 MiB free; below 256 MiB it refuses initialization. The lab stops/removes its own cluster after execution and accepts no production connection URL. PostgreSQL 18.6 isolation, failed-transaction context, logical dump/restore and repeated deletion-replay assertions passed locally. See [ADR 0007](adr/0007-native-postgresql-verification.md). This check is separate from `pnpm check` and does not select a production migration tool or prove pgvector/production recovery.

`pnpm database:check --docker` retains the optional [test Compose lab](../infra/local/compose.test.yaml), with an internal network and tmpfs data. This mode still requires Docker/Compose and is unverified here. It is separate from `pnpm infra:up`, which manages the ordinary local database volume.

On 20 October, disk exhaustion interrupted tooling. Only regenerable `apps/web/.next` build output was removed to restore working space; source files were preserved. Regenerate that output with `pnpm build` when needed and after freeing sufficient space. No new web build is claimed.

Verified 16 October 2026: [Expo monorepos](https://docs.expo.dev/guides/monorepos/), [Next installation](https://nextjs.org/docs/app/getting-started/installation), [Nest standalone contexts](https://docs.nestjs.com/application-context). Exact package metadata was read from the npm registry; React 19.3.0/React Native 0.88.0 follow [Expo 58.0.13's published matrix](https://unpkg.com/expo@58.0.13/bundledNativeModules.json). TypeScript 5.9.3 is deliberately below latest: the selected typescript-eslint supports TypeScript <6.1.0. Node patch was checked against [official Node 22 release checksums](https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt); local DB manifest and action commits were resolved from official registries. Reverify pins when updating, with frozen install/build evidence.

## Phase-four domain checks

`pnpm domain:check` builds the client-safe domain package and runs injected-time event schedule/window tests, including compatibility with current OpenAPI event examples. Root `pnpm check` includes this check. The library has no I/O or implicit clock and is not wired to API routes. See [technical planning](technical-planning.md) and [ADR 0003](adr/0003-event-schedule-foundation.md); these tests are not database isolation, real provider or product acceptance evidence.
