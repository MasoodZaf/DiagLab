# Testing

Run all workspace tests:

```sh
npm test
```

Run API guardrail tests directly:

```sh
npm --workspace @lab/api test
```

## Current Coverage

The first executable acceptance suite covers clinical workflow rules that must not regress:

- invalid sample transitions are rejected without mutating the sample
- critical alerts block report release until acknowledged
- only pathologists can release reports
- acknowledged critical alerts allow release to cascade across report, order, result, and sample state
- result validation records the pathologist validator and audit stamp
- audit logs remain isolated by tenant snapshot
- notification templates render tenant-specific sender names, copy, variables, and missing-channel failures
- mobile sync accepts valid queued actions, prevents duplicate submissions, rejects malformed payloads, and flags workflow conflicts
- invoice payment confirmation updates paid status, rejects overpayment, and writes audit evidence
- released report amendment creates versioned history and blocks draft amendments

## Next Coverage Targets

- tenant isolation across auth, storage scope, and analytics scope
- Postgres repository integration against the Docker database
- patient booking, payment, status tracking, and report retrieval end-to-end
- phlebotomist native storage persistence and retry backoff
- notification delivery provider adapters and retry behavior
