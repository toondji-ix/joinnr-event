# ADR 0008: SQL-first migrations and pooled actor transactions

Date: 20 October 2026. Status: local migration/pool/concurrency verification passed on PostgreSQL 18.6; independent production review remains open. Developer: Codex; product/research owner: the user. Requirements: NFR-08/09, F-05/F-10 and optimistic version prerequisites.

## Decision before implementation

Use pinned node-pg-migrate 9.0.0 for reviewed SQL migrations and pg 8.23.1 for parameterized server transactions, with @types/pg 8.23.1. Keep one migration ledger per database. This spike uses synthetic migrations only; no product schema, runtime database configuration, API integration or real attendee data is authorized by it. Existing EX-02/G-01/G-03 gates and external integration deferral remain intact.

The existing Prisma recommendation is not an approval. Compare against the actual requirements: explicit SQL for RLS/composite keys, a single ledger, transactional DDL, migration locking, repeatable bootstrap and direct same-client transactions. A SQL-first runner allows these to be exercised on the existing native lab without a generated ORM model. Prisma is not benchmarked or installed in this spike; no capability/performance failure is claimed. Its default registry tag currently resolves to a release candidate requiring Node 22.18+, above this machine's 22.13.0. A supported stable Prisma comparison can be reopened if the team needs an ORM. No preview dependency or second ledger is installed.

Alternative: build a custom migration engine. Rejected in favor of a maintained pinned PostgreSQL runner. Alternative: use pg Pool.query across a transaction or a privileged runtime login. Rejected because transaction context belongs to a checked-out client, and runtime privileges must independently enforce isolation.

## Scope and required evidence

Implement an unwired server transaction helper using a checked-out client, explicit BEGIN/COMMIT/ROLLBACK, parameterized transaction-local actor/event settings, bounded database timeouts and cleanup before release. Context must come from a future validated authentication boundary, never raw headers; syntax validation does not authenticate it. Release a broken connection by destruction if rollback/context cleanup fails. No global actor context or automatic retry.

The isolated native lab will test SQL migrations, replay, failure rollback and advisory lock exclusion; restricted LOGIN credentials, pool-size-one backend reuse after commit/rollback/error, missing/cross-event denials and role restrictions; and real overlapping transactions for last-seat admission, crossed pending requests and stale versions. Fixture tables are deliberately synthetic, not an implementation of product services or all required races. Document untested accept/block, contact/revoke and erasure/job behavior explicitly.

## Implementation and trade-offs

- [Actor transaction helper](../../apps/api/src/database/actor-transaction.ts): server-only and not registered in Nest or called by routes. A future verified actor context is still mandatory. The helper clears session context before and after work, uses transaction-local settings and 5-second statement/2-second lock timeouts, and destroys connections after rollback/cleanup failure. Checked-out connection errors are observed so a backend loss cannot become an unhandled EventEmitter error or a successful mutation.
- [SQL lab migrations](../../tests/database/migrations/1760918400000_pool-boundary.sql) and [expansion](../../tests/database/migrations/1760918400001_expansion.sql): explicit owner/runtime separation, forced RLS, composite keys, column privileges, capacity constraints and a unique pending pair. The expansion adds a nullable column and index. These are test fixtures; no production schema is present.
- [Integration harness](../../scripts/database/verify-persistence.mjs): runs only after the native runner verifies its unique data directory. It creates a separate disposable test database, generates a runtime LOGIN password in memory, uses server-side format(%L) for the fixed role DDL and never prints credentials or SQL. The role is neither owner nor superuser and has no migration-ledger access.
- One `pool_meta.schema_migrations` ledger and a session advisory migration lock. Pending SQL runs in a single transaction; a deliberately failing DDL migration must leave neither its table nor ledger entry. Files are immutable after application. node-pg-migrate ordering is not content-checksum drift protection; a production artifact-integrity check remains required before rollout. No second migration ledger or fake/skip mode is exposed.
- Two physical runtime backends exercise lock contention. The test holds the first mutation open, asks PostgreSQL whether the second PID is blocked, then releases the first. It asserts one last-seat admission/outbox fact, one crossed pending pair with original sender and no auto-acceptance, and only one successful expected-version update. These are constraint/transaction fixtures, not implemented admission/request endpoints.
- A pool of size one proves identical backend PID reuse under different actor contexts after commit, callback rollback and SQL failure. A deliberate session-context contamination must be overwritten/cleared. Revoked membership denies the next read. Terminating only the disposable test backend must reject the transaction and force a different clean backend afterward.

