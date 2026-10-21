# Phases 1–3: completion review

Bibliography follow-up, 21 October 2026: the user supplied eight source URLs. The [source verification](research/phase-1-source-verification.md) records retrieved primary studies, vendor/guidance limits, the survey-denominator correction and unresolved exact claims. Initial missing-source statements below describe intake history; they are superseded by that verification. Actual Joinnr interviews, pilot commitments and privacy approval remain missing.

Prepared 20 October 2026. Status: actionable review package; no phase exit or policy approval claimed. This supplements [discovery](discovery-validation.md), [product definition](product-definition.md) and [UX review](ux-design.md). [Document 08](08-decisions-and-sources.md) remains the authoritative decision register.

## Phase 1: collect evidence and decide feasibility

Update, 21 October 2026: [RB-01 reconciliation](research/phase-1-brief-assessment.md) completes brief intake, source-claim classification, expanded interview planning, two recruitment-profile assessments, capacity correction and budget/privacy gap mapping. Its citations have no bibliography, its pilot profiles identify no actual events, and its conditional privacy verdict has no attributable approval record. Primary research, organizer confirmations and discovery exit remain open; use the updated discovery package and decision register for the next evidence actions.

Confirmed 20 October 2026: the user owns product/research; Codex performs development work; no budget is assigned for this test product. Product/research ownership is resolved. Research handling, independent/privacy/design reviewers, actual evidence and pilot confirmations remain open. D-06 records the partial clarification; this does not close a phase or authorize spend.

Execute the existing interview and pilot-assessment instruments rather than creating another research round on paper. Research collection starts only after handling, access and retention are approved. Keep participant identities, raw notes and recordings outside Git in approved restricted storage.

| Action                                | Required input                                                                    | Completion evidence                                                                                  | Accountable role        |
| ------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------- |
| Assign research and review ownership  | Actual people, availability and independent reviewer                              | Named assignments and approved research handling reference                                           | Sponsor/product/privacy |
| Test the problem hypotheses           | Authorized attendee, organizer and planner access                                 | Deidentified synthesis with source references, contradictory findings and coverage gaps              | Research                |
| Confirm two distinct pilot candidates | Organizer access and actual confirmation                                          | Two reviewed candidate assessments including enrollment, dates, staffing and recruitment feasibility | Product/sponsor         |
| Establish delivery constraints        | Budget currency/period, team availability, sourced attendance/device expectations | D-02/D-06 review; separate assumptions from organizer estimates                                      | Sponsor/engineering     |
| Hold discovery disposition            | Evidence above and D-01–D-08 review                                               | Dated proceed/revise/stop decision with named reviewers and unresolved dependencies                  | Product/sponsor/privacy |

The research brief supplies unverified secondary claims and proposals; no primary research or actual pilot confirmation has been supplied. Lagos is confirmed; full countries-served scope and processing approval are still unknown. Missing evidence is not a negative research finding.

## Phase 2: concrete policy review agenda

The recommendations below are review candidates, not ratified policy. A general instruction to resolve tasks does not supply missing research, legal determinations or named owner signoffs. Record each selected option, alternative, rationale, evidence and downstream changes in document 08 before implementation.

