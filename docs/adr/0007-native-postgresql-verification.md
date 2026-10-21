# ADR 0007: native PostgreSQL verification

Date: 20 October 2026. Status: native harness implemented; verification record below owns executed results. Requirements: F-10/F-16/F-18 and NFR-07/08/09. Product/research owner: the user; developer: Codex. Independent review remains open.

## Context and decision

Docker was unavailable and disk constrained. The user installed PostgreSQL and authorized proceeding with the pending local database verification. Installed tools are PostgreSQL **18.6**, not the proposed PostgreSQL 17 baseline. Support native PostgreSQL 17/18 binaries for the isolated lab, report the actual version used and retain Docker as an explicit optional mode. This does not change the production database/provider decision or prove PostgreSQL 17/pgvector compatibility.

`pnpm database:check` now uses [the native runner](../../scripts/check-database-native.mjs). `pnpm database:check --docker` retains [the previous Docker runner](../../scripts/check-database-docker.mjs). Both use the existing synthetic SQL assertions. There is no application database connection, production schema or migration-tool selection in this change.

Alternative: connect to the installer's running service and create test roles/databases there. Rejected because that would require its credentials and touch an existing cluster. Alternative: require Docker despite installation. Rejected because PostgreSQL tools can execute the required server semantics directly without container/VM disk overhead. Native initialization still needs free disk space; the runner refuses below 256 MiB and recommends at least 500 MiB.

## Native isolation and lifecycle

1. Discover matching `initdb`, `postgres`, `pg_ctl`, `psql` and `pg_dump` from PATH or the standard Windows PostgreSQL 17/18 install directories. `JOINNR_PG_BIN` can specify an absolute binary directory. All tools must report the same supported version.
2. Reject arbitrary connection arguments and inherited PostgreSQL connection/data or Docker host/context overrides. Strip libpq environment settings from child processes; never read the product `.env` or request installed-service credentials.
3. Create a unique ignored `.local/postgres-lab-*` directory; reject a scratch root that redirects outside the workspace. Initialize with a generated random bootstrap password and SCRAM authentication. Remove the temporary password file after initialization; never print the password or pass it as a command-line argument.
4. Bind only `127.0.0.1` on an OS-selected port. A port race fails startup/authentication; it cannot authorize access to an existing service. Authenticate and compare the server's actual data directory to the unique created directory before any test database mutation.
5. Create only the two fixed synthetic test databases inside that new cluster. Execute isolation assertions, take an in-memory pg_dump snapshot, restore it into the second database and replay the synthetic post-snapshot deletion marker twice.
6. Stop the exact cluster using its data directory, confirm shutdown and remove only the validated unique scratch directory. Preserve failures and cleanup errors. If shutdown cannot be confirmed, retain the directory instead of deleting potentially live files.

No host service is registered, stopped, reconfigured or reused. No existing database is modified. Loopback transport uses a per-run password without TLS; this does not relax production TLS requirements. Runtime lab permissions still use SET ROLE from the privileged test connection, as described in [ADR 0005](0005-local-technical-verification.md); it is not a real application pool or credential separation test.

Native resource settings reduce the synthetic cluster footprint: 1 MiB WAL segments, 16 MiB shared buffers, ten connections and bounded WAL settings. Durability is not disabled. These are lab settings, not production sizing or performance recommendations. Windows background startup uses ignored pg_ctl pipes plus a dedicated server log to avoid waiting on inherited daemon handles.

## Acceptance and remaining boundary

The lab must demonstrate real role/RLS and composite-FK behavior, cross-event read/write denial, active membership revocation, transaction-local context reset after commit/rollback/aborted transaction, actual logical dump/restore, and repeated deletion replay preserving unrelated data. SQL statements remain synthetic and test-only. Refusal regressions also cover PostgreSQL host/service/options/password/data overrides and relative binary paths; they never count as SQL passes.

A pass closes execution of this local feasibility lab only. Production migrations/ledger, real pool context hooks, cross-session races, outbox delivery/dedupe, pgvector/model operations, multi-store erasure, independent review, recovery targets and real staging remain separate gates. The nine-operation OpenAPI coverage is unchanged. No provider/account/region/spend or phase-exit approval follows.

Rollback restores the Docker-only command and removes native tooling/tests/documentation additions. No schema rollback is required because test clusters are disposable and application data is untouched.

Primary references checked 20 October 2026: [PostgreSQL 18 initdb](https://www.postgresql.org/docs/18/app-initdb.html), [pg_ctl](https://www.postgresql.org/docs/18/app-pg-ctl.html) and [pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html).

## Verification — 20 October 2026

- Detected matching installed `psql`, `initdb`, `pg_ctl`, `postgres` and `pg_dump` tools at version 18.6. The user freed disk space after installation; the test proceeded with approximately 1.7 GB available.
- Initial native attempt failed at pg_ctl startup and cleaned up its temporary cluster. After adjusting Windows daemon output-pipe handling, `pnpm database:check` exited 0: role/RLS/cross-event/FK and commit/rollback/aborted-transaction context assertions passed; actual pg_dump/restore and post-snapshot deletion replay/idempotency assertions passed.
- The runner confirmed shutdown and removed its unique scratch directory. A separate directory inspection reported zero remaining `postgres-lab-*` directories. `.local` ignore behavior was verified; no password, snapshot, database data or log was added to source control.
- `pnpm check` exited 0: repository checks (104 files/eight manifests), formatting, lint, 39 API/outbox tests, four prototype tests, five preflight refusal tests, 14 domain tests, shared builds and all seven workspace typechecks passed (62 automated source/library tests, separately from the real SQL lab).
- Not verified: PostgreSQL 17, pgvector, Docker mode, real application pool/credential separation, cross-session races, production migration/restore, multi-store erasure or provider integrations. Existing dependency advisories and independent review remain open. No dependency/lockfile or application runtime behavior changed.
