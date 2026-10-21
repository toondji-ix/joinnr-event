# 01 — Product definition and executable requirements

Phase-two review is tracked in the [Product Definition package](product-definition.md). Acceptance coverage is prepared; policy approval, discovery evidence and ratification remain open.

## 1. Executive summary

Joinnr helps conference attendees identify a small number of relevant people, understand why a conversation could be useful, and exchange contact details with mutual consent. Its value is a useful conversation, not a large address book or an opaque compatibility score.

The MVP supports technology conferences, business conferences, startup summits and corporate networking conferences/events. An organizer creates and publishes an event, distributes access credentials, delegates operations to planners and reviews aggregate networking outcomes. Attendees join, authenticate, create an event profile, choose interests and goals, complete or skip a short interaction-style assessment, receive explainable recommendations, request connections, exchange selected contact details and report match quality.

A modular backend, relational database, asynchronous matching worker, responsive web client and native mobile client minimize integration overhead while preserving independent scaling of matching. Learned text embeddings improve discovery; deterministic eligibility and scoring rules control safety and explainability. No chatbot, autonomous outreach or LLM-generated compatibility claim is needed.

Proceed through discovery gates before committing spend or a launch date. The commercial model, legal region, pilot event size and validated willingness to complete onboarding are not supplied. The delivery plan defines measurable evidence needed to settle them.

## 2. PRD: problem, value and boundaries

### Problem statements and hypotheses to validate

| Person | Problem hypothesis | Product response | Evidence required |
|---|---|---|---|
| Attendee | Limited time and social uncertainty make introductions difficult | Small, explained shortlist and clear request action | Observed time to relevant person; interviews and pilot outcomes |
| Organizer | Attendance totals do not explain networking value | Participation, acceptance and self-reported meaningful outcomes | Organizer review and renewal intent; no fabricated ROI |
| Planner | Operational access and coordination are fragmented | Event-scoped delegation, safe access distribution, health view | Successful setup simulation without owner assistance |

The proposed north star is **unique mutual connections with at least one attendee-confirmed meaningful outcome per event**. Report two-sided confirmation separately; accepting a request alone is not a meaningful outcome.

### MVP boundary

| Included, P0 release requirement | Explicitly deferred |
|---|---|
| Four conference categories; one organization per event | Festivals, concerts, weddings, private parties, sports, religious/community gatherings, education classes, dating and other non-conference events |
| Responsive web plus iOS and Android attendee apps | Native organizer/planner authoring apps, desktop apps |
| Managed authentication, event-scoped membership and roles | Enterprise federation procurement, SCIM, white labeling |
| Event creation, publication, closure, cancellation, rotating link/QR/code | Ticketing, payments, badge printing, agenda management, venue maps |
| Profiles, curated interests, offer/seek goals, optional style assessment | CV ingestion, social scraping, psychometric diagnoses, inferred sensitive traits |
| Learned semantic retrieval plus rule-based ranking and reasons | Generative chat assistant, custom model training, behavioral personality prediction |
| Requests, acceptance/decline, blocks, reports, bilateral contact grants | Chat, video calls, meeting calendars, location tracking, automatic introductions |
| In-app notification inbox, transactional email | Push notifications, SMS and marketing automation |
| Aggregate organizer analytics, CSV aggregate export | Individual networking graphs for employers/sponsors, lead resale |
| Feedback, privacy controls, deletion/export, moderation tooling | Public social graph, cross-event discovery, public attendee directory |

Planner is a delegated operational role, not a separate tenant type. A person may be an attendee in one event and planner in another. Organizer authority does not automatically enroll its holder as an attendee.

### Product rules

1. Event access is not proof of physical attendance or a ticket. Pilot admission uses shared access or explicit organizer approval; ticket entitlement integration is future scope. Sensitive corporate events must use approval mode, not shared code alone.
2. Networking is event-scoped and opt-in. Membership can exist without a discoverable profile. Only active, eligible members see one another through recommendations.
3. Do not imply scientific personality prediction. The assessment records declared interaction preferences; its matching contribution is optional, bounded and experimentally evaluated.
4. Contact information is private by default. A connection and a contact grant are separate records and permissions. Each person controls their own disclosure.
5. No employer, planner or organizer sees individual assessment answers, private goals, private feedback text or contacts through analytics.
6. No paid boosts, popularity ranking or employment/investment eligibility decisions. Attendees choose whom to contact; the product does not select candidates for jobs or investment.
7. Profiles must be usable without company, photograph, assessment, LinkedIn or phone. Experience is declared and optional; missing experience does not reduce eligibility.
8. Proposed launch policy: adults only. Enforce declared age eligibility without collecting birth date. A different age policy requires safeguarding design before release.

