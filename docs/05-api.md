# 05 — API specification

## 1. Contract conventions

Update, 21 October 2026: the public related-profile GET now has a closed OpenAPI envelope and live event/relation/block invariants, bringing machine-readable coverage to ten operations. `node scripts/contract-coverage.mjs --require-complete` checks the blueprint's 88 operation-table entries (including BFF); 78 remain design-only and the closure command therefore fails. The profile route remains unimplemented; no API completion claim follows. See [technical completion review](technical-completion-review.md).

Latest extension: [ADR 0006](adr/0006-profile-contract-and-lab-review.md) adds PUT interests/goals for the self event profile, bringing coverage to nine operations. Bodies are `{interest_ids: UUID[]}` and `{goals: GoalInput[]}`; both require profile If-Match and return the profile version. Interest/goal identity checks supplement JSON Schema uniqueness, including UUID letter case. No route or live authorization is implemented.

Update, 20 October 2026: [ADR 0004](adr/0004-request-lifecycle-contracts.md) extends the machine-readable contracts with POST `/events/{eid}/requests` and its `/accept`, `/decline` and `/withdraw` transitions. Seven operations now have schemas/types/tests. Their operation-specific responses, request-versus-connection ETags and `intro` to `introduction` mapping are documented in that ADR. The earlier three-operation description below is the original foundation scope; all routes remain unimplemented.

This is the MVP API design baseline. The first technical foundation now has [validated OpenAPI 3.1 contracts](../packages/contracts/openapi.yaml), generated shared types and contract tests for POST /organizations, POST /organizations/{oid}/events and POST /access/resolve. See [the scoped foundation review](adr/0002-contract-foundation.md) for wire precision, authorization/data boundaries and enforcement still required. Other operations below remain design-only and must gain validated contracts before their frontend feature work. No routes are implemented by this contract package; no unimplemented route may return a successful placeholder result.

Base path `/v1`. JSON UTF-8, HTTPS only. UUID identifiers, RFC 3339 UTC timestamps, cursor pagination with opaque signed cursors (`limit` default 20, max 50). Standard list response `{data: [...], next_cursor: string|null}`. Detail response `{data: object}`. No offset pagination for changing feeds. Exact allowlisted CORS origins for native-independent web use; browser calls use same-origin BFF. BFF `/auth/*` is not part of the public domain API.

Authentication: valid API access token except public access resolution, health readiness restricted at infrastructure and IdP/BFF routes. Actor identity comes only from verified authentication. No caller-supplied user ID for self actions. Object/event relationships and roles are checked even when a resource was previously returned to the client. Unknown or unauthorized object IDs return generic 404; unauthenticated requests return 401. Explicit forbidden action on an otherwise accessible resource returns 403.

Writes requiring retry safety carry `Idempotency-Key` (random >=128 bits); server scopes it by actor+route, stores request hash for 24 h. Same key+body returns same logical result; different body yields 409. Reject duplicate mutation until initial transaction resolves; no duplicate email/outbox side effects. Conditional edits carry `If-Match: "version"`; missing precondition returns 428, mismatch 412 with safe current version. State transitions return 409 when incompatible with current state. Event lifecycle/expiry always rechecked server-side.

Errors use `application/problem+json`: `type` (stable URI), `title`, `status`, stable `code`, `request_id`, optional safe `field_errors` list of `{field,code}`. Never include tokens, database errors, SQL or other people's existence. Common statuses: 400 malformed/invalid credential; 401 auth; 403 permission; 404 inaccessible object; 409 state/capacity/idempotency; 412 stale version; 413 too large; 422 field validation; 428 missing version; 429 rate limit + Retry-After; 503 unavailable with safe retry guidance. No contact contents in API logs.

Schedule semantics are now implemented as a pure shared library under [ADR 0003](adr/0003-event-schedule-foundation.md), with contract-example tests. This library is not wired to routes: runtime validation/authorization remains unimplemented. Domain validation additionally rejects impossible calendar dates and unsupported leap-second notation; JSON Schema shape validity alone is insufficient.

### Shared schemas and bounds

