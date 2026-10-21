# Phase three — UX/UI design review package

Prepared 19 October 2026. The request to proceed authorizes design work, not approval of open discovery or privacy decisions. This package implements an isolated prototype and review specifications for roadmap phase 3 / EX-03. It is **not a tested or approved design**. No participant findings, accessibility conformance or native app completion is claimed.

## Review artifact and boundaries

Open [the interactive prototype](prototype/index.html) in a browser from disk. It has no dependencies, external assets, network requests, persistence or production integration. Use made-up input only; reload/reset clears tab memory. The event, identities, credential and contact address are explicitly synthetic. The prototype does not implement authorization, verification, admission, matching, authentication or data storage. Production shells remain unchanged.

The visual direction follows [the experience blueprint](02-experience.md): flat warm canvas, opaque content, indigo actions, restrained green confirmations, system typography and generous separation. At desktop widths the task occupies two thirds of the composition; a distinct review rail holds simulation controls. At narrow widths the rail follows the task. The signature interaction is the explicit progression from request to connection to two independent grants; acceptance never reveals contact details.

## IA, frames and annotations

The [20 October completion review](phase-1-3-review.md#phase-3-remaining-annotated-frames) adds W-08–W-13 low-fidelity specifications for account privacy/contacts, notifications, report/moderation, event/staff authoring, approval admission and complete feedback. These annotations are prepared; their interactive prototype implementation and validation remain open.

The [blueprint IA](02-experience.md#2-information-architecture) remains authoritative. Prototype navigation exposes review entry points, not production access permissions. In production, event context is persistent and switching rechecks membership/assignment before loading content.

| Frame / requirements    | Prototype path                                                           | Annotation and review focus                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-01 / F-01, F-05, F-18 | Join event → code or simulated QR/link return → profile                  | Manual code DEMO26; generic invalid response; equivalent return destination. Actual camera, hosted login, deferred deep links and secure return intent need native/web integration. Pending members have no discovery access. |
| W-02 / F-06–08          | My profile → identity → interests → goals → style → review               | Required fields validated; optional private detail retained in tab; explicit skip; unchecked networking consent; public preview excludes private detail/style/contacts. Draft status is honest, with no false saved claim.    |
| W-03 / F-09–10          | Discover → request review → send → Connections                           | One synthetic explained recommendation, no score, no endless feed; confirmation explains disclosure; cancelled introduction remains a draft. Empty state never substitutes another event's pool.                              |
| W-04 / F-10–11, F-13    | Connections → accept → share + reviewer peer toggle → stop sharing/block | Received and sent sections remain distinct; unilateral grant hides contact; reveal only in ready scenario with both grants; stop sharing/block removes reveal. A reviewer toggle is not a proposed attendee capability.       |
| W-05 / F-15             | Connected → outcome controls                                             | Demonstrates yes/no/not-yet wording only. Relevance rating 1–5, optional private note, delivery delay and approved cutoff still require a subsequent design iteration.                                                        |
| W-06 / F-02–04, F-17    | Organizer → event selector / rotate review                               | Rotation warning is concrete. Event creation/date validation, staff invitations and approval queue remain wireframe requirements in document 02, not completed interactions.                                                  |
| W-07 / F-14             | Organizer → outcome table                                                | Empty/suppressed data only; no invented counts, charts, downloads or ROI. Future export must share suppression and permission checks.                                                                                         |

The prototype is a first testable design slice. Account privacy/export/delete, notifications, moderation/report detail, organizer authoring and full feedback forms remain follow-up frames before phase-three exit. This prevents breadth from being mistaken for completed feature design.

## Component and token proposal

[Candidate shared tokens](../packages/tokens/src/index.ts) are explicitly provisional, not a D-12 signoff. Do not adopt them in production until contrast, device and task review are recorded. Prototype CSS mirrors the named color values; subsequent component implementation must derive platform outputs from the shared source.

| Component                  | Web specification                                                                                                           | Native specification / required evidence                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Task shell / event context | Semantic header, main and navigation; 74rem max width; 24px desktop / 16px narrow gutters; single column at or below 48rem  | Safe-area shell; native event switch control; VoiceOver/TalkBack names include event context; prototype is not native evidence |
| Action                     | 44px minimum target, semantic button, visible 3px focus with 4px offset; clear primary, secondary and danger variants       | At least product-equivalent 44pt iOS / 48dp Android targets; native pressed/disabled/busy semantics and dynamic text           |
| Field / choice             | Persistent label, 48px input height; error announced and linked to field in final implementation; no placeholder-only label | Native labels/hints, keyboard return actions, native selection controls and accessible errors; preserve unsent input           |
| Person / reason            | Name, optional background, reciprocal goal fact and interest; public DTO only; no style answer or contact                   | Same content order, scalable text, no fixed-height truncation; no swipe-only actions                                           |
| Request review             | In-page focused task with explicit cancel/send; no send before confirmation                                                 | Native sheet or full-screen task; focus containment/restoration if modal; screen reader dismissal                              |
| Contact grant              | Separate connected/grant/reveal states; label verified versus self-supplied fields; explicit revoke warning                 | Hide cached contact on background/offline; live recheck on foreground before reveal; test with native lifecycle                |
| Status / analytics         | Live status announcement, textual empty/error states; semantic table, suppression text and freshness                        | Native accessibility announcements and table/list equivalent; no color-only status                                             |

Typography: web uses `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`; iOS uses platform text styles; Android native system typography. No SF Pro font binaries are supplied. Body baseline 16px/1.5, display fluid 32–56px/1.1, section heading 24px/1.25, minimum readable supporting copy 16px. Scale spacing from 4px; corners 8px controls / 12px grouped surfaces; no decorative glass or shadows. Motion only communicates state, with a 150ms color transition removed under reduced motion.

## State and policy review

The scenario selector covers loading, empty, offline, network error, permission denial, pending approval, closed/cancelled event, expired credential and expired session. Recovery returns to a ready _simulation_, not a successful real retry. Switching to these scenarios removes contact reveal. Offline/error keeps input in tab and makes no delivered claim. No protected data should be cached by the future clients.

Open dependencies stay in [document 08](08-decisions-and-sources.md): D-03 age policy, D-04 admission, D-05 notices/retention/pause and cancelled feedback, D-11 style assessment/content, D-12 fonts, D-13 devices and D-14 phone. No approved style questionnaire or consent notice exists; the prototype preference is illustrative. Approval mode needs a second admission test scenario before exit. Networking pause semantics cannot be finalized by copy alone. Do not convert these design examples into runtime policy.

## Moderated usability protocol

Recruit at least five attendees and two organizer/planners for the initial round, including first-time attendees, experienced attendees and people with access needs. These are proposed qualitative sample sizes, not completed sessions. Assign actual researcher/reviewer and approve research handling under EX-01 before collecting personal data. Do not record contacts, private goals or assessment responses in session logs. Use pseudonymous session IDs and approved storage/retention.

Give tasks without naming controls:

1. Join from a printed code after camera permission is unavailable; explain what admission proves. Repeat via link/QR and a cancelled sign-in return when integrations exist.
2. Make an event profile without company/photo/style, explain what peers can see, and enable networking intentionally.
3. Find why a suggested conversation might help; review/cancel then send a request. Explain whether contacts have been shared.
4. Accept the received request. Share one field, observe unilateral waiting, then simulate the other grant. Stop sharing and explain what previously copied details mean.
5. Recover from offline/error without assuming a request was delivered; identify pending/closed states and support route.
6. As staff, review rotation consequences and explain why suppressed outcomes cannot be exported or inspected per person. Event switching, full authoring and approval tasks follow when those frames exist; the event selector is an explicitly disabled specimen.

Record per task: session ID, role/access setup, frame version, unassisted success / assisted / failed, time, misunderstanding, severity, issue reference and retest. Report successful/attempted counts per task and role, then percentage; never pool away a failing task. Proposed exit is at least 80% unassisted on each principal task in the tested sample and zero unresolved task blockers. Withdrawals and unattempted tasks remain visible; no statistical efficacy claim follows from this sample.

## Accessibility and device matrix

| Test group        | Required checks                                                                                                                          | Current evidence                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Web layout        | 320, 390, 1440px; 200% text; 400% reflow; long name/error strings; no horizontal page overflow                                           | Pending rendered inspection                           |
| Keyboard          | Skip link, logical tab order, visible unobscured focus, task heading focus after navigation, field error focus, no trap                  | Pending manual review                                 |
| Screen readers    | Desktop reader + browser; iOS VoiceOver; Android TalkBack; labels, errors, statuses, headings, grant changes                             | Not run                                               |
| Contrast / motion | Every text/background pair, controls/focus, no color-only meaning; reduced motion                                                        | Token ratio check automated; manual review pending    |
| Native            | Dynamic Type / font scaling, safe areas, touch targets, system-browser return, camera-denied/manual fallback, foreground contact recheck | Not implemented or tested; D-13 device selection open |
| Network           | Offline draft recovery, no false delivered state, expired session and no cached contacts                                                 | Scenario design only; no real-network evidence        |

## Exit and handoff

Prepared: runnable isolated design prototype, IA/frame traceability, token proposal, component specs, state review, test protocol and evidence matrix. Still required: remaining annotated frames, stable scope/policy review, real participant sessions, issue remediation/retest, rendered accessibility and native evidence, named design/product reviewers and D-12 disposition. Phase 3 remains open until this evidence exists. Rollback removes the prototype and candidate token export; no data migration or deployment is involved.

## Local verification record ? 19 October 2026

`node --test tests/prototype.test.mjs`: 4/4 passed using an isolated document adapter; verifies simulated grant/revoke/block hiding, public-preview escaping/private-field exclusion, style skip, declined/pending request presentation and manual-code offline recovery. This does not prove browser behavior, authorization or native accessibility.

Candidate text colors were checked against both canvas and surface using sRGB relative luminance. Minimum ratios: text 14.86, muted 6.56, action 8.90, positive 6.56, danger 6.78, focus 5.46 (rounded values; no conformance claim). Rendered inspection could not run: the in-app browser was unavailable and the browser inventory was empty. No screenshot, participant result or native evidence exists.

`pnpm check` passed repository checks, formatting, lint, 16 contract tests, prototype checks and seven-workspace typechecking. After independent review, prototype-only fixes received focused regression, formatting, lint and repository checks. No native build or integration evidence is implied. The independent source review identified contact-status copy, inactive event switching and manual-code recovery issues; these were corrected. Field-level error linkage/focus and rendered/device review remain open accessibility gates.