### Proposed nonfunctional acceptance baseline

| ID | Target and measurement | Rationale / consequence |
|---|---|---|
| NFR-01 | WCAG 2.2 AA web; native VoiceOver/TalkBack, dynamic text and platform accessibility testing | Accessible onboarding and networking are release gates |
| NFR-02 | First production envelope: 5,000 enrolled/event, 1,000 concurrent active users total, 10 concurrent events | Load-test envelope, not forecast; larger commitments require new tests |
| NFR-03 | API p95 <500 ms reads, <800 ms writes excluding IdP/model; <1% unexpected 5xx at envelope | Measured in agreed region with representative dataset |
| NFR-04 | Existing recommendation page p95 <700 ms; profile-change recommendations ready within 120 s p95 | Asynchronous compute prevents model calls blocking API |
| NFR-05 | Web LCP <=2.5 s, INP <=200 ms, CLS <=0.1 at p75 on representative mobile connections | Production RUM plus prelaunch device tests |
| NFR-06 | 99.9% monthly app API availability; separate reporting for IdP, email and matching dependencies | Roughly 43 min/month budget; no maintenance exclusion |
| NFR-07 | Database recovery RPO <=5 min, service RTO <=60 min in regional failure exercises | Targets require restore measurements; Multi-AZ alone is not regional DR |
| NFR-08 | No unresolved exploitable critical/high security findings; all role/tenant isolation tests pass | Security release gate, documented risk exceptions only below high |
| NFR-09 | No contacts, raw assessment, bio or join secrets in logs/analytics | Privacy data minimization |
| NFR-10 | Core read flows support stale-data indication and retry; mutations require connectivity | No silent offline contact requests or stale disclosure |

## 3. Success metrics and decision rules

The following are proposed pilot thresholds, not industry benchmarks or validated forecasts. Use at least two pilots and report event-level counts, rates, confidence intervals and feedback nonresponse. Small samples can support learning, not statistical claims.

| Metric | Exact operational definition | Proposed pilot criterion |
|---|---|---|
| Meaningful connections | Unique accepted unordered event pairs with >=1 yes to “Did this connection lead to a useful conversation or next step?” by feedback cutoff (7 days after networking close) | >=0.5 per activated attendee; also publish pairs confirmed by both |
| Match acceptance | Accepted recommendation-origin requests / delivered recommendation-origin requests created during event networking window; measure acceptance through window close | >=35%; pending and withdrawn counts shown separately |
| Profile completion | Active memberships satisfying required profile fields and networking consent / admitted active memberships | >=70%; assessment skip counts as resolved step |
| Event participation | Unique admitted members with >=1 recommendation view or request action / admitted active memberships | >=60%; label as networking participation, not venue attendance |
| DAU/MAU | Distinct users performing an intentional product action in day / distinct users in rolling 30 days | Diagnostic, segmented by event window; no arbitrary target |
| Retention | D1/D7 active among activated users whose event is still open at that day; next-event activation among those invited to another event | Report eligible denominator and event-cycle bias; target after pilots |
| Referral count | Unique newly admitted users joining through an attributed share token, excluding self and duplicate memberships | Count and rate; no contacts imported |
| Satisfaction | Mean of 1–5 private match ratings per accepted connection, plus distribution and respondent count | >=4.0/5 with >=30% response; evaluate nonresponse bias |

Activated attendee = admitted active member with a complete required event profile, networking enabled and at least one recommendation view. North-star denominator excludes event staff who never enrolled as attendees. Report acquisition-to-activation too so activation filtering cannot hide onboarding failures. A zero denominator returns null/“Not enough data,” never 0%.

Pilot continue rule: safety gates pass, meaningful outcome and satisfaction criteria are met, and at least two organizers agree the measured outcomes are useful. If onboarding fails, reduce friction before improving ranking. If requests are accepted but outcomes remain low, investigate introductions and expectations. Do not optimize acceptance alone.

## 4. Personas and journeys

These are design personas awaiting interview validation; names represent roles, not research participants.