| Schema | Required data / rules |
|---|---|
| EventInput | title 1–160, description 1–4000 plain text, category allowed enum, timezone valid IANA, starts_at/ends_at, admission_opens_at/closes_at, networking_opens_at/closes_at, capacity 1–5000 initial envelope, admission_mode shared/approval |
| EventSummary | id, organization display name, title, category, timezone, dates/windows, admission_mode, public status; no active member count for private events |
| ProfileInput | display_name 1–80, headline 1–120; company <=120?, bio <=1000?, experience_level?, experience_preference?, ready avatar id?; required eligibility uses interests/goals stored separately |
| PublicProfile | membership_id, event_id, display_name, headline, optional company/bio/avatar/declared experience, selected interest labels, user-approved goal public summaries; no contact, private detail or style |
| GoalInput | direction seek/offer, topic_id from active taxonomy, detail <=240?, public_summary <=160, priority 1–3; array 1–3 unique goals |
| StyleInput | instrument_version, exactly four answer slots each integer 1–5 or null (skipped), consent policy version; skip-all also has a separate endpoint |
| Recommendation | id, run_id, candidate PublicProfile projection, reasons [{code, text, public_fact_refs}], mode semantic/fallback, generated_at, expires_at; no numeric “compatibility probability” |
| Request | id, event_id, sender and receiver public projections, status, optional sanitized intro, created_at, expires_at, version; no contacts |
| ContactGrantInput | contact_ids nonempty owned contact list (max 3), consent_text_version; field versions captured server-side |
| FeedbackInput | rating integer 1–5, meaningful_outcome boolean|null, note <=500?; submitted by pair participant only |
| Metric | name, value number|null, numerator?, denominator?, definition_version, sample_size?, suppressed boolean; date range/watermark on envelope |
| UploadRequest | media_type allowlisted JPEG/PNG/WebP, bytes <=5 MB, sha256; processed image max decoded dimensions/pixels set and tested by media pipeline |

### Example successful recommendation

Illustrative shape, not a real recommendation or seed data:

```json
{
  "data": [{
    "id": "01900000-0000-7000-8000-000000000001",
    "run_id": "01900000-0000-7000-8000-000000000002",
    "candidate": {
      "membership_id": "01900000-0000-7000-8000-000000000003",
      "event_id": "01900000-0000-7000-8000-000000000004",
      "display_name": "Synthetic example attendee",
      "headline": "Platform engineer",
      "interests": ["Developer platforms"],
      "goals": ["Offer mentorship in platform engineering"]
    },
    "reasons": [{
      "code": "RECIPROCAL_GOAL",
      "text": "You seek mentorship; they offer mentorship in your selected topic.",
      "public_fact_refs": ["goal:mentorship"]
    }],
    "mode": "fallback",
    "generated_at": "2026-10-15T10:00:00Z",
    "expires_at": "2026-10-15T10:15:00Z"
  }],
  "next_cursor": null
}
```

## 2. Identity, account and organization operations

| Method / path | Authorization and input | Output / behavior |
|---|---|---|
| GET `/auth/login` (BFF) | Signed allowlisted return intent | 302 to IdP with state/nonce/PKCE |
| GET `/auth/callback` (BFF) | Single-use state + code | Validate exchange, set cookie, 303 to safe original route |
| POST `/auth/logout` (BFF) | Session + CSRF | 204, revoke and clear credentials |
| GET `/auth/session` (BFF) | Cookie | 200 safe identity, session expiry; no OAuth tokens |
| GET `/me` | Signed in | Account state, identities summary, consent and privacy capabilities |
| PATCH `/me` | Self; If-Match; locale/display name only | 200 versioned account; no role mutation |
| GET `/me/events` | Self; pagination, status? | 200 own admitted/pending event summaries |
| GET `/me/contacts` | Self + recent auth | 200 own verified contact values and statuses, no-store |
| POST `/me/contacts` | Self + recent auth; kind,value | 202 email verification pending; work URL 201 validated/self-supplied; optional phone only with real verification integration |
| POST `/me/contacts/{id}/verify` | Self; single-use challenge proof, bounded attempts | 200 verified status; email confirmation may use managed verifier callback |
| DELETE `/me/contacts/{id}` | Self + recent auth; idempotent | 204; invalidate all grants referencing field |
| POST `/me/exports` | Self + recent auth; idempotency | 202 privacy job; audited |
| GET `/me/privacy-jobs/{id}` | Self | 200 status; finished export yields short-lived authenticated download capability |
| POST `/me/deletion` | Self + recent auth; explicit confirmation + idempotency | 202 deletion receipt, immediate disable; receipt retained locally; status via restricted receipt capability after account disable |
| GET `/privacy/deletion-status` | High-entropy deletion receipt capability, redacted logging | 200 minimal pending/completed; no personal information |
| POST `/organizations` | Verified user + MFA; name | 201 organization + owner membership in transaction |
| GET `/organizations` | Staff member | 200 own organizations only |
| GET `/organizations/{oid}/staff` | Owner | 200 safe staff list with roles/assignments |
| POST `/organizations/{oid}/staff-invitations` | Owner + step-up; verified-email target, event_id, role | 201 invitation status; queued transactional invite email, no plaintext secret in result |
| POST `/staff-invitations/accept` | Verified intended email + MFA; invite token + idempotency | 200 organization/event assignment; token consumed atomically |
| DELETE `/organizations/{oid}/staff-invitations/{iid}` | Owner + step-up | 204 revoked |
| DELETE `/organizations/{oid}/events/{eid}/staff/{uid}/roles/{role}` | Owner + step-up | 204 assignment revoked, active sessions immediately see reduced permissions |
| POST `/organizations/{oid}/ownership-transfers` | Owner + step-up; existing verified/MFA organization member + explicit confirmation | 200 atomic owner transfer; never leaves zero owners |