Migration credentials are test bootstrap credentials only; production migration IAM/roles and deployment remain gated. No pgvector/model/version decision, retention policy, cloud account, spend, API shape or client flow changes. Full tenant schema, all product races, mobile compatibility and real staging are not established by this fixture.

## Reproduction and rollout boundary

`pnpm database:check` builds shared/API packages then executes the expanded native lab. The optional `--docker` mode still runs only the earlier SQL assertions; the new Node-driver tests are native-mode evidence only. `pnpm check` remains independent of database availability. Migration logging is suppressed at source; failures still reject and surface a safe phase/code. No product migration/deploy/down command is installed.

Production adoption needs independent review, immutable migration artifact verification, migration-role privileges, timestamp precision decisions, actual approved schema/erasure rules, backups and rollout/rollback evidence. Do not infer those approvals from a passing local spike. Reverting this milestone removes the unwired helper, tooling/fixtures and manifest pins; disposable databases are already removed by normal lab cleanup.

Primary sources checked 20 October 2026: [node-postgres transactions](https://node-postgres.com/features/transactions), [pool client release/destruction](https://node-postgres.com/apis/pool), [parameterized queries](https://node-postgres.com/features/queries), [node-pg-migrate v9.0.0](https://github.com/salsita/node-pg-migrate/tree/v9.0.0), and the locally installed v9 runner types/source. The general migration site currently shows a newer alpha; implementation uses only the pinned stable v9 API inspected locally.

## Executed evidence — 20 October 2026

- `pnpm install --ignore-scripts`: pinned driver/migration/type dependencies installed under existing strict peer/supply-chain policy. `pnpm install --frozen-lockfile --ignore-scripts --offline`: passed. One root lockfile remains.
- `pnpm database:check`: first attempt refused initialization with less than 256 MiB free. After space became available, exited 0 on native PostgreSQL 18.6. Existing isolation/restore assertions passed, then all migration, restricted-login pool and observed lock-contention phases passed.
- Migration assertions: two SQL migrations applied once, second run applied zero, held advisory lock rejected another runner, injected SQLSTATE 22012 rolled back new table and ledger entry, and a subsequent clean runner succeeded.
- Pool assertions: same backend PID reused after commit, callback rollback and SQL failure; no context-visible rows outside transactions; session contamination scrubbed; event/field/ledger access denied; live membership revocation denied; terminating the checked-out backend rejected the transaction and yielded a different clean backend.
- Concurrency assertions: PostgreSQL reported a second physical backend blocked by the first mutation. Last-seat race admitted exactly one with one outbox row; crossed sends returned one pending request with the original sender; competing version-2 edits produced row counts 1/0 and final version 3.
- Native cleanup stopped and removed the temporary cluster; the installed service/data were untouched. No migration, runtime LOGIN password or SQL data was applied outside the disposable lab.
- `pnpm check`: passed 62 existing API/outbox/domain/prototype/preflight tests, lint/format/repository checks (109 files/eight manifests), shared builds and all seven workspace typechecks. These 62 tests are separate from the new real database assertions.
- Dependency audit after installation: unchanged two high/one moderate/zero critical findings; exit 1. No new reported advisory, suppression or forced override. Existing EX-00-S01 remains open.

Not executed: stable Prisma comparison, production migration/checksum/role rollout, PostgreSQL 17/pgvector, real API-auth integration, accept/block, contact/revoke or erasure/in-flight-job races, mobile consumer tests and staging. Local tooling selection is evidenced; Phase 4 and production adoption are not closed.
