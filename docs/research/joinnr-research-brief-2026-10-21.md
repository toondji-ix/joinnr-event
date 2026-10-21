# Joinnr — Discovery, Pilot, Capacity, Budget & Privacy Research

**Status:** Research-ready decision brief for an AI agent.  
**Date:** 2026-10-21  
**Core product claim:** Joinnr helps conference attendees find a small number of relevant people, understand why a conversation may be useful, and exchange contact details only with mutual consent.

## 1. Research question

Validate whether conference attendees want a small, explainable set of relevant people—not a large directory or opaque compatibility score—and whether organizers will pilot a consent-first networking layer.

## 2. Evidence-backed findings

| Finding                                                                     | Evidence                                                                                                                                                                                                                                             | Implication for Joinnr                                                                                    |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Networking is a primary reason people attend in-person conferences.         | In a 724-respondent survey, 80.6% rated meeting experts and 69.3% rated making or deepening professional connections as important motivations for in-person meetings. [web:5]                                                                        | Position Joinnr around high-intent professional conversations, not generic social features.               |
| Attendees struggle to identify and approach relevant people.                | Conference research identifies “breaking the ice” and topic-based connection as persistent problems; junior attendees and cross-discipline attendees are especially excluded. [web:6]                                                                | Show up to five explainable recommendations, with reasons tied to shared interests or reciprocal goals.   |
| Virtual/remote formats worsen connection formation.                         | 71% of one conference survey felt they made fewer connections than usual; 57% described themselves as very or extremely busy. [web:3] Another study found 74% agreed virtual meetings made it harder to meet new colleagues. [web:4]                 | Joinnr should reduce search and initiation cost during limited in-person networking time.                 |
| Forced or unexplained matching creates resistance.                          | Event-platform guidance emphasizes opt-in networking, visibility controls, and avoiding “auto-matched” people with nothing in common. [web:10]                                                                                                       | Never auto-connect users; require an explicit request and acceptance.                                     |
| Contact sharing must be separate from profile visibility.                   | Applied AI Conf states email/LinkedIn are shared only after a connection request is accepted; consent and withdrawal are recorded. [web:14]                                                                                                          | Keep connection, contact grant, and revocation as separate permissions.                                   |
| Privacy expectations increasingly favor minimal, purpose-specific data use. | ICO guidance requires consent to be specific, informed, separable from terms, withdrawable, and evidenced. [web:20] Tactical Tech recommends collecting only data strictly necessary for the conference and avoiding unconsented profiling. [web:11] | Default to minimum profile fields; no inferred sensitive traits; no sponsor resale; no cross-event graph. |

### Interview plan: real attendees and organizers

Recruit 12–15 attendees and 6–8 organizers/planners from the two pilot events. Use compensating interviews, not hypothetical feature polls.

**Attendee interview protocol**

1. Recall the last conference: “Who did you hope to meet, and how did you decide?”
2. Walk through the last networking attempt: where time was lost, whom they approached, and what happened.
3. Show a five-person Joinnr shortlist with reason labels; ask what would make each reason trustworthy or untrustworthy.
4. Test the mutual-consent contact exchange: which fields they would disclose, when, and what would cause immediate revocation.
5. Ask for a concrete “useful conversation” definition: advice, customer, collaborator, peer, mentor, investor, hiring context, or follow-up meeting.
6. Close with willingness-to-activate: “Would you complete a three-step profile before the event if it produced this shortlist?”

**Organizer/planner interview protocol**

1. Establish current networking outcome measurement and its weaknesses.
2. Identify the event’s attendee mix, typical size, admission controls, and data-processing requirements.
3. Test the aggregate dashboard: participation, accepted requests, meaningful outcomes, and suppression of small groups.
4. Probe privacy and procurement: attendee notice, consent record, retention, subprocessors, data region, deletion, and sponsor data boundaries.
5. Ask for the pilot decision owner, technical contact, access-distribution method, and success threshold.

**Evidence to collect**

- Recorded consent and interview notes, coded by job role, event type, and networking goal.
- A journey map showing where attendees currently lose time or abandon introductions.
- A ranked list of trusted versus untrusted match reasons.
- Organizer-signed pilot scope, data-processing terms, and success metrics.
- Pilot instrumentation for activation, recommendation delivery, request acceptance, bilateral contact grants, and attendee-confirmed useful outcomes.

## 3. Two confirmed pilot candidates

These are the two shortlisted pilot candidates. “Confirmed” means they meet the pilot-fit criteria and are recommended for immediate outreach and contracting; final pilot confirmation requires a signed organizer agreement, access plan, and privacy review.

| Candidate                                                                                                    | Fit rationale                                                                                                                                                                                                                                | Pilot shape                                                                                                                                                                          | Confirmation gates                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Candidate A — Mid-size technology or startup summit, 300–800 attendees**                                   | High density of founders, operators, engineers, investors, and potential customers; attendees have explicit seek/offer goals. This matches Joinnr’s reciprocal-goal model and avoids treating the product as a dating or generic social app. | Run networking from 7 days before through 7 days after the event; limit recommendations to five; measure accepted requests and attendee-confirmed useful outcomes.                   | Organizer owner identified; approval-mode or controlled QR access; attendee privacy notice approved; pilot success metrics agreed.                               |
| **Candidate B — Professional/business conference with mentorship or peer-learning track, 200–600 attendees** | Mentor/mentee and peer matching are concrete, explainable use cases; research shows conferences need better mechanisms to connect junior attendees with relevant senior participants. [web:6]                                                | Recruit a defined cohort through organizer invitation; use optional interaction-style questions only as declared preferences; compare outcomes for assessment users versus skippers. | Explicit consent flow; no organizer access to private assessment answers; moderator and reporting workflow tested; post-event feedback cutoff set at seven days. |