Managed IdP owns credential registration/recovery/MFA enrollment routes. Test full integration rather than adding custom password endpoints. Privacy status capability must be stored hashed, expire after completion notice window and be rate-limited; it never restores authentication.

Recent authentication means provider-confirmed authentication age <=15 minutes for sensitive self-service actions, with MFA additionally required for staff privileged actions. If verification challenges are application-mediated, store challenge hashes, expire after 10 minutes, cap attempts at five and bind to user+contact+purpose. Provider verification tokens must be checked by their documented mechanism rather than treated as arbitrary client assertions.

## 3. Events, access and admission

| Method / path | Authorization and input | Output / behavior |
|---|---|---|
| POST `/organizations/{oid}/events` | Owner or organization member explicitly granted create-event capability (MVP: owner only); EventInput | 201 draft, creator receives organizer assignment |
| GET `/organizations/{oid}/events` | Staff | 200 owner sees all; others assigned only |
| GET `/events/{eid}/management` | Assigned staff | 200 editable data, capabilities and version |
| PATCH `/events/{eid}` | Organizer/planner; If-Match; logistics allowlist | 200; changing capacity below admitted active count rejected; published window changes audited and notified |
| POST `/events/{eid}/publish` | Organizer + step-up; If-Match + idempotency | 200 published + one-time access bundle; incomplete event 422 |
| POST `/events/{eid}/cancel` | Organizer + step-up; If-Match, reason code + idempotency | 200 cancelled; access/recommendations invalidated in transaction, notifications queued |
| POST `/events/{eid}/close` | Organizer; If-Match + idempotency | 200 closed; pending requests expire; scheduler uses same command |
| POST `/events/{eid}/archive` | Organizer; If-Match | 200 only closed/cancelled; retention still enforced |
| POST `/events/{eid}/access/rotate` | Organizer + step-up; idempotency | 201 new one-time link/code/QR source; old credentials revoked atomically |
| GET `/events/{eid}/access/status` | Assigned planner/organizer | 200 expiry/rotation metadata only; secrets not recoverable |
| POST `/access/resolve` | Public, rate-limited; exactly one link_token or join_code | 200 safe EventSummary + short-lived signed join intent; invalid/expired generic 400 |
| POST `/events/{eid}/memberships` | Verified user; signed join intent, adult eligibility attestation, referral token?; idempotency | 201 active/shared or pending/approval; duplicate returns existing 200; capacity 409; mismatch denies |
| GET `/events/{eid}/membership` | Self | 200 own state and permitted actions |
| POST `/events/{eid}/membership/leave` | Self; explicit confirmation + idempotency | 200 left; requests expire, grants revoke, discoverability off |
| GET `/events/{eid}/admissions` | Assigned staff; pagination/status | 200 minimum identity/contact-to-support projection; no style/goals/contacts for networking |
| POST `/events/{eid}/admissions/{mid}/approve` | Assigned planner/organizer; idempotency | 200 active with capacity lock; raced last seat returns 409 |
| POST `/events/{eid}/admissions/{mid}/reject` | Assigned planner/organizer; reason code | 200 rejected; no implicit later reactivation |
| POST `/events/{eid}/admissions/{mid}/reset` | Assigned organizer; audit reason | 200 pending reapplication eligibility; no automatic admission |
| POST `/events/{eid}/memberships/{mid}/suspend` | Event moderator; reason + idempotency | 200 suspended; visibility/grants immediately denied |
| POST `/events/{eid}/memberships/{mid}/reinstate` | Event moderator; audit reason | 200 active if capacity available; consent reset, old grants not restored |

