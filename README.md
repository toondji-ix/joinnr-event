# Joinnr — conference networking MVP blueprint

Blueprint prepared 15 October 2026. Workspace scaffold added 16 October 2026. First technical contract foundation added 19 October 2026. No product features or deployments.

Start with [the setup guide](docs/setup.md), then follow [the concrete execution plan](docs/execution-plan.md). The blueprint below remains the product design baseline.

Read and execute in this order:

1. [Product definition, PRD, FRD, personas, journeys and acceptance criteria](docs/01-product.md)
2. [Information architecture, UX blueprint and wireframes](docs/02-experience.md)
3. [Architecture, authorization, security and cloud design](docs/03-architecture.md)
4. [Database schema and ERD](docs/04-data.md)
5. [API specification](docs/05-api.md)
6. [AI matching design](docs/06-matching.md)
7. [Analytics, CI/CD, observability, QA, risks and delivery roadmap](docs/07-delivery.md)
8. [AI coding agent instructions](Agent.md)
9. [Sources, decision register and unresolved discovery gates](docs/08-decisions-and-sources.md)

The eight requested delivery phases are in document 07; each phase has objectives, deliverables, dependencies, risks and exit criteria. Requirement IDs in document 01 connect stories, services and release tests.

The active work is [phase-four Architecture & Technical Planning](docs/technical-planning.md): pure schedule rules and technical review plans are implemented; provider/database/cost evidence and phase exit remain open. Earlier [phase-three UX/UI Design](docs/ux-design.md): isolated prototype, candidate tokens and review protocols are prepared; remaining frames, real sessions and approval are open. Earlier [phase-two Product Definition](docs/product-definition.md): acceptance traceability and policy/measurement review are prepared, with ratification pending. The prerequisite [EX-01 Discovery & Validation](docs/discovery-validation.md) remains open. Research instruments and exit checks are prepared; real research, pilot confirmations and decision signoffs remain open. Lagos, Nigeria is the user-confirmed launch location, with privacy review still required.

## How to interpret this blueprint

The [20 October Phase 1–3 completion review](docs/phase-1-3-review.md) adds an ordered evidence checklist, concrete policy alternatives and the remaining low-fidelity frame specifications. Research, pilot confirmations, policy ratification, interactive follow-up frames and design validation remain open.

- **Required** means supplied by the product brief. **Proposed** means a concrete design recommendation, not a claim about existing users, budget, infrastructure or validated behavior.
- Numerical thresholds, retention periods, stack choices and staffing below are proposed acceptance baselines. Discovery must ratify or replace them in the decision register before implementation depends on them.
- Unknown business inputs are named gates with owners and consequences. There are no invented research findings, customer commitments, delivery dates or price quotations.
- MVP includes responsive web and installable iOS/Android apps. A PWA alone does not satisfy the mobile app requirement. Organizer/planner administration is responsive web; mobile apps cover the complete attendee flow.
- Conference-only scope is enforced in product rules, API validation and release tests. Other event types belong to the future roadmap.
- These are design specifications, not tested production code, database migrations, legal advice, or a claim of security certification. Implementation must supply and verify the real integrations and controls described here.

The repository contains four framework shells (Next.js web, Expo mobile, NestJS API and standalone worker), shared domain/tokens packages and a generated contracts package, repository checks and local PostgreSQL/pgvector configuration. There are no business API routes, product flows, migrations, matching jobs or provider integrations. Verification results and environment limitations are recorded in the setup guide. No cloud resources are provisioned.

The first technical foundation includes [three OpenAPI operation contracts](packages/contracts/openapi.yaml), generated shared types, contract checks and [a scoped authorization/data/threat review](docs/adr/0002-contract-foundation.md). These are specifications and tooling, not running API routes.

On 20 October 2026, [the request lifecycle extension](docs/adr/0004-request-lifecycle-contracts.md) adds four contracts for send/accept/decline/withdraw, bringing coverage to seven operations with generated types and strict schema checks. Runtime authorization, transactions and contact sharing remain unimplemented.

The [current Phase 4 disposition](docs/phase-4-status.md) tracks local verification work and externally deferred evidence. The [native PostgreSQL lab](docs/adr/0007-native-postgresql-verification.md) has passed isolation and logical restore/deletion-replay assertions on PostgreSQL 18.6. Docker is optional. No production migration, pgvector compatibility or external integration is claimed.

The [profile-selection and lab review](docs/adr/0006-profile-contract-and-lab-review.md) expands coverage to nine operations, adds duplicate-selection checks, removes the POST-only contract-test assumption and strengthens failed-transaction/deletion-replay assertions. Local SQL execution is now verified by ADR 0007; independent review and full application database integration remain open.