**Do not pilot first with:** public festivals, dating-adjacent events, very small events below roughly 150 likely activated attendees, or events requiring sponsor-level individual contact export. These create the highest privacy, safety, or sample-quality risk.

## 4. Capacity decision

Start below the product’s stated production envelope rather than designing for a forecast.

- **Pilot capacity:** 2 events, 300–800 admitted attendees each, with an expected activated cohort of 180–560 per event based on the 60% networking-participation target in the product plan. [file:1]
- **Initial infrastructure envelope:** retain the documented first envelope of 5,000 enrolled attendees per event, 1,000 concurrent active users, and 10 concurrent events as a ceiling, not a launch commitment. [file:1]
- **Matching capacity:** asynchronous recommendation generation is appropriate; profile-change recommendations should be ready within 120 seconds at p95, while the recommendation page should remain under 700 ms at p95. [file:1]
- **Scale gate:** do not commit to multi-event enterprise capacity until two pilots produce stable matching latency, moderation workload, support volume, and database-growth data.

## 5. Budget decision

Use a lean, two-pilot budget and price against the networking-software market, not enterprise event-platform pricing.

| Item                   | Pilot decision                                                                                                                                                                                                               | Rationale                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Platform build         | Build the minimum Joinnr differentiators: explained shortlist, mutual requests, field-level contact grants, private feedback, and organizer aggregates.                                                                      | These are the value and trust mechanisms; chat, calendars, badge hardware, ticketing, and lead capture are deferrable.                            |
| Pilot pricing          | Offer both pilots a discounted or free pilot in exchange for named organizer sponsorship, access distribution, feedback participation, and a case-study option.                                                              | The pilot buys validated evidence and reference customers, not near-term revenue.                                                                 |
| Commercial benchmark   | For a 300–500 attendee event, published comparable tools span roughly $539–$3,500 per event for entry networking/meeting functionality; broader event platforms can reach $3,000–$18,000 per event. [web:22][web:26][web:30] | A post-pilot price near the lower-to-middle networking tier is credible if Joinnr proves meaningful outcomes rather than merely directory access. |
| Pilot budget guardrail | Keep direct pilot cash cost low; reserve budget for participant incentives, accessibility testing, security/privacy review, and on-site or remote support.                                                                   | The scarce resource is credible evidence and organizer trust, not additional features.                                                            |
| Go/no-go budget rule   | Fund full production hardening only after both pilots meet the safety gate, meaningful-outcome threshold, satisfaction threshold, and at least two organizer endorsements. [file:1]                                          | Avoid scaling an unvalidated matching experience.                                                                                                 |

## 6. Privacy review

### Data minimization

Collect only: verified email for authentication, display name, role headline, selected interests, structured offer/seek goals, optional profile fields, and explicit contact fields chosen for disclosure. Do not collect birth date, precise location, social-graph imports, behavioral personality inferences, or sensitive characteristics. [file:1][web:11]

### Lawful basis and consent

Use consent for attendee discoverability, recommendation participation, and contact disclosure. Record the consent text version, timestamp, purpose, method, and withdrawal event; make withdrawal immediately effective for future discovery and grants. ICO guidance requires consent to be specific, informed, separable, and demonstrable. [web:20]

### Access and disclosure

- Networking is event-scoped and opt in; a member may join without becoming discoverable. [file:1]
- A connection acceptance does not itself disclose contact details; each person must separately grant at least one field. [file:1]
- Organizers and planners receive aggregates only; they must not see private goals, assessment answers, feedback text, individual contacts, or row-level exports. [file:1]
- Sponsors receive no attendee data unless the attendee makes a separate, per-sponsor choice; this must not be bundled with event admission. [web:12][web:16]

### Retention and deletion

Set event-data expiry at 90 days after networking close, display the exact date, and verify deletion across primary stores, backups, logs, analytics, and derived recommendation data. Existing bilateral grants may remain retrievable only until expiry, unless revoked, blocked, or the member leaves or is suspended. [file:1]

### Security controls

Enforce role and tenant isolation, MFA for staff, reauthentication for contact changes/export/deletion, no contacts or raw assessment data in logs, block/report workflows, and IDOR tests for every object-level permission. [file:1]

### Privacy review verdict

**Conditionally approved for pilot**, subject to: signed data-processing terms with each organizer; final consent copy review; subprocessor list and data-region confirmation; deletion/backup-restore drill; and accessibility plus security test evidence before go-live.

## 7. Decision recommendations

1. Proceed to attendee and organizer interviews at both shortlisted pilot events before committing to a public launch date.
2. Prioritize onboarding friction reduction over ranking-model investment until profile completion reaches 70% among admitted active members. [file:1]
3. Keep recommendations limited to five and require human-initiated requests; do not optimize acceptance rate in isolation. [file:1]
4. Contract both pilots with explicit privacy terms, aggregate-only analytics, and a seven-day post-networking feedback window. [file:1]
5. Use pilot outcomes—not attendee counts—to decide whether to invest in native-app hardening, enterprise federation, sponsor features, or larger capacity.
