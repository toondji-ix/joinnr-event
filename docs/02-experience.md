# 02 — Information architecture and UX blueprint

## 1. Experience direction

The [phase-three design review package](ux-design.md) adds an [interactive prototype](prototype/index.html), candidate tokens and review protocols. It is not a validated or approved design.

Mode: **Operate**. Attendees use a phone in a noisy venue, often with one hand and intermittent connectivity. The first screen should answer “Who could be useful to meet, and why?” Organizers need scanable tasks and credible measures.

Magician means revealing a useful connection the attendee might have missed. Explorer means agency: interests, intent and an invitation to discover. Express these through relevant evidence and human language, not stars, glowing brains, chat bubbles or a mystical compatibility percentage. Flat design carries structure; glass is limited to a small optional navigation treatment over a solid fallback. Match content is always opaque and readable.

Proposed visual system: warm off-white canvas, near-black ink, deep indigo for primary actions, restrained jade for confirmed states, amber for warnings, red for destructive actions. Use semantic tokens (`surface`, `text`, `action`, `focus`, `danger`) rather than raw color values in components. Validate final token contrast; these color names are direction, not certified contrast pairs. No gradients behind text or decorative AI avatars.

Use the Apple system font on Apple platforms. Web CSS uses `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`; Android uses its native system font. Do not redistribute SF Pro font binaries or promise identical SF Pro rendering on Windows/Android. Apple font distribution and license constraints require this platform-aware implementation. See [Apple fonts](https://developer.apple.com/fonts/) and [Apple font guidance](https://developer.apple.com/documentation/technologyoverviews/fonts). If identical typography everywhere is mandatory, obtain a suitable license or approve a different licensed family before UI implementation.

Proposed foundations: 4-unit spacing scale, 16–18 px body text, 1.5 body line height, restrained 8–12 px corner radii, no shadow except elevation needing explanation. Use 44×44 CSS px minimum action areas as a product target; this is stricter than WCAG's 24×24 minimum subject to exceptions. Web target is [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/); native uses equivalent outcomes plus platform semantics. Avoid claiming WCAG conformance from automated tooling alone.

## 2. Information architecture

```text
Public
  Event landing / join (safe preview)
  Manual join code
  Authentication / recovery / legal / accessibility help
Authenticated attendee
  My events / pending admission
  Event context
    Profile setup: identity → interests → goals → style → review
    Discover: shortlist → reason details → request
    Connections: received / sent / connected → contact consent → feedback
    Notifications
    Event profile / pause / leave / report
  Account: verified contacts / privacy / export / delete / sign out
Organizer workspace (responsive web)
  Organizations / event switcher
  Events: draft / published / closed / cancelled
  Event setup / preview / publish
  Access: link / QR / code / rotate
  Admission and membership status
  Analytics / aggregate export
  Staff invitations / event assignments
  Safety queue (only moderators)
Platform operations (separate restricted interface)
  Abuse escalation / audited support / deletion jobs / service health
```

Mobile attendee navigation: Discover, Connections, My event; notifications in header; account in event switcher. Organizer web navigation: Overview, Event details, Access, Attendees (admission statuses only), Analytics, Team. Role switching and event switching must be explicit and persistent. A planner cannot navigate into another client using guessed URLs.

## 3. Wireframe recommendations, in build order

Text below specifies hierarchy and behavior, not invented attendee content. Create annotated low-fidelity frames first, test comprehension, then final components at 390 px and 1440 px and narrow/reflow states.

### W-01: event access / authenticated return

```text
[Brand]                                      [Help]
[Event title]        [Conference category]
[Physical date + timezone] [Networking window]
[Organizer name] [Admission: shared / approval]
[Join this event]
Already have a code? [Enter code]
Privacy summary: You control visibility and contact sharing.
```

Show only published event metadata. Link/QR carries the same opaque access token; manual code is equivalent. Expired token shows generic “This access link is no longer available.” Never expose event membership. Deferred deep link returns to event join after authentication without requiring app installation. Camera permission denied routes to code entry.

### W-02: profile setup

```text
[Back]  Your event profile                    Step 2 of 5
[Visible to attendees / Private annotation]
[Interest search] [Selected interests, removable]
[Selection requirement and inline errors]
[Saved status]                               [Continue]
```

Steps: identity; interests; offer/seek goals; optional style; review/enable networking. Preview shows exactly what peers see. Use explicit “Skip style questions”; completion progress is not penalized by skipping. Do not precheck networking consent or contact sharing. Autosave distinguishes saving/saved/error. Step errors are inline and summarized for screen readers; preserve entered data.

### W-03: discovery — the principal product surface

```text
[Event switcher]                              [Notifications]
People worth meeting
[Networking enabled]                         [Edit goals]
------------------------------------------------------------
[Optional photo] [Name] [Role, optional organization]
You seek [topic]; they offer [topic].
Shared interest: [taxonomy label]
[View profile]                               [Connect]
------------------------------------------------------------
[Next recommended person: same evidence structure]
[Last updated time]                           [Refresh]
[Discover]              [Connections]          [My event]
```

Up to five recommendations per page; no swipe-only actions or addictive infinite feed. Cards lead with relevance, not score or seniority. Profile detail includes public interests, goal summary, voluntary background and reasons; style answers remain hidden. Connecting opens a confirmation sheet with optional short introduction and disclosure explanation. A received request appears as “Review request,” not a duplicate send button.

### W-04: connections and exchange

Received / Sent / Connected tabs expose counts accessibly. Received row: identity, reason, optional sanitized note, Accept / Decline. Acceptance opens a connected state, not contacts. “Choose what to share” selects verified email, optional phone/work URL. Display “Waiting for both of you to agree” until bilateral grants exist. Contact reveal includes “Stop sharing”; revocation clearly states downloaded details cannot be recalled. Decline is silent except sender status. Block/report available in overflow and keyboard accessible.

### W-05: feedback

Ask after acceptance with a delay, not immediately as proof of a meeting: “How relevant was this introduction?” with labeled 1–5 options and “Did it lead to a useful conversation or next step?” yes/no/not yet. “Not yet” leaves outcome null; it is not counted as no. Optional private note; visibility statement names platform improvement use. No public ratings or reputation scores.

### W-06: organizer setup and access

Desktop splits form and safe event preview; mobile stacks form then preview. Require valid dates/timezone and clear admission mode. Publish confirmation lists networking window, capacity and who can join. Access page prioritizes QR + readable link + code + download/copy actions. Rotating access has a destructive confirmation naming that previously printed QR codes will stop working. Staff invitation names organization, event and exact capabilities.

### W-07: analytics dashboard

```text
[Organization / Event] [Networking date range] [Data updated]
[Admitted] → [Complete profiles] → [Participating] → [Connected]
[Meaningful pairs] [Acceptance with denominator] [Satisfaction N]
[Daily activity line chart with accessible table]
[Goal categories: aggregated and suppressed as needed]
[Operational issues: pending approvals, matching delays]
[Export aggregate CSV]
```

No vanity “AI success” score. Each metric has definition, sample size, cutoff and freshness. Sparse data shows “Not enough data”; suppressed groups cannot be reconstructed through alternate filters. Planners see assigned events only. Export uses the same suppression policy as the screen.

## 4. State and accessibility specifications

| State | Expected presentation and recovery |
|---|---|
| Loading | Stable skeleton for profiles; accessible busy state; no invented names or scores |
| Empty | Explain low eligible pool; offer profile edit or check back; never fabricate attendees |
| Partial / stale | Last refresh time; hide locally cached contacts; revalidate all actions server-side |
| Network error | Preserve entered input, manual retry and clear unsent request state |
| Permission denied | Event-scoped safe message; event switch link; no leaked object metadata |
| Pending approval | Status and organizer support path; no discoverability or recommendations |
| Event cancelled/closed | Persistent status and allowed remaining actions; no misleading Connect action |
| Matching outage | “Suggestions based on your goals and interests”; valid taxonomy fallback |
| Blocked/removed | Generic unavailable profile; do not identify who blocked whom |
| Session expiry | Secure sign-in return; retain non-sensitive draft state only |

All flows: keyboard operation, visible focus not obscured by sticky navigation, semantic labels, status announcements, reduced motion, no color-only meaning, no drag-only control, accessible authentication supporting password managers/paste, 200% text and 400% reflow without content loss. Charts have table equivalents. At 320 CSS px, actions wrap without horizontal page scrolling. Native screens support large text and safe areas. Localize strings and timezone formatting from the start; MVP copy is English, additional languages deferred pending audience validation.

Motion is brief feedback (roughly 120–200 ms), reduced or disabled for reduced-motion preferences; no celebration implying a meaningful relationship merely on acceptance. Avoid dense glass overlays and translucent consent dialogs. Test tap accuracy and onboarding under poor venue connectivity.

## 5. UX validation before implementation

Recruit across all three roles, first-time and experienced attendees, and people with access needs. Proposed minimum: five attendee usability sessions and two organizer/planner sessions per initial round; these are qualitative sessions, not statistically representative research. Test code entry, identity return, skip assessment, reason comprehension, connection-versus-contact distinction, revocation and staff event switching. Exit: no unresolved task-blocking issue; at least 80% complete principal tasks without assistance in the tested sample. Record counts, not just percentages. The blueprint is not a tested visual design; finalized frames, tokens and usability evidence are phase-three deliverables.
