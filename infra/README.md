# Infrastructure boundary

The scaffold provides local PostgreSQL with pgvector through Docker Compose. It does not provision cloud resources or contain production credentials.

Run `pnpm setup:local` from the repository root to generate an ignored local environment file with a random database password. Then use `pnpm infra:up`, `pnpm infra:status`, and `pnpm infra:down`. The database binds only to localhost. Stopping containers preserves the named volume; the scaffold intentionally has no data-destruction shortcut.

The local container's bootstrap database user is for local setup, not the future production application runtime. Separate migration/runtime roles, RLS policies, migrations, TLS and recovery verification belong to EX-04. There are no business tables, seed attendees, cloud services or production-ready access controls in this local service.

Production Terraform is intentionally deferred until D-01, D-06, D-09 and D-15 are resolved. Do not create empty deployable modules, guessed account IDs, remote state buckets or fake successful cloud pipelines. The initial infrastructure PR must include approved region/account boundaries, cost estimate, IAM plan, encrypted locked state, backup/recovery design and reviewed Terraform plan.
