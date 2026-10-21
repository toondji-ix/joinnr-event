# ADR 0002 — first technical foundation: API contracts and threat review

Date: 19 October 2026. Status: implemented contract tooling; application enforcement is not implemented.

## Scope and source of truth

The user selected **first technical foundation work**, not Discovery & Validation. This implements the first review-sized package in [the execution plan](../execution-plan.md): an initial OpenAPI contract, shared generated types, validation/negative cases and a scoped authorization/data/threat review. It does not close discovery or authorize later feature slices.

The machine-readable source is [packages/contracts/openapi.yaml](../../packages/contracts/openapi.yaml). It covers exactly three operations from [the API blueprint](../05-api.md): `POST /organizations`, `POST /organizations/{oid}/events`, and `POST /access/resolve`. Other operations remain design-only. All three routes are **unimplemented** in the API; there are no controllers, database writes, UI changes, auth/provider integrations or deployment changes in this package.

| Artifact                       | Authority                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Product/architecture blueprint | Product behavior, roles, privacy rules and unresolved discovery decisions                                          |
| OpenAPI                        | Wire shapes, bounds, operation IDs, documented responses and security declaration for the three covered operations |
| Generated TypeScript           | Derived client-safe types only; never hand edit or treat as runtime validation                                     |
| Contract tests                 | Schema/example/rejection checks and regression guards for public projections; not evidence of live authorization   |
| This review                    | Technical precisions, controls that remain unenforced, and evidence needed in later slices                         |

## Decisions and trade-offs

Use OpenAPI 3.1 as the contract source, `openapi-typescript` for type generation, Redocly core for structural/reference linting, and strict Ajv 2020-12 plus formats for tests. The tooling is development-only at the root; the shared package has no runtime dependencies. Redocly core is pinned to the compatible 1.x line used by the generator rather than installing two different core stacks. Node's built-in test runner is sufficient; no additional test framework, SDK or HTTP client is introduced.

`pnpm contracts:generate` lints and regenerates formatted types. `pnpm contracts:check` fails on lint warnings/errors, generated-source drift, invalid examples or rejected-input regressions. It is part of `pnpm check`, so the existing CI runs it. Generation does not install route handlers or imply an endpoint is available.

TypeScript types cannot prove input validity, exact unions, identity, randomness or authorization. Ajv is used here only as contract-test tooling, with coercion and property stripping disabled. A future API validation adapter must use the same schema semantics and tested IANA timezone support before those routes are enabled.

### Source reconciliation and wire precision

| Point                       | Resolution / rationale                                                                                                                                                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base path                   | Use relative `/v1`; no production hostname or identity-provider endpoint is invented.                                                                                                                                                                                                                      |
| Organization input bound    | Name is 1–160 characters with a non-whitespace character. The blueprint left the organization-name bound unspecified; 160 matches event title bounds and makes input bounded without a product-policy change.                                                                                              |
| Creation responses          | Minimal `{data: {id, name, version}}` organization response and `{data: {id, organization_id, status: draft, version}}` event response. Internal owner/organizer assignments are required transaction effects, not client-controlled fields. Full management projections belong to their later operations. |
| Manual credential alphabet  | Canonical eight-character uppercase Crockford Base32; no I/L/O/U. Clients normalize code entry before submitting. This specifies the blueprint's previously unnamed unambiguous Base32 encoding.                                                                                                           |
| Link/idempotency key syntax | URL-safe, bounded strings; callers must generate sufficient entropy. Passing a pattern does not prove randomness. Link generation, HMAC storage, rotation and idempotency persistence are later implementation work.                                                                                       |
| Public response precision   | `data.event`, `data.join_intent`, `data.expires_at`; organizer display name is `organization_name`. Public event status must be published. Never return supplied credentials or attendee lists.                                                                                                            |
| Time                        | Canonical UTC `Z` instants and a named-IANA format. Named-zone validation in tests uses the local runtime timezone database. Production timezone consistency and chronological relationships require later validation and database tests.                                                                  |
| Conditional edits           | These three operations are creates/resolve, not conditional updates. No fictitious If-Match behavior is added. Future edits retain the blueprint's ETag/precondition rules.                                                                                                                                |
| Policy gates                | D-01–D-16 remain unratified. The existing 5,000 capacity maximum is a proposed envelope, not a confirmed pilot commitment. No age, retention, admission entitlement, vendor or region decision is silently approved.                                                                                       |

## Authorization matrix for this contract set

| Actor                                    | Create organization                     | Create event                                                   | Resolve access                                 |
| ---------------------------------------- | --------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| Anonymous                                | 401                                     | 401                                                            | Public credential check only, rate-limited     |
| Verified account without MFA             | 403                                     | Cannot bypass owner/staff MFA requirements                     | Same public check                              |
| Verified account with MFA                | Creates own owner membership atomically | Only if current owner of path organization                     | Same public check                              |
| Organization owner                       | As verified actor                       | Own organization only                                          | Same public check                              |
| Assigned organizer/planner/moderator     | No extra authority from event role      | No create-event authority unless separately organization owner | Same public check                              |
| Staff or owner from another organization | No authority to select another owner    | Generic 404 for inaccessible organization                      | Credential conveys no staff or attendee access |
| Worker/platform identity                 | No routine end-user authority           | No automatic owner bypass                                      | No admission bypass                            |

