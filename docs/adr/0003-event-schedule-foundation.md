# ADR 0003 — provider-independent event schedule foundation

Date: 19 October 2026. Status: implemented pure library and local tests; backend enforcement and independent architecture review outstanding. Accountable review roles: backend architect, product and QA; named people are not assigned.

## Context and decision

The request to proceed after UX/UI Design starts roadmap phase four, Architecture & Technical Planning. Discovery, policy, provider and phase-three validation gates remain open. The architecture contract permits independent technical work while dependent integrations wait. [ADR 0002](0002-contract-foundation.md) explicitly left chronological comparisons unenforced.

Implement [event schedule validation and time-window assessment](../../packages/domain/src/event-schedule.ts) as pure dependency-free TypeScript. Export it from the existing domain package, exercise it using the built package with Node's test runner, and include the tests in repository checks. This does not add a route, database, authentication control or new service architecture. The API remains the eventual authorization boundary. Clients may use these rules for hints; server checks cannot be replaced by client output.

## Reconciliation and exact behavior

| Source                                              | Implementation / precision                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-03 and document 01 lifecycle                      | Physical start < end; admission open < close; networking open < close. Nonempty admission interval makes explicit the already-required chronological admission range.                                                                                                                                                                                                     |
| Document 01 event-window constraints                | Admission close <= networking close; physical end <= networking close. No extra requirement that networking surround physical start, or that admission open before networking open.                                                                                                                                                                                       |
| Document 05 comparison convention                   | Opening inclusive, closing exclusive; no dependence on scheduler changing stored status on time.                                                                                                                                                                                                                                                                          |
| Draft/published/closed/cancelled/archived lifecycle | Only published can have an open time window. Unknown runtime status fails closed. The helper never changes stored lifecycle status or decides publish/cancel authority.                                                                                                                                                                                                   |
| Canonical UTC contract                              | Validate actual calendar dates, uppercase T/Z and UTC seconds with optional decimal fraction. Reject offsets, impossible dates, 24:00 normalization and second 60. Existing OpenAPI shape validation alone may accept leap seconds; the domain layer deliberately rejects these unsupported instants. The API must translate failures to safe 422 field codes when wired. |
| Fraction precision                                  | Preserve decimal order without collapsing submillisecond boundaries. Equivalent trailing-zero fractions compare equally. Before persistence, explicitly settle database/wire precision and loss handling; no silently rounded stored boundaries.                                                                                                                          |

`validateEventSchedule` returns field and related-field codes without input values. `assessEventWindows` requires an explicitly supplied current instant and returns either validation failure or separate admission/networking states. Future server integration must supply trusted database transaction time, not client time. Tests inject fixed times. The helper does not validate timezone names, category, capacity, identity, roles, membership, consent, block state, credentials, retention or contact grants. An open window is never permission to act or disclose data.

## Alternatives and trade-offs

JSON Schema remains the wire-shape authority, but portable standard JSON Schema cannot express these cross-field comparisons. Deferring all checks to SQL would leave clients without shared feedback and would not supply pure tests before persistence. Putting full authorization in a client-safe package would confuse time eligibility with trust and risk duplicating the backend boundary. A temporal dependency is unnecessary for comparison of already-normalized UTC instants; local-to-UTC conversion and ambiguous venue times remain a later input-adapter responsibility.

This narrow library resolves an existing technical gap without choosing a privacy policy, hosting region, IdP or model. It intentionally avoids date defaults and retention/cancelled-feedback cutoffs, which remain proposed decisions.

## Validation and rollout

See [the phase-four package](../technical-planning.md) and [tests](../../tests/event-schedule.test.mjs). Required evidence covers invalid dates, chronology, equality, fractional precision, delayed scheduler, every stored status, invalid time and DST-adjacent UTC boundaries. Contract examples are checked against domain rules so documentation cannot drift silently.

No migration or runtime rollout is performed. Consumers remain unchanged. Rollback removes the helper export/tests/check script and preserves decision history. Before enabling routes, require authenticated validation wiring, database precision agreement, real transaction/RLS and concurrency tests, plus the policy/provider gates applicable to that slice.
