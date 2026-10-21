# 07 — Analytics, engineering operations, QA, risks and delivery

## 1. Analytics and reporting architecture

Business truth comes from transactional records and server domain events. Client events establish intent/exposure, not acceptance or contact consent. Client telemetry may be refused; core organizer operational metrics still derive from necessary service records, with a documented lawful basis and notice determined in discovery. No third-party advertising SDK or cross-app tracking in MVP.

Event envelope: UUID event ID, schema version, event name, organization/event scope (validated server-side), pseudonymous actor key, occurred_at, received_at, correlation ID and allowlisted properties. Client timestamps are untrusted; server receipt governs windows when clock drift is excessive. Deduplicate by event ID and producer; no free-text properties, bios, contact values, join tokens or style answers.

| Event | Producer / approved properties | Use |
|---|---|---|
| `admission_completed` | Server; membership state, access method enum, referral present | Enrollment funnel, referral attribution |
| `profile_step_completed` | Server; step enum, skipped boolean, profile version | Onboarding friction without answer contents |
| `networking_enabled` | Server; policy version | Eligibility and activation |
| `recommendation_viewed` | Client validated against viewer; recommendation/run ID, position, mode | Participation, exposure and experiment analysis |
| `request_created/delivered/accepted/declined` | Server; request ID, source enum, algorithm version? | Acceptance with correct denominator and latency |
| `contact_exchange_unlocked/revoked` | Server; connection ID, no field values | Consent funnel, not meaningful outcome proxy |
| `feedback_submitted` | Server; connection ID; rating/outcome only in restricted aggregate pipeline | Satisfaction/outcomes |
| `share_join_attributed` | Server; referral token reference, deduped membership | Referral counts, no network contact import |
| `event_cancelled/closed` | Server; reason code | Cohort eligibility and lifecycle |

Outbox → consumer → append-only allowlisted analytics records → hourly incremental rollup and daily full reconciliation → aggregate API. MVP uses PostgreSQL metrics tables with bounded queries and a separate low-concurrency worker; no warehouse or Kafka. Revisit a managed warehouse when reporting materially affects transactional latency or retention demands it. Refresh watermark within 15 minutes proposed; UI displays event-time range, ingestion lag, definitions and provisional status. Late events up to 7 days reprocess affected event/day; deduped reconciliation prevents count inflation. Keep metric version when definitions change; do not silently rewrite historical meaning.

Metric formulas are in document 01. Time-series storage uses UTC; user-facing date buckets use event timezone and account for DST. Maintain source facts to recalculate only within approved retention, then retain irreversible aggregates. Acceptance attributes to request-creation cohort, not merely date of acceptance. Same pair across events counts once per event; global unique-user reporting deduplicates account identities. DAU uses intentional actions, excludes background polls. Retention requires an eligible event opportunity; report eligible population, not broad “users lost” from ended conferences.

Privacy: dashboard minimum group size 10, no arbitrary combinable slices, no per-person drilldown. Suppress complementary totals where small-cell subtraction would reveal individuals; fixed approved goal-category cuts only. Feedback means require >=10 distinct respondents and show response rate. Overall event enrollment counts may be operationally visible to assigned staff, but do not enable linking feedback to individuals. Aggregate exports follow identical suppression, safe CSV escaping (including formula-prefix neutralization), bounded date ranges, audit trail and 15-minute download expiration with live permission recheck. A low-N event can show operational statuses while feedback/outcome metrics remain suppressed.

## 2. CI/CD strategy

Recommended repository layout (to create during implementation): `apps/web`, `apps/mobile`, `apps/api`, `apps/worker`, `packages/domain`, `packages/contracts`, `packages/tokens`, `infra`, `docs`, `tests`. One package manager and lockfile, task-aware build caching without sensitive outputs. Domain package contains pure logic only; do not share database entities or server secrets with mobile/web bundles.