| Decision               | Concrete proposal for review                                                                                                                          | Alternative / consequence                                                                                    | Evidence needed                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| D-03 audience          | Adult-only eligibility declaration; avoid collecting birth dates                                                                                      | Serving minors requires a separately reviewed safeguarding and consent design                                | Pilot audience and privacy review                                                            |
| D-04 admission         | Support shared and approval modes; make the selected mode visible before joining; pending members cannot discover people                              | A single mode narrows supported pilot operations and needs explicit scope review                             | Organizer walkthrough of private/public admission and leaked-code handling                   |
| D-05 contact retention | Expire event grants/references with event data; account contact values follow approved account retention and owner deletion                           | Deleting account values at one event expiry can break unrelated events; indefinite retention is unacceptable | Approved account/event retention rules and store-by-store deletion mapping                   |
| D-05 networking pause  | Hide discovery immediately; keep pause separate from explicit contact-grant revocation and show that distinction                                      | Revoking grants on pause changes existing sharing semantics and requires clear confirmation/reconsent        | Participant teach-back and product/privacy decision                                          |
| D-05/D-16 cancellation | Retain the original feedback cutoff for already accepted connections; display the exact cutoff; disable new connection actions                        | A cancellation-relative cutoff changes response opportunities and cohort comparability                       | Organizer expectations and measurement/privacy review                                        |
| D-11 style             | Keep style optional and skippable; do not finalize questionnaire content or enable ranking weight without review/evidence                             | Excluding optional style from design entirely would change the required MVP scope                            | Comprehension/harm review; later ablation evidence before ranking activation                 |
| D-12 typography        | Use Apple system typography on Apple devices and native/system fallbacks elsewhere; bundle no SF Pro binaries                                         | A uniform licensed family needs an explicit license and design decision                                      | Typography/device review; legal review if needed                                             |
| D-16 cohort rules      | Preserve admitted/activated cohort snapshots; disclose later departures, exclusions and feedback coverage without treating missing replies as failure | Recomputing denominators from current membership can distort historical rates                                | Product/data review of worked synthetic cases, suppression and privacy-safe historical facts |
| D-16 satisfaction      | Treat each participant response as one rating; show response count and eligible respondent denominator; keep one-/two-sided pair outcomes separate    | Averaging per pair first gives a different weighting; must be labelled if selected                           | Approved metric version and sampling plan                                                    |

D-14 phone scope remains a later decision; no phone verification is implied. Neither proposed retention periods nor pilot thresholds become approved through this review agenda. After decisions, reconcile PRD, lifecycle, API, data, UX and acceptance criteria together, including the remaining late-arrival and cancelled-cohort measurement rules.

## Phase 3: remaining annotated frames

These are low-fidelity specifications, not rendered screens or implemented prototype interactions. Apply the existing candidate component rules: persistent event context, labelled fields, explicit destructive confirmation, keyboard focus/error linkage, screen-reader status, large-text reflow and reduced motion. Native uses safe areas, scalable text and platform controls. All actions below require live server authorization in the future product.

### W-08: account privacy and verified contacts — F-11/F-16/F-18

Hierarchy: Account heading → verified contact fields → event privacy controls → export → delete account → sign out. Contact rows show field type, masked value, ownership status and change/remove action. HTTPS work URL is labelled self-supplied; phone remains conditional on D-14. Changing a field requires recent authentication and warns that old grants do not authorize its replacement.

Export review explains included data and authenticated expiring retrieval. States: recent-auth required, queued, processing, ready, expired and failed; queued is never labelled downloaded. Deletion review explains immediate access disable and subsequent purge, with timing left dependent on approved policy. Offline confirmation remains unsent; session expiry returns to reauthentication without pretending deletion succeeded. Native hides contacts when backgrounded and rechecks live grants before redisplay.

Review task: distinguish pausing, leaving, revoking a field and deleting an account. Verify no private contacts appear in profile preview, logs or organizer views. Pause copy stays conditional on D-05.

### W-09: notification inbox — F-15/F-18

Hierarchy: Inbox heading → event context/filter → unread status → generic notification rows → authenticated destination. Rows distinguish admission, request, acceptance and cancellation without contact values, private goals or assessment answers. A stale destination shows current authorization/state; a notification cannot restore expired access.

States: loading, empty, offline, retryable failure, expired session, removed destination and cancelled/closed event. Reading cached generic text does not imply a mutation was delivered. Announce updated status without moving focus unexpectedly. Native authenticated deep links preserve event intent and have a web fallback; actual link behavior requires integration evidence.

### W-10: report and moderation detail — F-13/F-17