Planners distribute an organizer-provided generated bundle; they cannot retrieve secret credentials later. If durable staff download is required during discovery, design encrypted, step-up-protected retrieval explicitly rather than weakening the hash-only rule. All publish/rotation responses are no-store and must not be cached in telemetry.

Signed join intents expire within 10 minutes and bind event, credential ID/version and admission mode. Enrollment must revalidate that credential as currently active; rotation/cancellation invalidates outstanding intents immediately. Resolving a credential does not reserve a seat. Reference QR generation renders the real returned URL locally in the staff interface, with equivalent visible text; no third-party QR service receives event secrets.

## 4. Profile, taxonomy and discovery

| Method / path | Authorization and input | Output / behavior |
|---|---|---|
| GET `/taxonomies` | Signed in; version? | 200 interests, goal topics and public compatibility labels; ETag cache allowed for nonsensitive catalog |
| GET `/events/{eid}/profile` | Active self member | 200 own profile, private goals/style completion, versions, missing fields |
| PUT `/events/{eid}/profile` | Active self; ProfileInput + If-Match (initial create uses If-None-Match *) | 200/201 own profile; bump version, invalidate derived data |
| PUT `/events/{eid}/profile/interests` | Active self; 3–10 active IDs + If-Match profile version | 200 profile version; no duplicates or unsupported IDs |
| PUT `/events/{eid}/profile/goals` | Active self; 1–3 GoalInput + If-Match | 200 profile version, sanitized public summaries |
| GET `/assessment/instruments/current` | Signed in | 200 versioned questions, answer labels, privacy notice, no clinical claims |
| PUT `/events/{eid}/profile/style` | Active self; StyleInput + If-Match | 200 private completion state; store encrypted, recompute |
| POST `/events/{eid}/profile/style/skip` | Active self; If-Match | 200 resolved/skipped; no answers or matching penalty |
| DELETE `/events/{eid}/profile/style` | Active self; If-Match | 204 withdraw and erase answers, invalidate vectors if dependent |
| PUT `/events/{eid}/networking-consent` | Active self; enabled, policy_version + If-Match | 200; enabling requires complete required fields, disabling immediately hides |
| PUT `/events/{eid}/semantic-processing-consent` | Active self; granted, policy_version + If-Match | 200; withdrawal deletes vector, future matching taxonomy-only |
| GET `/events/{eid}/recommendations` | Eligible self, networking window open; limit<=5,cursor? | 200 eligible recommendations or empty list plus status; stale data filtered live |
| POST `/events/{eid}/recommendations/refresh` | Eligible self; idempotency, rate-limited (1/minute) | 202 job state; bounded compute dedupe; reads remain available |
| POST `/events/{eid}/recommendation-impressions` | Self; recommendation IDs, client_event_id | 202 deduped exposures belonging to viewer only |
| GET `/events/{eid}/profiles/{mid}` | Eligible same-event attendee with recommendation/request/connection relation | 200 public profile only; no browsable global directory |
| POST `/assets/uploads` | Active self; UploadRequest | 201 short-lived signed quarantine upload parameters |
| POST `/assets/{id}/complete` | Owner; checksum | 202 processing; asset cannot display until safe |
| GET `/assets/{id}/status` | Owner or authorized public-profile reader (ready projection only) | 200 ready/rejected/pending; authorized image delivery link when ready |
| DELETE `/assets/{id}` | Owner | 204; detach and purge with object lifecycle |

## 5. Connections, safety, notifications and analytics