Trunk-based workflow, short branches, reviewed PRs, protected main, no direct production commits. Required CI: formatting, strict TypeScript, lint, unit/integration/security invariants, OpenAPI compatibility, migration validation against supported PostgreSQL with pgvector, dependency/license/secret scan, container/IaC scan, web build and mobile compile checks. Focused PR end-to-end tests; full critical-journey suite on main and release candidate. Fail scans on confirmed exploitable high/critical; triage noisy results with evidence and expiry, never disable globally to obtain green.

Build once, generate SBOM and provenance, sign immutable container digest, promote identical artifact through staging and production. GitHub Actions authenticates cloud via OIDC scoped to repository/branch/environment; no persistent AWS keys. Pin external actions by reviewed commit. Use an IaC plan in PR, state lock and environment approval for production apply. No secrets in Terraform variables printed to output. Production deployment requires completed release checklist and designated release owner; an agent may prepare changes but must not infer deployment permission from this blueprint.

Deployment order: compatible schema expansion → API/worker supporting old and new clients → web → staged mobile distribution → verify telemetry → later contract cleanup. API rolling/canary deployment 5% →25% →100% with minimum observation under representative traffic. Rollback gates: auth/tenant safety failure immediately; otherwise error rate >1%, p95 latency >2× baseline for 5 minutes or queue-age budget exceeded. Route back to last healthy container, pause affected jobs/feature flag, preserve new data. Rollback is not `DROP COLUMN`. Database recovery requires incident procedure, not an automated down migration.

Mobile: separate development/staging/production identifiers and signing material, iOS TestFlight and Android internal/closed testing before public release; app-store metadata, privacy declarations and deletion path verified. Support current and previous supported OS versions selected from pilot devices at phase four; record exact matrix then. API compatible with at least current and previous two released mobile versions for a proposed 90-day window. Forced-update path only for severe security/unsupported protocol and tested offline behavior. OTA updates, if adopted, must obey store/platform rules and native-runtime compatibility; never bypass review for native permission changes. Feature flags default safe and have owner/expiry.

Release evidence includes commit/digests, schema version, app build IDs, infrastructure plan, contract version, algorithm/model version, test/security/accessibility results, dashboards and rollback command/runbook reviewed against actual deployment. No fabricated release evidence in an automated PR.

## 3. Monitoring and observability

Use OpenTelemetry traces/metrics with correlation IDs across API, worker and outbox; CloudWatch logs/alarms as the initial backend. Structured logs include action, safe scope reference, status, latency and error code; redact Authorization/Cookie headers, URL tokens, request bodies and private fields at source. Log sampling never affects audit records. No high-cardinality user IDs as metric labels. Crash reporting on web/mobile uses scrubbed breadcrumbs and opt-in where required.

| Signal | Proposed alert / action | Owner |
|---|---|---|
| Availability/error budget | 99.9% monthly SLO; page on 14.4× burn over both 5m/1h or 6× over 30m/6h; minimum-request guard plus synthetic checks | On-call engineer |
| API latency | p95 beyond NFR budgets 10m at meaningful traffic; inspect DB/dependency spans | On-call |
| Matching | Oldest active matching job >120 s for 5m; trigger fallback and inspect backlog | Backend/AI owner |
| Queue/outbox | Oldest undispatched critical event >60 s for 5m, DLQ nonzero, repeated poison event | On-call; no blind replay |
| DB | Connections >80% allocated budget, sustained CPU/IO pressure, storage <20%, locks/deadlocks | Platform owner |
| Identity | Abnormal invalid-token/login failures, staff MFA bypass attempt, JWKS failures | Security owner |
| Privacy/security | Any blocked/cross-event leak, contact after revoke, deletion SLA breach | Security incident immediately |
| Email | Bounce/complaint thresholds at provider safe limits; delivery lag; duplicate notice detection | Platform owner |
| Product | Sudden profile funnel drop, empty-match rate shift, acceptance/outcome cohort change | Product owner during staffed hours |
| Costs | 50/80/100% approved monthly B; embedding job cost anomaly | Engineering lead |

