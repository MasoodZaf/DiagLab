# Database Foundation

The application now has a Postgres-ready schema under `infra/postgres`.

## Local Postgres

Start the database:

```sh
docker compose -f infra/postgres/docker-compose.yml up -d
```

Default connection values:

```sh
DATABASE_URL=postgres://ai_lab:ai_lab_password@127.0.0.1:5432/ai_lab
```

The container applies:

- `001_init.sql`: tenant-scoped tables, constraints, indexes, and audit log table
- `002_seed_demo.sql`: Lumen demo tenant records matching the current workflow demo
- `003_report_amendments.sql`: versioned amendment history table for released-report corrections

## Repository Boundary

The API includes `LabWorkflowRepository`, which matches the current `TenantSnapshot` contract. `PostgresLabWorkflowRepository` supports:

- tenant snapshot reads
- registration, appointment, order, sample, and invoice bundle creation
- sample transitions with role and state-machine guards
- result validation with role and state-machine guards
- critical alert acknowledgment
- report draft creation and release guardrails
- released-report amendment history
- audit log writes for result-affecting workflow mutations

Use the in-memory demo store by default. Switch the Nest API to Postgres-backed workflow storage with:

```sh
WORKFLOW_REPOSITORY_MODE=postgres
DATABASE_URL=postgres://ai_lab:ai_lab_password@127.0.0.1:5432/ai_lab
```

The Next app still uses the JSON-backed workflow store for the local browser demo until the web routes are pointed at the Nest API.