Attendee hierarchy: person context → block action → report category → optional description → review → submit. Blocking and reporting are separate actions with separate results. Explain that blocking removes pair visibility/contact access across events; never imply a report alone blocks. Preserve an unsent report on network failure without claiming receipt. Confirm acknowledgement only after server response.

Moderator hierarchy: assigned event → authorized queue → report context → permitted action and reason → confirmation → audit acknowledgement. Do not expose contacts, raw style or unrelated private feedback. Suspension/reinstatement consequences are explicit; reinstatement does not restore old consent. Wrong-event, revoked-role and stale-version responses deny access and remove protected detail. Test attendee keyboard flow and staff scope changes mid-review.

### W-11: event authoring and staff — F-02–F-04/F-17

Hierarchy: organization/event context → draft identity/category → physical dates/timezone → admission/networking windows → capacity/admission mode → preview → publish review. Use explicit timezone and exact opening/closing instants. Show field-level errors plus linked summary for invalid chronology/category; preserve input on stale versions. Publishing is an organizer action; planners see only authorized logistics/admission controls. Draft save and publication are distinct confirmed operations.

Staff subframe: invitation status → role → event assignments → invitation review → revoke. Explain last-owner protection, expired/replayed invitation and immediate assignment revocation. Do not present disabled controls as the authorization boundary. Cancellation review explains irreversibility and disabled new actions; existing contacts/feedback remain policy-dependent. Test 390px and 1440px layouts and 320px/reflow before approval.

### W-12: approval admission queue — F-05/F-17/F-18

Attendee hierarchy: event summary → approval requirement → join review → pending status → support/leave. Pending means no discovery, recommendations or contact access. Retry cannot create a second application or reserve a seat. Show rejected/full/cancelled/suspended states with safe recovery and no attendee directory.

Staff hierarchy: assigned event → pending queue → minimal permitted application details → approve/deny review → confirmed result. Last-seat conflict explains that another admission used the seat; do not show approval before transaction success. Revoked assignments remove the queue. Test applicant and staff flows together, including duplicate attempts and capacity changes.

### W-13: complete private feedback — F-12/F-18

Hierarchy: accepted connection → exact feedback cutoff → meaningful outcome yes/no/not yet → relevance rating 1–5 → optional note up to 500 characters → review/save. Not yet is not a negative outcome. Explain that peers and event staff cannot read the private response; approved aggregates may use it. Show response status and editable-until timestamp without claiming submission offline.

States: no response, unsent draft, saving, confirmed, retryable error, expired session and cutoff reached. At cutoff, retain truthful unsent status and explain why editing is unavailable; never silently backdate. Announce validation errors and preserve text. Cancellation cutoff wording remains conditional on D-05/D-16. Test outcome comprehension separately from rating comprehension.

## Review execution and exit evidence

For each W-08–W-13 frame, the next design iteration must implement the interaction in the isolated prototype, inspect narrow/desktop/reflow states and record issue/retest references. Extend the existing moderated tasks with export/deletion comprehension, stale notifications, report versus block, staff invitation/revocation, approval/last-seat handling and full feedback. Use synthetic inputs only in the prototype. Real participant sessions require approved research handling.

| Phase | Repository work now prepared                                      | External or rendered evidence still required                                                                              |
| ----- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1     | Existing instruments plus ordered evidence/owner checklist        | Real research, two confirmed candidates, constraints, privacy review and disposition                                      |
| 2     | Existing P0 traceability plus concrete policy alternatives above  | Named policy/metric decisions, evidence-backed personas and PRD/FRD ratification                                          |
| 3     | Existing interactive slice plus remaining frame annotations above | Interactive follow-up frames, browser/device/manual accessibility evidence, participant testing, remediation and approval |

No phase is closed by this document. Continue independent specification work while input-dependent tasks wait; do not start gated identity, persistence or real personal-data processing on these proposals.