Synthetic checks in two locations cover public resolve with designated nonsecret test event, authenticated recommendation read with synthetic accounts in an isolated synthetic event, and request lifecycle without emailing real people. Label and exclude synthetic data from business metrics. Health checks do not create real connections.

Dashboards: operational health, event readiness, matching quality/cost, security/privacy jobs and product funnel. Runbooks: IdP outage, provider outage, email failure, DB failover/restore, compromised credential, tenant leak, abuse escalation, queue replay, bad migration and mobile rollback. Severity 1 means data exposure or core event networking unavailable; proposed staffed pilot response within 15 min. Production 24/7 SLO requires real on-call coverage and escalation, not an assumed available team. Incident communication owner and affected-party notice rules depend on jurisdiction review. Run a tabletop and restore exercise before pilot; postmortems record cause, impact and owned follow-ups.

## 4. QA and testing strategy

QA owns the release evidence matrix, engineers own tests with their changes, product owns acceptance, security owns threat findings, design owns manual accessibility and task verification. Independent review does not remove engineering ownership.

| Layer | Required tests and tooling class | Release evidence |
|---|---|---|
| Domain/unit | Goal direction fit, missing-feature normalization, consent/state machines, feedback cutoffs, timezone/window validation | Deterministic tests; aim for complete branches on eligibility/auth/transitions rather than vanity global coverage |
| Property/invariant | No self/cross-event/blocked recommendation; no contact without bilateral grants; never exceed capacity; unique pair/request | Randomized inputs and concurrent transactions |
| DB integration | Real PostgreSQL/pgvector, RLS per role, pooling context reset, composite FK failures, migration/backfill/recovery | Ephemeral DB logs and results; mocks cannot prove RLS |
| API contracts | Every operation auth/validation/success/error shape, pagination, idempotent retries, stale versions, compatibility with mobile N-2 | OpenAPI validation + consumer contract suite |
| Provider integration | Real staging IdP, verified email, MFA, refresh/logout, embedding payload/version, email delivery webhooks/signatures | Sandbox/staging evidence; deterministic mocks only for fault injection |
| UI/end-to-end | Browser Playwright-class suite; native Maestro/Detox-class suite + physical devices | Core journey videos/screenshots across role/device matrix |
| Accessibility | Automated axe-class checks plus keyboard/screen reader, large text/reflow/reduced motion, contrast, touch targets | WCAG checklist with manual results and unresolved issues |
| Security | SAST/SCA/secrets/IaC/image scans, authenticated DAST, IDOR/property tests, independent focused penetration test | ASVS applicability mapping, finding closure evidence |
| AI | Baseline/hybrid/style ablation, relevance labels, explanation correctness, optional-input cohorts and empty/outage cases | Versioned dataset and evaluation report |
| Performance | k6-class ramp/spike/soak with agreed envelope, event hot spot, join lock contention, queue/provider throttling | p50/p95/p99, DB locks, queue age, cost estimate |
| Reliability/privacy | Worker kill/retry, duplicate events, cancellation race, restore, deletion replay and export access expiry | Runbook drill results and measured RPO/RTO |

Critical release scenarios: QR/link/code join equivalence; deep link through cancelled login; two users competing for last seat; two simultaneous connection sends; accept versus block; revoke versus contact read; delete versus in-flight vector job; event closing versus request acceptance; staff revocation during export; mixed events on pooled DB connection; no assessment/no company/no photo; sparse pool; model/email failure; stale mobile app; invalid timezone/DST; cancellation notification dedupe; reinstate without restored consent.

Device/network matrix: iOS Safari, Android Chrome, current desktop Chrome/Edge/Safari and native iOS/Android on representative phones selected in discovery; small 320 px web width, large desktop, 200% text/400% web reflow; VoiceOver/TalkBack and desktop screen reader; normal network, constrained venue network, offline and reconnect. No mutation should appear delivered before server confirmation.

