# Phase four: local work and deferred exit evidence

Update, 21 October 2026: [technical completion review](technical-completion-review.md) records ten operation contracts, explicit 10-of-88 blueprint coverage (including BFF), UUID remediation reducing audit findings to two high/zero moderate, provider/model desk comparison and the remaining schema/staging evidence. The user nominated Semester integrated Technologies for independent review, retained external deferral and will supply policy decisions separately. Review nomination is not completed approval. Low disk space still prevents new database/full-build evidence; acknowledgement of a cleanup request does not establish available space.

Updated 20 October 2026. The user requested local technical work and explicitly deferred external integrations. No budget is assigned. This is a disposition of work scope, not a waiver of the roadmap's phase-exit criteria. See [technical planning](technical-planning.md) and [ADR 0005](adr/0005-local-technical-verification.md).

## Work disposition

Latest local milestone: [ADR 0008](adr/0008-migrations-and-pool-transactions.md) selects SQL-first tooling for the local foundation and verifies migration replay/rollback/locking, restricted-login pool reuse and observed last-seat/crossed-request/stale-version contention on PostgreSQL 18.6. The server transaction helper is implemented but unwired. Nine operation contracts remain; independent approval, policy gates and full product integration remain open.

| Package                     | Local implementation / prepared review                                                                                           | Remaining evidence and next action                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TP-01 schedule foundation   | Pure schedule/window rules and tests; resource-version parser now closes the safe-integer header gap                             | Independent review; future API adapter and trusted transaction clock integration                                                                             |
| TP-02 identity/region/cost  | Spike acceptance and architecture documented                                                                                     | External integration deferred by user; approved region/account/terms/privacy inputs, real BFF/native/MFA/device tests and cost review still required         |
| TP-03 persistence/isolation | SQL-first migration runner selected locally; restricted-login pool reuse and three contention fixtures passed on PostgreSQL 18.6 | Production adoption/schema, immutable artifact review, full product races, PostgreSQL 17/pgvector and independent review remain open                         |
| TP-04 API/worker contracts  | Nine OpenAPI operations, generated types, closed nine-type outbox schema and selection/rejection tests                           | Full MVP OpenAPI coverage remains open; style/contact/privacy/analytics contracts depend on pending policy decisions; no runtime enforcement                 |
| TP-05 semantic evaluation   | Provider-spike criteria documented; no model chosen, vectors generated or quality score claimed                                  | External integration deferred; deterministic baseline and consented/labeled evaluation, provider/model/version/dimension/terms needed before model selection |
| TP-06 delivery/recovery     | Transaction/outbox design, restore plan and isolated synthetic restore harness prepared                                          | External infrastructure deferred; real artifact promotion, observability, rollback and measured multi-store recovery remain unverified                       |
| EX-00-S01 security gate     | Audit rechecked after pinned pg/node-pg-migrate/types installation and lockfile update; no additional reported advisory          | Still two high/one moderate; compatible remediation and build evidence required                                                                              |

## Inputs that cannot be supplied by code

- Product owner: resolve D-03/04/05/11/14/16 with the prepared [policy alternatives](phase-1-3-review.md). No research or policy signature is invented.
- Privacy/design reviewers: ownership and actual reviews remain unassigned; local synthetic work supplies no legal/processing approval.
- Sponsor/product: D-02 capacity remains a proposed load envelope, D-06 budget remains unassigned, and D-08 real pilot confirmations remain missing. Codex development support does not establish on-call staffing or independent review.
- Provider/device/recovery decisions D-09/10/13/15: deferred with external integration. Resume with non-secret account/region/device/support inputs and an approved spend limit; do not put credentials in the repository.

No provider, model, region, budget, production migration runner, store identity, delivery date or measured recovery target is approved by deferral. A local prototype can be reviewed with synthetic data while these remain open; it is not a substitute for release evidence.

## Immediate executable sequence

1. Run the existing `pnpm check` for local source/schema/library validation.
2. Use `pnpm database:check` to reproduce the native PostgreSQL lab evidence; Docker is optional. Maintain sufficient free disk space. The lab targets only its own disposable cluster/databases.
3. Review the nine API operations, outbox envelope, transaction helper and SQL-first tooling decision. The local spike is verified; production schema, role/artifact rollout and independent approval remain separate work.
4. Resolve policy questions before dependent contract expansion. Retain full-MVP coverage as an open task instead of calling the nine-operation subset complete.
5. Resume real provider/model/device/staging spikes only when their external deferral is lifted and approved inputs exist.

Phase four remains open. The next runtime slice still requires full contract reconciliation and persistence/provider gates; no automatic progression to Phase 5 is recorded.

## Current verification

Current extended database run passed migration bootstrap/replay, failed-DDL/ledger rollback, advisory-lock exclusion, restricted LOGIN pool-size-one reuse/cleanup, backend termination/disposal, live authorization denials and observed physical contention for last-seat/outbox, crossed pending requests and stale versions. See [ADR 0008](adr/0008-migrations-and-pool-transactions.md#executed-evidence--20-october-2026). The helper has no route/auth wiring and fixtures are not product feature implementations.

The native PostgreSQL 18.6 lab now passes real SQL/RLS/context/foreign-key and logical restore/deletion-replay assertions; cleanup confirmed its temporary cluster was stopped and removed. `pnpm check` also passed 62 source/library tests and all seven workspace typechecks. Historical Docker-blocked attempts below remain history, not current blockers. See [ADR 0007](adr/0007-native-postgresql-verification.md#verification--20-october-2026) for current evidence and limitations.

Latest milestone check: `pnpm check` passed 39 contract tests, 14 domain tests, three database-preflight refusal tests, four prototype tests and all seven workspace typechecks. See [ADR 0006](adr/0006-profile-contract-and-lab-review.md#verification--20-october-2026). The database retry still exited 1 because Docker was unavailable; the user is preparing Docker and disk space. No SQL/RLS/restore pass is claimed.

On 20 October 2026, `pnpm check` passed 32 API/outbox, four prototype and 11 domain tests plus formatting/lint/repository/type checks. `pnpm database:check` failed explicitly because Docker is unavailable; none of its SQL assertions ran. Dependency audit still fails with two high/one moderate finding. See [the full record](adr/0005-local-technical-verification.md#verification-record--20-october-2026). Free additional disk space before database image acquisition or another full application build.