| Persona | Context and needs | Risks / accessibility needs | Key journey |
|---|---|---|---|
| First-time engineer | Technology conference; seeks peers and mentor; limited time | Social anxiety, screen reader, low bandwidth; no required photo | Scan QR → authenticated return to same event → three interests → mentor-seeking goal → optional style → explained match → request → exchange email → outcome |
| Startup founder | Startup summit; seeks customers/partners/investors and offers domain expertise | Excessive irrelevant sales requests; time pressure | Join link → set seek/offer goals → inspect reciprocal fit → accept selected requests → share work link only → rate |
| Experienced operator | Business conference; offers mentorship and seeks peers | Avoid seniority/popularity overload; can pause discovery | Code entry → state availability and experience preference → five recommendations → decline safely → pause networking |
| Organizer owner | Accountable for attendee value and data stewardship | Delegation mistakes, privacy concerns, inaccessible dashboard | Authenticate + MFA → organization → event draft → approve planner → preview → publish → distribute QR → assess aggregate outcomes → close |
| Agency planner | Manages multiple clients/events as delegated staff | Cross-client errors and accidental exports | Accept event-specific invitation → verify active event context → edit draft logistics → obtain approval → distribute access → monitor health/report queue |

### Journey checkpoints and recovery

| Stage | Expected outcome | Failure and recovery |
|---|---|---|
| Discover / access | Event identity and admission policy visible before sign-in | Invalid/expired credentials: safe generic response, manual code and organizer help path |
| Authenticate | Verified identity and preserved event intent | Cancel/retry keeps signed event-intent identifier, never trusts arbitrary return URL |
| Admission | Active or pending membership, no duplicates | Pending: explicit status; rejected/full/cancelled: reason category and support; auth is not admission |
| Onboard | Short resumable steps and clear public/private fields | Save each step; duplicate submits are idempotent; incomplete profile returns next required field |
| Match | Up to five eligible recommendations and fact-based reasons | Empty event: explain; model outage: taxonomy-based fallback; never cross event |
| Connect | Request state visible to both people | Duplicate/simultaneous requests converge; offline request remains unsent with retry |
| Exchange | Both parties explicitly select disclosed fields | Revocation removes future access; previously downloaded data cannot be recalled |
| Follow up | Private rating and useful-outcome response | Nonresponse is not a failed match; one reminder, opt-out respected |
| Leave / deletion | Discoverability off immediately; lifecycle explained | Pending deletion queue tracked; event departure does not silently delete global identity |

## 5. FRD and user stories with acceptance criteria

All F-01–F-18 are P0. Acceptance criteria are release-test inputs, including negative paths. Services and endpoints are detailed in documents 03–05.