Proposed performance test: 10 events populated to realistic skew, one 5,000-member hot event, 1,000 concurrent active users, steady 200 read requests/s and 20 mutations/s for 30 minutes, 5× join spike for 60 s, 2-hour soak, model failure injected during peak. These are synthetic acceptance workloads, not demand forecasts. Tune to agreed phase-one envelope. Test data excludes real contacts. Restore production-like backup into isolated environment and block notifications/egress during drill.

Release blockers: any cross-tenant/contact leak, broken staff MFA, nonfunctional required mobile flow, unsafe match, unverified required integration, unmeasured capacity, data-loss recovery failure or task-blocking accessibility issue. Production requires zero unresolved severity 1/2 defects and documented lower-severity disposition. Do not substitute screenshots for functional/security tests or passing unit mocks for real integration evidence.

## 5. Risk register

L/I = likelihood/impact (low, medium, high), initial qualitative assessment awaiting discovery. Residual risks are accepted by named role before pilot.

| ID | Risk; initial L/I | Mitigation and detection | Owner / trigger |
|---|---|---|---|
| R-01 | Insufficient eligible pool; H/H | Pre-event onboarding, honest empty states, pilot enrollment checks | Product; <30 eligible members/pilot triggers facilitated research rather than efficacy claims |
| R-02 | Irrelevant/asymmetric matches; M/H | Explicit seek/offer, human labels, baseline comparison and reasons | AI lead; quality gate failure disables features |
| R-03 | Personality claims cause harm/bias; M/H | Voluntary style, no clinical claim, bounded weight/ablation | Product/AI; no evidence of benefit → weight off |
| R-04 | Cross-event or contact leak; M/H | RLS, DTO policies, bilateral grants, concurrency tests | Security; any finding blocks release |
| R-05 | Harassment, spam, senior-person overload; H/H | Rate limits, inbox cap, block/report, moderator staffing | Trust owner; abuse backlog or complaints rise |
| R-06 | Venue network fails; H/M | Small payloads, web fallback/manual codes, explicit retry | UX/engineering; poor device tests block pilot |
| R-07 | Peak join/matching overload; M/H | Capacity transaction, queues, bounded candidate sets, load test | Platform; NFR miss triggers capacity redesign |
| R-08 | Native store or deep-link delay; M/H | Accounts/signing early, internal builds, no forced install | Mobile lead; failed phase-five submission shifts launch gate |
| R-09 | Data location/retention invalid; M/H | Jurisdiction/provider terms gate, minimization, erasure evidence | Privacy owner; unresolved processing terms blocks production |
| R-10 | Shared code leaks into private conference; H/H | Approval mode for sensitive events, rotate, rate limits | Organizer/product; unauthorized admission incident |
| R-11 | Vendor outage or cost surge; M/M | Fallback, caps, circuit breaker, budget B | Platform; cost/latency alarm |
| R-12 | Analytics overstated by bias/nonresponse; H/M | Exact denominators, two-sided outcome distinction, cohort counts | Product/data; low response → no success claim |
| R-13 | Overlarge MVP/two client cost; H/H | Attendee-only native admin boundary, no chat/ticketing/payments | Delivery lead; milestone slip → rescope only with product decision |
| R-14 | SF Pro redistribution/licensing mismatch; M/M | System fonts and explicit platform fallback | Design lead; font bundle scan/review |
| R-15 | Restore resurrects deleted data; M/H | Deletion ledger, quarantined restore and purge before traffic | Privacy/platform; failed drill blocks release |
| R-16 | Unknown budget/team/region delays plan; H/H | Named gates, capability review and estimates after definition | Sponsor; phase-one exit unresolved |
| R-17 | No real on-call/moderation coverage; M/H | Staffed pilot window, escalation rota, incident exercises | Sponsor/operations; missing rota blocks launch |
| R-18 | Embeddings leak personal signals or optional consent harms ranking; M/H | Minimal payload, no sensitive inference, cohort evaluation, taxonomy alternative | AI/privacy; invalid terms or disparity disables semantics |
| R-19 | App clients lag backend changes; H/M | Additive contracts, N-2 support and staged deprecation | API/mobile; consumer-contract failure blocks deploy |

