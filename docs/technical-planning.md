# Phase four — architecture and technical planning

Started 19 October 2026 under the request to proceed to the next product execution phase. This package advances independent technical work; it does not declare earlier phases complete. The [roadmap](07-delivery.md#6-mvp-delivery-roadmap-in-execution-order), [execution plan](execution-plan.md) and [decision register](08-decisions-and-sources.md) retain authority over scope and gates.

Implemented: pure event schedule rules, injected-time window assessment, contract-example compatibility tests and a repository check. Documented: [ADR 0003](adr/0003-event-schedule-foundation.md), module/transaction review, provider-spike acceptance, persistence/restore planning and review-sized tickets. No business route, SQL migration, vendor SDK, cloud resource or real integration is implemented by this package.

## Existing architecture and transaction boundaries

Update, 20 October 2026: [ADR 0004](adr/0004-request-lifecycle-contracts.md) implements four additional request-lifecycle operation contracts, generated types and schema regression tests. The contract source now covers seven operations. TP-04 is partially advanced; profile/contact/privacy contracts, policy decisions and independent review remain open. There are still no running business routes or database/provider integrations.

Retain the TypeScript modular monolith and worker described in [document 03](03-architecture.md). Web/native presentation stays separate; shared domain code contains no secrets, I/O or implicit actor/clock. API services own live authorization. One PostgreSQL record store and one migration ledger remain required. The standalone worker processes minimal outbox facts with at-least-once deduplication; model/email calls never occur inside a business mutation.

| Slice / requirements         | Transaction boundary and invariant                                                                                                                         | Next verification                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Organization/event / F-02–04 | Create organization + owner atomically; event belongs to authorized organization; publish validates schedule and version before credential creation/outbox | Cross-organization IDs, non-owner/planner, staff MFA/step-up, missing/stale versions; real SQL rollback       |
| Admission / F-05, F-18       | Validate current credential/intent and event window; lock event capacity, dedupe membership and increment count atomically only on admission               | Last seat, duplicate retry, approval race, cancelled event and rotated intent                                 |
| Profile/consent / F-06–09    | Self active membership only; update optimistic version and invalidate derived state in same transaction                                                    | Unknown/private field escalation, skipped style, withdrawal versus in-flight computation                      |
| Request/contact / F-10–13    | Canonical pair lock; accept creates one connection; bilateral field/version grants and live authorization+projection use compatible lock order             | Crossed requests, accept/block, revoke/read, leave/suspend/expiry and verified field replacement              |
| Privacy/analytics / F-14–16  | Immediate account disable precedes purge jobs; allowlisted facts only; approved aggregates never expose individual feedback/contact data                   | Erasure/in-flight job, restore tombstone replay, complementary suppression and staff revocation during export |

The time helper closes only the schedule-comparison gap. It must never be used as a grant or membership check. Stored published status cannot bypass an elapsed close. Cancellation, account disable and membership/consent changes must deny independently of time.

## Persistence implementation review plan

EX-04 product persistence remains gated by EX-02 reconciliation and G-01/G-03. [ADR 0008](adr/0008-migrations-and-pool-transactions.md) selects node-pg-migrate 9.0.0 with pg 8.23.1 for the local SQL-first foundation, backed by executed bootstrap/replay/locking/rollback and real pool/concurrency evidence. Prisma remains an unexecuted alternative, not a failed benchmark. Production adoption, immutable migration artifact checks, actual schema/privacy rules and independent review remain open; the local decision does not waive them.

Proposed first reviewed schema order: account identity binding → organizations/owner membership → events/assignments → admission membership → transactional outbox/deduplication. Use [document 04](04-data.md) for schema requirements; this is not executable DDL. Runtime roles must not own tables or have BYPASSRLS; migration credentials never enter application configuration. Deny by default, FORCE RLS where appropriate, separate worker purposes, transaction-local validated context and connection-pool reset tests are exit requirements. Composite event/resource keys prevent cross-event references even when IDs are otherwise valid.

The integration harness must create two synthetic tenants under a privileged setup identity, execute application queries under the restricted runtime identity, force reuse of a small pool, and test both commit and rollback/error paths. Assert missing context denies, event A context cannot read/write B, owner/BYPASSRLS privileges are absent, concurrent operations preserve constraints, and context does not survive pool return. Mocked repositories cannot satisfy this evidence.

Timestamp precision must be agreed before migrations: domain comparison preserves fractional order, whereas adapters/storage may have narrower precision. Record supported input precision and reject loss explicitly; update contracts/mobile compatibility before tightening accepted wire values. Do not silently truncate boundary instants. Store IANA event timezone separately; server date-window decisions use trusted transaction time.

## Provider spike acceptance and gate inputs

The user confirmed on 19 October 2026: keep AWS/Cognito proposed, with no provisioning. AWS/Cognito/RDS/Fargate/SES remain **proposals**, not selected accounts or regions. No credentials are requested or created for this package. Use only synthetic accounts in approved staging once the corresponding gate is resolved. Failed provider evidence must remain a failure, never a local successful fallback.

| Spike / dependency                          | Evidence to produce before choosing/enabling                                                                                                                                                                                   | Safe failure / unresolved state                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Hosted OIDC + BFF/native / G-01, G-03, D-13 | Actual issuer/client settings; PKCE/state/nonce and token-use checks; exact redirects/origins; staff MFA/step-up; BFF cookie+CSRF; native system-browser links, cancel/return, protected refresh storage and logout/revocation | No authenticated business routes until both clients pass; no custom credential store or browser token storage |
| Regional PostgreSQL/pgvector / G-03         | Approved region/terms, exact supported versions, migration spike, runtime role isolation, backup/restore and connection budget under agreed envelope                                                                           | No real attendee data; Docker/local harness availability is not hosted-service evidence                       |
| Embeddings / G-04                           | Approved provider/model/version/dimension/terms and payload; versioned labels/baseline/ablation; consent/withdrawal/deletion and timeout/quota evidence                                                                        | No vectors or claimed lift; taxonomy baseline first; style weight disabled pending evidence                   |
| Transactional email / G-03                  | Approved provider/sender, sandbox/recipient restrictions, real delivery, signed webhook handling, outbox retry/dedupe and bounce behavior                                                                                      | Queue with bounded retries/DLQ; no fabricated delivery or synchronous send                                    |
| Phone/contact / D-14                        | Explicit phone inclusion or email+work-URL scope decision; if included, real ownership challenge abuse/cost tests                                                                                                              | Never display simulated verification as real                                                                  |

## Infrastructure, cost and recovery review

Do not author/apply Terraform against guessed accounts or regions. Once G-02/G-03 close, prepare an actual plan for isolated environments, private DB, exact ingress/egress, TLS verification, encrypted restricted state, secret metadata and OIDC CI roles. Review minimum/max tasks, pool allocations and queue concurrency together. No CI static cloud key and no deploy authority follows from this plan.

Cost worksheet inputs required from sponsor/platform: approved monthly B, currency, region, idle/pilot/peak hours, task sizes/counts, DB/storage/backup configuration, NAT/egress, identity active users/tier, model tokens/refresh cap, emails, logs/retention and mobile build/store costs. Each estimate needs calculator/source date, usage assumptions and reviewer. Leave prices and B unfilled until real inputs exist; proposed envelope is not a forecast. Plan 50/80/100% budget alerts only after B is approved.

Restore review: quarantine restored DB/objects, block notification/provider egress, replay an authoritative deletion ledger and purge affected rows/vectors/objects/jobs before reopening traffic. Verify restored backup cannot resurrect erased identities or grants; invalidate stale sessions/intents and reconcile outbox dedupe before release. Measure data-loss interval and elapsed recovery using synthetic markers, record RPO/RTO against approved D-15, and identify the actual incident/release owner. No restore success or recovery region is claimed here.

## Concrete review-sized backlog

Each ticket needs an actual owner and independent reviewer before scheduling. The roles below are accountable functions, not assigned people. Estimates await assigned team and approved acceptance scope.

| Ticket                              | Scope / requirements / review roles                                                        | Gate and completion evidence                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| TP-01 — implemented, review pending | Schedule library/tests + ADR 0003 / F-03, F-04 time prerequisite / backend + QA            | Pure tests and current contract examples pass; no runtime integration claim                                        |
| TP-02 — blocked                     | Identity/region/cost spike / F-01, F-18, NFR-07 / architect + security/platform/privacy    | G-01–03, D-13/D-15 inputs; approved accounts, real web/native auth/return tests, terms and cost review             |
| TP-03 — design ready, gated         | Migration runner + role/context harness / NFR-08 isolation / backend + security            | EX-02 and G-01/G-03; real PostgreSQL tests described above; clean bootstrap and safe migration rollout review      |
| TP-04 — pending policies            | Expand lifecycle/profile/request/contact OpenAPI / F-06–13 / backend + product/privacy     | Resolve D-05/11/14 and UX details; explicit examples/errors, property denials, N-2 compatibility review            |
| TP-05 — blocked                     | Versioned semantic evaluation / F-09 / AI + privacy                                        | G-04, deterministic baseline, approved model and purge hooks; real evaluation instead of fabricated scores         |
| TP-06 — planned                     | Staging artifact/promotion and operational drill / NFR-03–10 / platform + release/security | Approved region/budget/owners; IaC plan, real apply only under authorization, telemetry, rollback/restore evidence |

No date, budget, actual reviewer or provider selection is invented. Continue pure contract/threat review while blocked slices wait. Phase-five runtime implementation remains dependent on these exits.

## Phase-four exit evidence

Latest persistence evidence: [ADR 0008](adr/0008-migrations-and-pool-transactions.md) passes migration ledger/rollback/locking, real restricted-credential pool reuse/cleanup and three observed contention fixtures. The server helper is unwired; full product schema, all required races and independent review remain open.

Current database evidence: [ADR 0007](adr/0007-native-postgresql-verification.md) records a successful native PostgreSQL 18.6 synthetic isolation/context/FK and logical restore/deletion-replay lab. Docker is optional. Full application migrations, pool/concurrency integration, pgvector/PostgreSQL 17 compatibility and independent review are still open.

[ADR 0006](adr/0006-profile-contract-and-lab-review.md) resolves developer-review findings in contract operation discovery, resource-version wording, profile selection identity and local lab fault/replay cases. There are now nine OpenAPI operations. Docker execution and independent review are still open; source review alone is not SQL evidence.

The [current work disposition](phase-4-status.md) records the user's 20 October instruction to defer external integrations and complete local technical work. [ADR 0005](adr/0005-local-technical-verification.md) adds a disposable SQL/restore lab, outbox schema and version parser. Docker execution is blocked in this environment; no phase-exit waiver is inferred.

| Required exit                                                         | Current status / next action                                                                                                                                                     |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stable scope, data/privacy and usable design flows                    | Earlier phase approvals and real UX evidence open; product/privacy/design to resolve                                                                                             |
| ADRs, bounded modules and threat/data review                          | ADRs 0001–0005 plus scoped review prepared; full MVP/ASVS applicability and independent review open                                                                              |
| Identity + native links spike                                         | Not implemented; approved provider/account/device inputs required                                                                                                                |
| Exact regional model pinned and evaluated                             | Not selected; G-04 remains open                                                                                                                                                  |
| SQL migrations, role isolation and restore verification               | Native PostgreSQL 18.6 migration/pool/contention spike passed; local tooling selected; production schema/rollout, full race/recovery evidence and independent review remain open |
| Checked API/data contracts                                            | Nine-operation foundation, outbox schema and pure library tests; full MVP contracts pending                                                                                      |
| Actual cost B, infrastructure/recovery plan and named delivery owners | Required inputs missing; no spend, infrastructure apply or committed estimate                                                                                                    |
| No architectural blocker                                              | Not achieved; gates above explicitly remain open                                                                                                                                 |

## Validation and rollback

Run `pnpm domain:check` to build the domain package and run schedule tests; `pnpm check` includes it alongside repository, format, lint, contract, prototype and TypeScript checks. These commands verify library/tooling behavior only. The test suite includes the OpenAPI request examples, chronological relationships, impossible dates, fractional equality, all status denials, opening/closing boundaries, scheduler delay and fixed UTC instants spanning a DST change. Native and integration acceptance remain separate.

No runtime route or client behavior is changed; no database migration, data collection, provider call or deployment occurs. Rollback removes the helper/export/check/tests and reverts planning-document changes while retaining decision history. Existing phase-three prototype and local scaffold remain independent.

## Local verification record ? 19 October 2026

The new domain check built the shared package and passed all 8 schedule tests. Existing contract checks passed 16 tests and prototype checks passed 4 tests. Repository link/boundary checks, formatting and lint passed. These are synthetic local library/contract results, not hosted CI, SQL/RLS, provider, native-device, performance, model or restore evidence. The existing EX-00-S01 dependency-security gate remains open; no dependencies changed and no advisory disposition is altered.