| ID / story | Functional behavior and acceptance criteria | Verification |
|---|---|---|
| F-01 Identity: as a user I can sign in safely | Managed verified-email authentication; web/native redirect returns to original event; logout clears local credentials; expired/revoked identity denies writes; staff MFA enforced | Identity integration, CSRF and redirect tests |
| F-02 Organization: as an owner I can delegate | Create organization atomically with owner membership; verified-email event invitation single-use and expiring; planner sees assigned events only; last owner cannot be removed | Authorization matrix, invitation replay |
| F-03 Event: as an organizer I can publish | Require title, category enum, description, IANA timezone, UTC start/end, networking open/close, capacity and admission mode; valid chronological ranges; publish only complete draft; non-conference category rejected | Validation and lifecycle tests |
| F-04 Access: as staff I can share access | Publish generates link, QR encoding that link and 8-character code; rotation revokes all old access credentials; credentials expire at admission close; QR downloadable with text equivalent | Old-code rejection, QR decoding, accessible manual entry |
| F-05 Join: as an attendee I can enroll once | Link/QR/code resolves same event; authentication followed by admission transaction; shared mode admits within capacity; approval mode pending until staff decision; no matching before admission | Concurrent join/capacity and wrong-event tests |
| F-06 Profile: as an attendee I control my event identity | Required display name, role headline, 3–10 interests, 1–3 structured offer/seek goals, adult eligibility and consent; optional company/bio/experience/photo; private contact fields separate; autosave version conflict surfaced | Schema tests, resume and 412 stale-version recovery |
| F-07 Interests/goals: as an attendee I express intent | Curated versioned taxonomy; goals contain direction and topic; mentor seeking can match mentor offering; offer-only/no-compatible-candidate case remains valid | Taxonomy and complementary-goal tests |
| F-08 Assessment: as an attendee I can state style | Four voluntary preference questions, skip available at every step; no health/trait diagnosis; private answers; revoke deletes answers and recomputes; skipping never blocks recommendations | Privacy, skip and deletion tests |
| F-09 Matching: as an attendee I find relevant people | Up to five current event matches; displayed reasons correspond to shared fields or explicit reciprocal intent; no self, block, inactive, declined cooldown or connected pair; no guarantees of success | Eligibility invariants and ranking evaluation |
| F-10 Requests: as an attendee I decide connections | Send/accept/decline/withdraw with valid state transitions; optional 240-character introduction; acceptance creates one mutual connection; crossed requests require explicit acceptance rather than auto-accept | State-machine and concurrency tests |
| F-11 Contacts: as a connected attendee I exchange details | Two independent grants with selected ownership-verified email/phone or validated self-supplied HTTPS work URL; disclosure unlocks only when both grant >=1 field; revoke immediately prevents subsequent retrieval | Field-level auth and revoke race tests |
| F-12 Feedback: as an attendee I privately rate | Each participant may rate their accepted connection 1–5 and yes/no meaningful outcome, with <=500-character optional note; editable until feedback cutoff; peer and event staff cannot read private response | Scope, cutoff and aggregate tests |
| F-13 Safety: as an attendee I can block/report | Blocking immediately removes all pair visibility and contact access across events; report stored privately; event-scoped moderator can resolve reports with limited context; serious abuse escalated to operator | Cache invalidation, IDOR and moderation tests |
| F-14 Analytics: as staff I assess event value | Assigned event aggregates only; funnel/rates/denominators/freshness displayed; small groups suppressed; aggregate CSV formula-safe; no row-level contact/assessment export | Analytics reconciliation and isolation |
| F-15 Notifications: as a user I see actionable status | In-app inbox + transactional emails for request, acceptance, admission, event cancellation; duplicate delivery suppressed; email is generic with authenticated deep link; no unapproved outreach | Outbox retries, email sandbox and preference tests |
| F-16 Privacy: as a user I can control/erase data | Pause networking hides immediately; export/deletion available; reauthentication for contact changes/export/deletion; departure revokes event contacts; deletion verified across stores and derived data | Lifecycle and restored-backup erasure drill |
| F-17 Operations: as staff I can manage a live event | Planner edits logistics and manages admission; organizer publishes/cancels and delegates; moderator can suspend membership with audit reason; cancellation disables new requests and credentials | Role and cancellation race tests |
| F-18 Mobile: as an attendee I use either platform | Native iOS/Android supports entire attendee journey; verified universal/app links; web fallback without install requirement; manual code if camera denied; app-store privacy and deletion flows present | Real-device end-to-end release matrix |

### Event and membership state machines

Event: `draft → published → closed → archived`; `draft|published → cancelled → archived`. Closed means networking window ended, not necessarily the physical event. Published event can have networking opening in the future. Cancellation is explicit and irreversible; create another event rather than reopen. Time-based closure uses database time and is enforced at every mutation even if the scheduler is delayed.

Membership: `pending → active|rejected`; `active → left|suspended`; a rejoin after leaving creates/reactivates the same membership only while admission is open, resets consent, and never restores contact grants. Suspended requires moderator reinstatement; rejected may reapply only after explicit staff reset. Profile eligibility is computed, not a membership state.

Request: `pending → accepted|declined|withdrawn|expired`. Accepted is terminal for request; connection can subsequently end. Pending requests expire at networking close. Decline enforces a proposed seven-day pair cooldown within that event, bounded by event close. No decline reason is disclosed to sender.

### Event-window policy

Organizer sets admission opening/closing and networking opening/closing; networking may begin before conference start. Proposed default: networking opens 7 days before start and closes 7 days after end, with staff preview before publication. Product validates admission close <= networking close and networking open < networking close. Physical dates require start < end; networking close >= physical end. Public event metadata never contains attendee data.

After networking close: no recommendations, new requests or grants; existing unrevoked bilateral grants may be retrieved until event-data expiry, unless blocked, left or suspended. Feedback remains open through 7 days after networking close. Event-data expiry is proposed at 90 days after networking close; UI displays exact date. Cancellation immediately disables discovery/new actions; existing contact retrieval and feedback remain subject to consent and retention. Reassess this policy in discovery.
