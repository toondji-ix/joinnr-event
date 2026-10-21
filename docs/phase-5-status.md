# Phase 5 implementation status

Update, 21 October 2026: the user requested end-to-end development while retaining external-integration deferral. The shared domain package now also implements a configurable taxonomy-only ranking core: hard snapshot eligibility, Jaccard interests, harmonic reciprocal-goal fit, factual reason references, deterministic tie ordering and a shortlist capped at five. Eight new synthetic tests passed; all 29 domain tests pass. No weights or compatibility table are silently approved: callers must supply versioned configuration. No style/semantic/exploration score, live authorization, persistence, API or client integration is implied. Store configuration versions with future match runs, keep internal scores out of public DTOs and revalidate current eligibility before display/request. See the [technical completion review](technical-completion-review.md) for contract/security/review/provider/operational progress and remaining dependencies.

Updated 20 October 2026. Status: started, local domain implementation only.

The product/research owner reconfirmed that external integrations remain deferred. No cloud resources, provider calls, credentials, real participant records or deployments are introduced by this milestone. Earlier phase exits remain open as recorded in [Phase 4 status](phase-4-status.md).

## Implemented: request transition decisions

F-10/F-11: `packages/domain/src/request-transition.ts` provides a shared pure decision function for acceptance, decline and withdrawal, following [ADR 0004](adr/0004-request-lifecycle-contracts.md) and the existing OpenAPI contracts.

- Only the receiver accepts/declines; only the sender withdraws. Inaccessible and cross-event snapshots yield `NOT_FOUND` before state/version details.
- Pending requests require an open published networking window and an unexpired request. Openings are inclusive and closing/expiry instants exclusive, retaining submillisecond UTC precision. A delayed scheduler never extends permission.
- Terminal requests yield `CONFLICT`; stale pending versions yield `STALE_VERSION`. Invalid schedules, timestamps and unsafe version increments fail closed.
- Successful decisions increment the request version and indicate whether a connection must be created. They contain no contacts or grant instructions, and never mutate inputs.

This function is not authorization or persistence. Its snapshot must come from trusted server records under compatible pair/request locks. UUID/wire validation, verified actor resolution, active account/membership and block checks, canonical-pair locking, atomic connection/outbox writes and live idempotency replay remain responsibilities of the future application service. Never pass a client-supplied `pair_accessible` flag to this function. No HTTP route is enabled.

## Remaining Phase 5 work

1. Implement and verify the local application/persistence boundary: real product migrations after policy reconciliation, server-resolved eligibility, atomic request/connection/outbox writes and actor-bound idempotency. Extend PostgreSQL tests to actual product operations, especially accept/block races. Existing synthetic database fixtures do not establish this behavior.
2. Implement event administration/admission and profile modules, deterministic eligible matching, bilateral contact grants, feedback and safe aggregate analytics, with contracts and negative/concurrency tests for each slice. Follow the dependency order in the [execution plan](execution-plan.md).
3. Connect web/native journeys to verified APIs, including unsent draft recovery, accessibility and device evidence. Current framework shells are not completed attendee applications.
4. Resume managed identity, staging, notifications and model integration only after approved resources and policy inputs are supplied. Independent privacy/design/security review and the unresolved dependency audit findings remain open.

Do not mark Phase 5 complete from pure domain tests. End-to-end real integration, mobile, accessibility, operational and review evidence remains required by the repository definition of done.

## Verification

`pnpm domain:check` includes seven new lifecycle tests covering action/participant permissions, inaccessible object concealment, terminal states, precise expiry, event availability, stale versions and malformed snapshots. Repository validation results are recorded below after execution. No database schema or API wire contract changed in this slice.

- `pnpm domain:check`: passed all 21 domain tests.
- `pnpm check`: passed repository checks (112 files, eight manifests), formatting, lint, 39 contract/outbox tests, four prototype tests, five database preflight tests, 21 domain tests and all seven workspace typechecks.
- `pnpm exec prettier --check docs/execution-plan.md`: passed after the authorization update.
- Not rerun: PostgreSQL execution, provider integrations, dependency audit, browser/native end-to-end and accessibility checks. This slice changes no dependencies, database schema or rendered interface; earlier integration/review limitations remain open. No product persistence or concurrency verification is claimed.