JWT validation authenticates the actor; database membership authorizes the organization. No caller-supplied `user_id`, `owner_user_id`, `role`, `organization_id` or event publication state is accepted in create bodies. OpenAPI security metadata and `x-authorization` document these requirements; they are not running guards or RLS policies.

## Data classification and boundaries

| Data                                      | Classification and handling requirement                                                                             | Disclosure boundary                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Bearer token / session                    | Secret; validate, never log or expose in public types/analytics                                                     | BFF/IdP/API trust boundary; provider remains unconfigured                                       |
| Link token, join code, signed intent      | Restricted credentials; no logs, traces, analytics or cache; intent is not API authentication                       | Resolution body and no-store response only; future admission must revalidate credential/version |
| Organization ownership / staff assignment | Private authorization data; server-assigned and audited                                                             | Current account and tenant scope, never arbitrary client headers                                |
| Draft event fields                        | Tenant-private event configuration; not published by creation                                                       | Organization owner and later assigned management roles                                          |
| Published preview allowlist               | Intentionally public to credential holder: title, organization name, category, timezone, windows and admission mode | No membership, capacity usage, contact, profile or assessment fields                            |
| Problem envelope                          | Safe error code/field path and request ID; no stack, SQL, supplied values or raw provider error                     | Calling client; inaccessible object and invalid credential responses conceal existence          |
| Contract examples                         | Synthetic, nonfunctional values; never imported as production seed data                                             | Checked-in documentation/tests only                                                             |

## Threat review and required negative cases

| Threat                                       | Control specified here                                                                                | Remaining enforcement and evidence                                                                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mass assignment / role escalation            | Closed request objects; schema tests reject owner/role/status fields                                  | API allowlist validation before persistence; verified actor binding and ownership tests in EX-06/07                                                                                 |
| Cross-tenant object access                   | Owner-only path authorization, generic inaccessible 404 documented                                    | Real database/RLS and pooled-context tests in EX-04; HTTP negative cases before enabling EX-07                                                                                      |
| Missing/forged/ID token authentication       | Bearer access-token requirement, no body actor fields                                                 | Real issuer/signature/token-use/client binding and staff MFA tests in EX-06                                                                                                         |
| Brute-force or leaked event credentials      | Exactly one bounded credential; generic failure and 429/Retry-After defined                           | HMAC/digest storage, rotation, composite quotas and expiry tests in EX-07/08                                                                                                        |
| Stale intent after credential rotation       | Intent explicitly cannot grant admission or reserve a seat                                            | Validate current credential/version at enrollment; race/expiry tests in EX-08                                                                                                       |
| Duplicate create / crossed capacity requests | Idempotency required for creates; 409 conflict defined                                                | Transactional dedupe, body hash, atomic owner assignment and capacity constraints in EX-04/07/08                                                                                    |
| Public data leakage                          | Closed preview/response; rejection tests for contacts, members, raw style answers and internal counts | Live field projection and no-store headers, log redaction and tracing tests in EX-07/08                                                                                             |
| XSS or secret-bearing errors                 | Text is data; safe closed problem envelope                                                            | Contextual output encoding, redaction and error middleware tests with implemented clients/API                                                                                       |
| Invalid chronology / admission policy        | Window fields and formats required                                                                    | Service rejects start >= end, networking open >= close, admission open >= close, admission close > networking close and networking close < event end; add domain tests before EX-07 |
| Supply-chain / contract drift                | Exact tooling pins, lint, schema tests and committed-generation check                                 | Existing dependency advisory gate remains independent; no security finding is suppressed by this work                                                                               |

Schema tests validate wire-level rejection only. In particular, a syntactically valid request to someone else's organization is an authorization test for a real API, not a JSON Schema validation case. Do not mark those live controls verified until their actual implementation and tests exist.

## Completion and handoff

This package is ready when OpenAPI lint, all strict schema tests, generation drift checking, shared-package build and existing repository checks pass. Negative tests must be observed failing for a deliberate broken contract/type artifact during verification. No database/container/provider access is needed. Broader EX-02 contract coverage and discovery approval remain open; this package does not make the entire MVP API executable.

### Verification — 19 October 2026

- `pnpm contracts:generate`: lint passed and generated types produced.
- `pnpm check`: passed repository/format/lint checks, all 16 contract tests, shared-package compilation and all workspace typechecks.
- `pnpm install --frozen-lockfile --ignore-scripts --offline`: passed.
- Deliberately stale generated output: generation-drift check failed as expected; original bytes restored.
- Deliberately permissive public-preview schema: the privacy regression test failed as expected (15 passed, 1 failed); original bytes restored before the passing final checks.
- `pnpm audit --json`: same existing two high and one moderate advisories; no additional findings from the contract tooling. The separate security gate remains blocked.

No app bundle rebuild, Docker/provider integration, live API authorization test or deployment was needed or claimed for this contract-only change. Application sources are unchanged.

Technical references: [OpenAPI TypeScript generation API](https://openapi-ts.dev/node), [Redocly linting](https://redocly.com/docs/cli/commands/lint), [Ajv strict mode](https://ajv.js.org/strict-mode.html), and [Ajv JSON Schema dialects](https://ajv.js.org/json-schema.html), checked 19 October 2026. No new legal, vendor or model claim is introduced.
