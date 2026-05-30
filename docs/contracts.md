# Platform Contracts

## Tenant config

Tenant configuration must cover:

- brand metadata
- domains
- locale and timezone defaults
- theme tokens
- report templates
- communication templates
- feature flags
- policy rules

## Mobile sync contract

- local queue of offline actions
- idempotent client action IDs
- retry with exponential backoff
- server reconciliation response including accepted, rejected, and conflict states
- timestamped sync ledger for auditability

The API accepts `POST /api/mobile-sync/reconcile` with a device ID, tenant ID, and queued actions. Current action types are:

- sample transition
- signature capture
- GPS checkpoint

Reconciliation responses separate accepted, rejected, conflict, and duplicate actions so the mobile app can safely retry without double-submitting collection evidence.

## Notification contract

Notification delivery is tenant-configured but workflow-owned. The shared contract supports these channels:

- email
- SMS
- WhatsApp
- push
- in-app

Template keys are:

- appointment booked
- sample collected
- payment received
- report released
- critical follow-up

Tenant configuration owns sender names, body copy, subject lines, and CTA labels. Product workflow rules still decide when a notification may be sent; for example, report-release messages require a released report and do not bypass OTP or pathologist approval rules.

## Billing contract

Invoice payment confirmation is workflow-owned and tenant-scoped:

- patient, receptionist, and super admin actors may record payment
- payment amount must be greater than zero
- overpayment is rejected
- invoice status moves to partially paid or paid from the cumulative paid amount
- payment confirmation writes audit evidence before notifications are sent
- tenant policy decides whether orders may proceed with unpaid or partially paid invoices

## Report amendment contract

Released reports are never silently overwritten:

- only pathologist and super admin actors may amend reports
- draft reports cannot be amended
- an amendment note is mandatory
- report status moves to amended
- each amendment creates an immutable report amendment history entry with version, note, actor, and timestamp
- the latest note is copied to the report for quick display, while full history remains in `TenantSnapshot.reportAmendments`
- every amendment writes audit evidence

## Audit contract

Every result-affecting workflow mutation must produce a tenant-scoped audit entry with:

- actor name and role
- entity type and ID
- action name
- before and after state snapshots when available
- immutable creation timestamp

Audit logs are returned in `TenantSnapshot.auditLogs` for admin visibility and test assertions. Tenant A audit events must never appear in Tenant B snapshots.

## AI safety contract

Allowed:

- draft summaries
- patient-friendly explanations
- operational predictions
- anomaly highlighting

Forbidden:

- autonomous clinical release
- hidden report modifications
- silent deletion of audit events
- model-only decisions on critical escalations