| Method / path | Authorization and input | Output / behavior |
|---|---|---|
| POST `/events/{eid}/requests` | Eligible self; target_mid, recommendation_id?, intro?; idempotency | 201 pending; same/crossed pending pair 200 existing request requiring receiver decision; no auto-accept |
| GET `/events/{eid}/requests` | Self participant; direction/status/cursor | 200 own sent/received requests |
| POST `/events/{eid}/requests/{rid}/accept` | Receiver; If-Match + idempotency | 200 connection; single transaction and uniqueness |
| POST `/events/{eid}/requests/{rid}/decline` | Receiver; If-Match | 200 declined; pair cooldown applied |
| POST `/events/{eid}/requests/{rid}/withdraw` | Sender; If-Match | 200 withdrawn; cannot withdraw accepted request |
| GET `/events/{eid}/connections` | Self participant; pagination | 200 current own connections; blocked pairs omitted |
| GET `/events/{eid}/connections/{cid}` | Participant | 200 safe pair metadata and own grant state; no automatic contacts |
| POST `/events/{eid}/connections/{cid}/end` | Participant; explicit confirmation | 200 ended; revoke both grants, no future discovery of ended pair in MVP |
| PUT `/events/{eid}/connections/{cid}/contact-grant` | Participant + recent auth; ContactGrantInput + If-Match | 200 own grant status; peer sees availability only |
| DELETE `/events/{eid}/connections/{cid}/contact-grant` | Grant owner; If-Match | 204 immediate revoke; no-store; field contents never returned here |
| GET `/events/{eid}/connections/{cid}/contacts` | Participant; all live consent checks | 200 peer permitted selected fields if bilateral grants; 409 consent_not_ready otherwise; no-store |
| PUT `/events/{eid}/connections/{cid}/feedback` | Participant; FeedbackInput + If-Match | 200 own response until cutoff; never returns peer response |
| GET `/events/{eid}/connections/{cid}/feedback` | Author | 200 own response only |
| POST `/blocks` | Self; target membership reference + idempotency | 201 global user-pair block after relation validation; no global user search |
| DELETE `/blocks/{bid}` | Block owner | 204; does not restore connections or grants |
| GET `/blocks` | Self; pagination | 200 minimum own blocked identities for unblock only |
| POST `/events/{eid}/reports` | Active/self former participant with prior relationship; subject_mid, category, detail? | 201 private report receipt; rate-limited; optional block action explicit |
| GET `/events/{eid}/moderation/reports` | Assigned moderator | 200 minimum case queue and purpose-limited evidence |
| PATCH `/events/{eid}/moderation/reports/{rid}` | Assigned moderator; If-Match; state/resolution | 200 audited resolution; no deletion of evidence by subject |
| GET `/notifications` | Self; cursor | 200 inbox; destinations require normal authorization |
| POST `/notifications/{nid}/read` | Owner | 204 idempotent |
| PUT `/me/notification-preferences` | Self; allowed transactional reminder toggles | 200 preferences; mandatory security notices separately identified |
| POST `/events/{eid}/share-referrals` | Active self; idempotency | 201 attribution token, no additional admission privilege |
| GET `/events/{eid}/analytics` | Assigned planner/organizer; bounded date range, metric_version | 200 aggregates, counts, suppressed cells and watermark |
| POST `/events/{eid}/analytics/exports` | Assigned staff + step-up; allowed date range; idempotency | 202 aggregate export job |
| GET `/events/{eid}/analytics/exports/{xid}` | Same assigned staff, permissions rechecked | 200 status / short-lived authorized CSV download; no individual rows |

Direct requests may target only a currently authorized recommendation or an existing received-request relation; a guessed membership ID cannot enable directory scraping. This policy applies even if `recommendation_id` is omitted for an incoming-request response route. A server-rendered public profile is never evidence of ongoing permission.

For first creation of versioned singleton resources (profile, grant, feedback), use `If-None-Match: *`; later updates use the returned ETag with If-Match. A contact-grant response exposes its own grant version independently of the connection version. Private feedback is editable until its cutoff and remains unreadable by peers afterward. All date-window comparisons use database time, with opening inclusive and closing exclusive.

## 6. Transaction and event contracts

All business mutations commit database state plus outbox event in one transaction; HTTP response never waits on email/model provider. Consumers deduplicate `(consumer,event_id)` and validate aggregate version. Retry transient errors with bounded exponential backoff/jitter, quarantine permanent validation failures, alert aged dead letters. Domain event names include `event.published.v1`, `event.cancelled.v1`, `membership.admitted.v1`, `profile.changed.v1`, `consent.withdrawn.v1`, `request.created.v1`, `request.accepted.v1`, `contact.revoked.v1`, `user.erasure_requested.v1`. Payload: event ID, event/aggregate scope, actor pseudonym, version, occurred_at, correlation_id; load authorized current data when processing. Do not embed contact values, bios or style answers.

Accept transaction: lock request → verify receiver, pending, time window, account/member state and blocks → set accepted → insert unique connection → outbox notification → commit. Grant transaction locks connection plus both grant rows in canonical order; revoke/block uses compatible locking. Contact read uses a single consistent authorization+projection transaction; a read linearized before revocation can already have disclosed data, so UX cannot promise recall. Emails contain no contact data and link to an authenticated live state.

Performance and schema compatibility contracts are required in CI. Unknown fields are rejected on privileged writes and ignored only under documented forward-compatible response parsing on clients. Mobile clients may lag; additive API evolution supported for the defined minimum app version, destructive changes require `/v2` or a staged deprecation. No production database access from clients.
