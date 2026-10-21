# ADR 0001: local workspace foundation

Date: 16 October 2026. Status: accepted for scaffolding by the user's setup request; provider/business decisions remain proposed.

## Context

The repository contained the MVP blueprint only. The current task authorizes project setup and an execution plan, explicitly excluding feature implementation. There is no Git repository or remote at scaffold inspection time. Docker is not installed in the inspected environment.

## Decision

Use pnpm workspaces for `apps/web`, `apps/mobile`, `apps/api`, `apps/worker` and `packages/domain`, `packages/contracts`, `packages/tokens`. Use the blueprint's Next.js, Expo and NestJS framework choices as a reversible local baseline. Root tooling provides strict TypeScript, ESLint, Prettier, boundary/document checks and repeatable framework builds. Minimal framework entry points exist only to prove the projects compile/boot; there are no product screens, APIs, jobs, schemas or integrations.

Use pnpm's workspace ordering and filtering directly. Do not add Turborepo until repeated build timings justify task caching; this avoids an extra configuration layer for seven small workspaces. Internal packages expose compiled JavaScript/types, and application build/typecheck commands build packages first. Client-safe packages cannot import server code or environment variables. Contracts and tokens contain no invented domain contracts or unapproved design values.

The worker is a standalone Nest application context with no HTTP listener and no queue consumer. The API boots with no routes and no credential integration. Web/native display one plainly labeled setup-only message, without navigation, profile forms or product logic. Authentication, tenancy and migrations are subsequent separately authorized work.

Local PostgreSQL uses a loopback-bound pgvector container, random ignored local password and persistent named volume. No application connects to it yet. No cloud provisioning, API keys or production environment values are needed. Infrastructure choices remain gated in D-09/D-15.

## Trade-offs and consequences

- Separate web/native UI entry points preserve platform boundaries but require separate build verification.
- No feature mocks means local pages do not demonstrate networking; this honors the setup-only scope.
- No ORM, validation library, AI SDK, cloud SDK or test runner is installed before a concrete implementation requires it. Their selection is recorded in the relevant execution ticket.
- No Git remote, CODEOWNERS identities, branch protection or deployment credentials are fabricated. Hosted CI activates only after repository creation/push and permissions are configured.
- Node/package-manager/framework pins and verification evidence belong in `docs/setup.md`; updates must preserve Expo's supported React/React Native matrix.

Use supported ESLint 10.12 with TypeScript and Next standalone plugin. The full Next preset pulls plugins that reject ESLint 10, while ESLint 9 is deprecated. Do not suppress peer checks to use that preset. Add compatible Hooks/accessibility rules with the first UI feature.

## Alternatives

Full generated starter templates add demo routes and dependencies outside scope. Bare directories cannot prove framework compatibility. A new Nx/Turborepo platform is unnecessary for this initial workspace. A fake cloud deployment or placeholder business API would give misleading readiness evidence.
