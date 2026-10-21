# ADR 0005: isolated local technical verification

Date: 20 October 2026. Status: local verification tooling implemented; SQL execution and independent review pending. Requirements: F-10/F-16/F-18, NFR-07/08/09. Product/research owner: the user; developer: Codex. No independent reviewer is assigned.

## Decision and boundaries

The user explicitly requested completing local technical work while keeping external integrations deferred on 20 October 2026. Implement a disposable PostgreSQL feasibility harness, minimal outbox wire schema and shared resource-version parser. Retain all earlier privacy, provider, funding and release gates. This changes verification tooling and pure shared code, not the application architecture or product scope.

Do not select a production migration tool or claim RLS/restore evidence from an unexecuted spike. The SQL-first approach is a candidate demonstrated by inspectable SQL, not a ratified migration strategy. The application still has no database connection, business route, queue consumer, identity integration or production migrations.

Alternative: reuse the ordinary local application database. Rejected to avoid touching its data/volume or relying on arbitrary connection strings. Alternative: mock database authorization and mark the exit passed. Rejected because mocks cannot prove PostgreSQL policy, role or restore behavior. Alternative: provision staging now. Deferred explicitly by the user; budget and approved accounts remain absent.

## Implemented artifacts

| Artifact                                                             | What it establishes when run                                                                                                                                                        | Limits                                                                                                                                           |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Disposable Compose definition](../../infra/local/compose.test.yaml) | Digest-pinned PostgreSQL/pgvector image, internal network, no host ports, tmpfs data and per-run random password                                                                    | Requires Docker/Compose and sufficient free disk/RAM; no cloud equivalence                                                                       |
| [Database runner](../../scripts/check-database.mjs)                  | Rejects remote context overrides, accepts only local socket/pipe contexts, creates a random project and cleans up that exact project                                                | No arbitrary URL, SQL file or production database accepted; interrupted processes may require exact-project cleanup                              |
| [Isolation assertions](../../tests/sql/isolation.sql)                | Non-owner/non-superuser/NOBYPASSRLS runtime, forced RLS, active membership lookup, cross-event read/write denial, composite FK, commit/rollback context reset on one reused session | Synthetic two-table lab; not a full tenant schema, migration ledger, actual connection-pool adapter, SQL-injection boundary or concurrency suite |
| [Restore assertions](../../tests/sql/restore.sql)                    | Actual pg_dump into a distinct disposable database, snapshot completeness and replay of an independently supplied synthetic post-snapshot deletion marker                           | No object/vector/IdP/queue stores, backup encryption, real deletion-ledger service, RPO/RTO or production restore evidence                       |
| [Outbox schema](../../packages/contracts/outbox.schema.json)         | Versioned closed envelope, nine blueprint event types, aggregate/type/scope matching, private-payload rejection                                                                     | No producer, consumer, queue, retry/dedupe or delivery guarantee                                                                                 |
| [Version parser](../../packages/domain/src/resource-version.ts)      | Distinguishes missing/malformed/valid single strong quoted versions, rejects unsafe integers without coercion                                                                       | Does not read current row versions, authorize a caller, enforce HTTP status or implement If-None-Match singleton creation                        |

The isolated runner does not use the repository's ordinary database `.env`, publish ports or mount a persistent data volume. Test IDs and records are synthetic. Snapshots remain in process memory and are never printed or committed. Do not use this runner for real attendee data.

The test runtime role is NOLOGIN and reached through a privileged test connection's SET ROLE, modelling permission evaluation rather than credential separation. Its context settings are supplied by the synthetic trusted harness. Production must bind context to a validated actor inside a transaction; exposing arbitrary settings or SQL to a caller defeats that boundary. No context value by itself proves authentication. The reused SQL session exercises reset semantics, not a real driver's pool-return hooks. Those hooks require later integration tests.

## Outbox reconciliation

[Document 05](../05-api.md#6-transaction-and-event-contracts) lists minimal outbox facts. The new JSON Schema makes their envelope explicit: `id` identifies the domain message for consumer dedupe, `event_id` identifies conference scope (nullable for account-level erasure/consent), and `aggregate_id`/`aggregate_version` identify source ordering. Contact revocation refers to a contact grant aggregate, never a contact value. Actor pseudonyms are bounded opaque strings; syntax cannot prove deidentification. User erasure facts may use a restricted internal aggregate reference for purge execution; do not export that reference to product analytics.

No free-form `payload`, introduction, bio, contact or assessment answer is allowed. Consumers must reload authorized current state, check aggregate version and deletion status, and deduplicate `(consumer_name, id)` transactionally. Late facts do not restore consent or authorization. Event publish/cancel producers must additionally ensure their event and aggregate IDs agree; UUID syntax cannot enforce relationships. Storage and retention remain subject to D-05.

The schema is a separate machine-readable worker contract, not another public API operation. The seven OpenAPI operations and their generated types remain unchanged. `pnpm contracts:check` now also runs the outbox tests. No SDK/dependency was added.

## Execution and rollback

`pnpm database:check` attempts the disposable lab and fails explicitly when Docker/local context is unavailable. It is intentionally separate from `pnpm check`, since framework work does not require Docker; a passing default check must never be reported as a database pass. After installing/starting Docker with Compose v2 and freeing enough space for the image, run it again and review the results before advancing persistence.

`pnpm domain:check` includes the version parser tests and schedule tests. `pnpm contracts:check` includes public API and outbox schema checks. `pnpm check` includes both plus formatting, lint, repository checks and workspace typechecks.

Rollback removes these new files/exports/scripts/tests without touching ordinary local data. Normal cleanup uses Compose down for the exact random `joinnr-lab-*` project; no existing application volume is removed. No cloud rollback exists because no deployment occurred.

Primary references checked 20 October 2026: [PostgreSQL 17 row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html), [psql error handling](https://www.postgresql.org/docs/17/app-psql.html) and [pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html). These describe tool behavior, not proof that this unexecuted lab passes.

## Verification record — 20 October 2026

- `pnpm check`: passed repository checks (97 files, eight manifests), formatting, lint, 32 API/outbox contract tests, four prototype tests, 11 domain tests and all seven workspace typechecks.
- `pnpm database:check`: exited 1 with an explicit Docker-unavailable message. No SQL/RLS/restore assertion executed. No container or database was created.
- `pnpm audit --json`: exited 1; unchanged two high and one moderate finding. No advisory suppressed, dependency changed or release approval claimed.
- Low disk interrupted the first patch. After removing only regenerable Next.js build output, the interrupted SQL file was completed and source checks passed. A new web/native build was not run; database image acquisition requires considerably more free space.
- External/staging, native devices, performance/concurrency and real recovery remain deferred or unverified. No migration runner selection, integration pass or Phase 4 completion is claimed.
