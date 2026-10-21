# Test strategy and current boundary

The repository has no implemented product behavior or product tests. The first foundation adds `contracts.test.mjs`, using Node's built-in test runner and strict Ajv to verify the three OpenAPI operation shapes, examples and negative cases. `pnpm contracts:check` also lints the specification and detects generated-type drift. These checks do not verify live authentication, tenant isolation or database behavior. Root checks verify formatting, TypeScript, linting, builds, workspace boundaries and local Markdown links. A green scaffold check does not validate the blueprint's business acceptance criteria.

As execution begins:

- Domain tests live alongside implemented domain behavior under `packages/domain`.
- PostgreSQL/RLS/transaction tests use a disposable real PostgreSQL database, never a mocked repository as evidence of tenant isolation.
- API and consumer contract tests accompany the first real OpenAPI operations.
- Web/native end-to-end suites begin with the identity/admission vertical slice.
- Security, accessibility, matching evaluations, load tests and recovery exercises follow the gates in `docs/07-delivery.md` and `docs/execution-plan.md`.

Do not use `--passWithNoTests` or add dummy assertions to imply product coverage. Select and add a test runner with the first behavior that needs testing; no unused test framework is installed in this scaffold.