## 6. MVP delivery roadmap in execution order

Phase four is tracked in the [technical planning package](technical-planning.md): pure schedule validation/time-window assessment and tests are implemented; provider spikes, migrations, model evidence, costs and recovery approval remain open. Earlier phase exits are not waived.

Phase three is tracked in the [UX/UI design review package](ux-design.md). Prototype and specifications are prepared; remaining frames, participant testing, native evidence and approval are open.

Phase two is tracked in the [Product Definition package](product-definition.md): P0 traceability, lifecycle/consent review, metric review and ratification checklist. Artifacts are prepared; discovery evidence and policy approvals remain open.

Phase one is tracked in the [EX-01 discovery execution package](discovery-validation.md): research instruments, evidence synthesis, pilot assessments and decision/exit review. Instruments are prepared; discovery evidence and approvals remain open. The confirmed launch location is Lagos, Nigeria; no completed validation is claimed.

No delivery dates or staffing are established. The effort ranges below are planning estimates to re-estimate after discovery, not commitments. Proposed delivery capability: product lead, product designer/researcher, two backend/full-stack engineers, one mobile engineer, QA automation engineer, and fractional AI/security/platform support; roles may combine only if capability and review independence remain credible. A smaller team needs a longer schedule. Budget and named owners must be supplied before a committed plan.

| Phase / indicative duration | Objectives | Deliverables | Dependencies | Principal risks | Exit criteria |
|---|---|---|---|---|---|
| 1. Discovery & Validation / 1–2 weeks | Validate conference pain, admission model, data boundaries, willingness to onboard | Interviews/observations, pilot candidates, jurisdiction and age policy, volume envelope, business model hypothesis, team/budget constraints, decisions D-01–D-08 | Sponsor access to attendees/organizers and privacy input | Wrong problem, no pilot supply, undefined market | At least two pilot candidates; evidence-backed problem; launch geography/capacity/budget and owner roles decided or explicitly block next dependent work |
| 2. Product Definition / 1 week | Freeze MVP behavior and success measures | Ratified PRD/FRD, personas, scope, lifecycle/consent rules, prioritized stories, metric dictionary, risk owners | Phase-one evidence | Scope growth, misleading metrics | Every P0 has acceptance criteria; contact/style/retention/admission policy approved; no conflicting state definitions |
| 3. UX/UI Design / 2 weeks | Prove primary tasks mobile-first and accessible | IA, annotated wireframes, tested prototype, public/private profile preview, design tokens, native/web component specs | Stable scope and research participants | High friction, confusing consent, inaccessible glass | Core tasks meet UX criterion; no unresolved task blocker; font plan and accessibility test matrix recorded |
| 4. Architecture & Technical Planning / 1–2 weeks | Remove integration, capacity, security and cost uncertainty | ADRs, threat model, real provider spikes, regional model selection/evaluation, concrete SQL migrations/OpenAPI, IaC plan, cost B, backlog estimates, test strategy | Data/privacy rules, design flows, approved vendor access | Provider capability mismatch, cost overrun, unsafe model | Identity + native links spike passes; actual vector model pinned/evaluated; restore design and cost approved; API/data contracts checked; no architectural blocker |
| 5. Development / 6–8 weeks proposed | Deliver complete vertical slices across both clients | Working services, web/native flows, moderation/privacy, analytics, automated tests, staging builds, runbooks | Stable contracts, cloud/store accounts, test fixtures | Two-client divergence, hidden integrations, late QA | All F-01–F-18 implemented end-to-end with real staging integrations; required CI passes; no success stubs; feature evidence linked |
| 6. Testing & QA / 2 weeks | Verify safety, accessibility, quality and recovery at envelope | Release candidate, penetration/load/accessibility reports, AI evaluation, restore+deletion drill, incident exercise, defect closures | Feature-complete release candidate, staffed reviewers | Unsafe data leaks, insufficient load or label evidence | Release blockers zero; NFRs measured; no high/critical exploitable finding; store-ready builds; rollback and SLO runbooks exercised |
| 7. Pilot Launch / 2 weeks or event-dependent | Observe real conference use under staffed conditions | At least two pilots, monitored support, measured funnels/outcomes, structured feedback, revised decision log | Organizer enrollment, informed processing terms, on-call/moderation, stores/internal distribution ready | Sparse pool, network failure, sampling bias | Safety gates maintained; pilot metric criteria evaluated with counts; failures resolved/retested or explicit product no-go; operational readiness demonstrated |
| 8. Production Release / 1 week after gates | Roll out with bounded risk and accountable operations | Public native apps/web, production dashboards/alerts, support ownership, launch report and scheduled reviews | All launch gates, store approval, approved change window | Store delays, live capacity mismatch, missing support | Staged rollout stable under SLO; privacy/support channels tested; release evidence archived; named owner signs release and 7/30-day review scheduled |

