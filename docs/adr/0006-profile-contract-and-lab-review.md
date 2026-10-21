# ADR 0006: profile selection contracts and local lab review

Date: 20 October 2026. Status: local implementation and developer review; independent approval and database execution pending. Requirements: F-06/F-07/F-09/F-16/F-18 and NFR-08/09. Product/research owner: the user; developer: Codex. This is not an independent review or a phase-exit approval.

## Scope and source reconciliation

Extend the seven-operation foundation with PUT `/events/{eid}/profile/interests` and PUT `/events/{eid}/profile/goals`, using the existing [API blueprint](../05-api.md), [PRD](../01-product.md) and [data constraints](../04-data.md). The OpenAPI source now describes nine operations; routes remain unimplemented. Regenerated TypeScript types remain client-safe and carry no runtime authorization.

| Decision                                                      | Rationale, alternatives and consequence                                                                                                                                                                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interest body is `{interest_ids: UUID[]}`                     | Makes the blueprint's 3–10 active interest IDs explicit. Complete replacement, not append/remove patches. Reject actor, event, version, role and consent assignment in the body.                                                               |
| Goal body is `{goals: GoalInput[]}`                           | Keeps the blueprint's 1–3 goals, seek/offer direction, topic ID, public summary, optional private detail and priority. Offer-only selection stays valid; no implied requirement to seek.                                                       |
| Both operations require existing profile and profile If-Match | They do not create the profile singleton. Missing precondition is 428 and stale is 412. ETag and response version refer to the whole profile, not a goal row or consent. Shared precondition descriptions now say resource instead of request. |
| Author-only response projection                               | Interests return selected IDs and profile version. Goals return selected goals and version to their author; private detail never enters PublicProfile, analytics, logs or outbox. Staff have no self-profile override.                         |
| Goal identity is direction plus topic UUID                    | JSON Schema uniqueItems catches identical objects, not goals whose summaries/priorities differ. A pure helper reports later duplicate indexes without returning private values. Separate seek and offer for the same topic are allowed.        |
| UUID identity ignores letter case                             | UUID wire formats permit uppercase hexadecimal, while database identity is the same. Helpers canonicalize for comparison without mutating caller data. Exact JSON uniqueItems alone is insufficient for interest IDs with differing case.      |
| Active taxonomy and atomic invalidation remain server duties  | Syntax and pure identity checks cannot prove an approved/active topic, current account/membership, live consent, current profile version, transaction commit or derived-data purge. Do not install mock success endpoints.                     |

Alternative: postpone every profile contract behind unresolved style/retention decisions. Rejected for these two bounded selection operations because their existing bounds and identities are specified independently. Cancelled/expired-event editing and retention remain policy-gated; no event-window exception is selected. Alternative: use labels as IDs or enforce a seek/offer balance. Rejected because those would change taxonomy identity or product requirements.

## Review findings and fixes

| Finding                                                         | Fix                                                                                                          | Evidence limit                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Contract test discovery assumes every path is POST              | Enumerate supported HTTP operations, validate request/success examples and auth/cache metadata per operation | Covers the two new PUT operations; not a mobile end-to-end test                                                               |
| Shared If-Match wording names only request versions             | Clarify resource scope and introduce a distinct profile ETag header                                          | Does not implement live optimistic locking                                                                                    |
| Semantic duplicates can pass uniqueItems                        | Shared pure interest/goal duplicate checks with case-insensitive UUID identity tests                         | Boundary validation must run first; runtime integration remains absent                                                        |
| SQL lab covers ordinary rollback but not an aborted transaction | Inject division-by-zero, capture and require SQLSTATE 22012, rollback, then assert no context-visible rows   | Expected fault handling is local to that statement; other SQL errors still stop the run. Unexecuted until Docker is available |
| Restore test does not exercise repeated deletion delivery       | Replay deletion and require zero additional changes plus an unrelated surviving record                       | Synthetic marker only; not production deletion-ledger service evidence                                                        |
| SQL failures lose their safe diagnostic code                    | Request sqlstate verbosity, report only final SQLSTATE/stage, preserve cleanup failures                      | No raw SQL, passwords, profile content or dumps printed                                                                       |
| Docker context alone does not prove engine readiness            | Require Compose v2+ and running Linux-container engine before starting the random lab project                | Docker absence remains an explicit failed preflight, never a successful skip                                                  |
| Runner rejection boundaries have no regression check            | Add subprocess tests for arbitrary connection arguments and remote host/context overrides                    | These test refusal only, never database/RLS behavior                                                                          |

Primary references checked 20 October 2026: [PostgreSQL UUID input](https://www.postgresql.org/docs/17/datatype-uuid.html) and [psql SQLSTATE/ON_ERROR_STOP](https://www.postgresql.org/docs/17/app-psql.html). No dependency, model, provider, region, migration tool or privacy policy is selected.

## Remaining review and rollout

The user will prepare Docker and free disk space. Rerun `pnpm database:check` once ready; investigate actual failures before approving the SQL spike. Existing production migration, real connection-pool adapter, concurrency, full MVP contracts, privacy and independent-review gates remain open. External integrations remain deferred.

`pnpm contracts:generate` updates generated types; `pnpm contracts:check` checks API/outbox schemas; `pnpm domain:check` includes selection identity tests. New `pnpm database:preflight:check` runs only the refusal regressions and is included in `pnpm check`. It must not be reported as a database verification pass.

Rollback removes the two contracts/generated additions, selection helpers/tests and lab-review changes. No application data or cloud resource changes. Existing historical ADR records remain intact.

## Verification — 20 October 2026

- `pnpm contracts:generate`: passed OpenAPI lint and regenerated types for nine operations.
- `pnpm check`: passed repository checks (101 files/eight manifests), formatting, lint, 39 API/outbox contract tests, four prototype tests, three database-preflight refusal tests, 14 domain tests and all seven workspace typechecks.
- `pnpm database:check`: exited 1 with Docker-unavailable preflight; no SQL, RLS, failed-transaction or restore assertion executed. The user explicitly undertook Docker installation/startup and disk preparation.
- Independent review, actual PostgreSQL execution, migration-tool comparison/selection, pool adapter and concurrency proof remain open. Provider/staging integrations remain deferred; no dependency or lockfile changed and the existing advisory gate is unaffected.