Indicative sequential envelope: 16–20 weeks plus external approval/event-calendar delays. Some technical spikes and test automation can overlap upstream phases; scope/consent gates must not be bypassed. Re-estimate using actual team capacity and dependencies after phase four. Do not promise these ranges as a market launch date.

### Development slices and dependency order

1. Foundations: repository, CI, IaC staging, IdP/BFF/native auth, tenant policy, audit/outbox and contract test harness. Verify cross-event denial before feature breadth.
2. Event/admission: organization ownership, assignments/invitations, lifecycle, credentials, QR/manual join, capacity and pending approval on web/native.
3. Profile/privacy: taxonomy/goals, style skip/consent, public preview, verified contacts, export/deletion architecture.
4. Matching: baseline eligibility/reasons first, real embeddings behind flag, evaluation and fallback, discovery on both clients.
5. Connections/trust: requests/transitions, notifications, bilateral grants, revoke/block/report and moderation, feedback.
6. Organizer insights: reconciled metrics/suppression/export, event closure/retention jobs; complete erasure drills.
7. Hardening/release: stores, accessibility/security/load/recovery tests, staffed pilots and release evidence.

Each slice is deployable to staging with real integrations and bounded failures. Do not start all screens while authorization and domain contracts remain undecided. Parallel coding may follow ownership and dependency rules once the implementation team is assigned; this blueprint does not authorize automated deployment.

## 7. Future roadmap, separate from MVP

| Future phase | Enhancements | Evidence/dependencies before commitment |
|---|---|---|
| Conference expansion | Meeting scheduling, push reminders, chat, multi-language UX, agenda/ticketing integrations | Pilot evidence of missed conversations; moderation, delivery and integration cost |
| Organizer scale | Native organizer operations, SSO/SCIM, sponsor reporting under consent, enterprise tenancy, white label | Enterprise demand, data contracts, stronger tenancy/identity review |
| Matching refinement | Learned ranking, validated assessment options, group matching, conversation prompts | Sufficient consented outcomes, fairness evaluation, demonstrable baseline lift |
| Cross-event community | Persistent community profiles, cross-event recommendations, referral programs | Fresh explicit consent and revised lifecycle; no retroactive reuse of event profiles |
| New event types | Trade shows/expos outside conference definition; workshops/classes; community/faith events; festivals/concerts; sports; weddings/private social events; virtual/hybrid non-conference formats; any other non-conference category | Separate discovery, new intent/safety/admission model and metric validation for each; adult policy and use restrictions reviewed |
| Infrastructure scale | Multi-region active operation, warehouse, dedicated vector search, service extraction | Measured demand/SLO/cost trigger, migration and recovery tests |

No future feature can be sneaked into the P0 backlog to satisfy an ambiguous request. A scope change needs a changed PRD, acceptance criteria, risk review, cost and schedule impact.
