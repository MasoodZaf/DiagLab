/**
 * Seeds Postgres from the @lab/demo-data fixtures — the exact data the UI
 * already renders, for every tenant. Keeping the seed sourced from the shared
 * fixtures (rather than a hand-maintained SQL file) means the database can never
 * drift from what the demo expects. Every insert is idempotent (ON CONFLICT DO
 * NOTHING), so re-running is safe.
 */
import type { PoolClient } from "pg";
import {
  sessionActors,
  tenantOrgs,
  tenantSnapshots
} from "@lab/demo-data";
import { tenantPresets } from "@lab/branding";

/** True when the database has no tenants yet — i.e. needs a first seed. */
export async function isEmpty(client: PoolClient): Promise<boolean> {
  const result = await client.query<{ count: string }>("SELECT count(*) FROM tenants");
  return Number(result.rows[0]?.count ?? 0) === 0;
}

/** Insert the full demo dataset for every preset tenant. */
export async function seedFromFixtures(client: PoolClient): Promise<void> {
  for (const tenant of Object.values(tenantPresets)) {
    await client.query(
      `INSERT INTO tenants (id, slug, brand_name, locale, timezone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [tenant.id, tenant.slug, tenant.brandName, tenant.locale, tenant.timezone]
    );

    for (const actor of sessionActors[tenant.id] ?? []) {
      await client.query(
        `INSERT INTO staff_users (id, tenant_id, role, display_name, branch_name, capabilities)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [actor.id, tenant.id, actor.role, actor.displayName, actor.branchName ?? null, JSON.stringify(actor.capabilities)]
      );
    }

    const org = tenantOrgs[tenant.id];
    if (org) {
      for (const outlet of org.outlets) {
        await client.query(
          `INSERT INTO outlets (id, tenant_id, name, city, type, address, phone, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [outlet.id, tenant.id, outlet.name, outlet.city, outlet.type, outlet.address ?? null, outlet.phone ?? null, outlet.active]
        );
      }
      for (const doctor of org.doctors) {
        await client.query(
          `INSERT INTO panel_doctors (id, tenant_id, name, specialty, qualification, outlet_ids, status)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
           ON CONFLICT (id) DO NOTHING`,
          [doctor.id, tenant.id, doctor.name, doctor.specialty, doctor.qualification, JSON.stringify(doctor.outletIds), doctor.status]
        );
      }
      for (const member of org.staff) {
        await client.query(
          `INSERT INTO staff (id, tenant_id, name, role, outlet_id, phone, status, email, login_enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [member.id, tenant.id, member.name, member.role, member.outletId, member.phone ?? null, member.status, member.email ?? null, member.loginEnabled ?? false]
        );
      }
    }

    const snapshot = tenantSnapshots[tenant.id];
    if (!snapshot) continue;

    for (const p of snapshot.patients) {
      await client.query(
        `INSERT INTO patients (id, tenant_id, mrn, full_name, phone, national_id, date_of_birth, sex, consented_at, created_at, updated_at, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO NOTHING`,
        [p.id, tenant.id, p.mrn, p.fullName, p.phone, p.nationalId, p.dateOfBirth, p.sex, p.consentedAt, p.createdAt, p.updatedAt, p.createdBy, p.updatedBy]
      );
    }
    for (const a of snapshot.appointments) {
      await client.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, status, channel, scheduled_at, branch_name, created_at, updated_at, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
        [a.id, tenant.id, a.patientId, a.status, a.channel, a.scheduledAt, a.branchName, a.createdAt, a.updatedAt, a.createdBy, a.updatedBy]
      );
    }
    for (const o of snapshot.orders) {
      await client.query(
        `INSERT INTO lab_orders (id, tenant_id, patient_id, appointment_id, order_number, tests, status, branch_name, home_collection, created_at, updated_at, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO NOTHING`,
        [o.id, tenant.id, o.patientId, o.appointmentId, o.orderNumber, JSON.stringify(o.tests), o.status, o.branchName, o.homeCollection, o.createdAt, o.updatedAt, o.createdBy, o.updatedBy]
      );
    }
    for (const s of snapshot.samples) {
      await client.query(
        `INSERT INTO samples (id, tenant_id, order_id, barcode, specimen, status, collected_at, last_checkpoint, created_at, updated_at, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
        [s.id, tenant.id, s.orderId, s.barcode, s.specimen, s.status, s.collectedAt ?? null, s.lastCheckpoint, s.createdAt, s.updatedAt, s.createdBy, s.updatedBy]
      );
    }
    for (const r of snapshot.results) {
      await client.query(
        `INSERT INTO results (id, tenant_id, order_id, sample_id, test_name, status, value, reference_range, abnormal, critical, validator_name, created_at, updated_at, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (id) DO NOTHING`,
        [r.id, tenant.id, r.orderId, r.sampleId, r.testName, r.status, r.value, r.referenceRange, r.abnormal, r.critical, r.validatorName ?? null, r.createdAt, r.updatedAt, r.createdBy, r.updatedBy]
      );
    }
    for (const i of snapshot.invoices) {
      await client.query(
        `INSERT INTO invoices (id, tenant_id, order_id, invoice_number, status, total_amount, paid_amount, currency, created_at, updated_at, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
        [i.id, tenant.id, i.orderId, i.invoiceNumber, i.status, i.totalAmount, i.paidAmount, i.currency, i.createdAt, i.updatedAt, i.createdBy, i.updatedBy]
      );
    }
    for (const rep of snapshot.reports) {
      await client.query(
        `INSERT INTO reports (id, tenant_id, order_id, report_number, status, released_at, released_by, amendment_note, created_at, updated_at, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
        [rep.id, tenant.id, rep.orderId, rep.reportNumber, rep.status, rep.releasedAt ?? null, rep.releasedBy ?? null, rep.amendmentNote ?? null, rep.createdAt, rep.updatedAt, rep.createdBy, rep.updatedBy]
      );
    }
    for (const amd of snapshot.reportAmendments ?? []) {
      await client.query(
        `INSERT INTO report_amendments (id, tenant_id, report_id, version, note, amended_by, amended_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [amd.id, tenant.id, amd.reportId, amd.version, amd.note, amd.amendedBy, amd.amendedAt]
      );
    }
    for (const c of snapshot.criticalAlerts) {
      await client.query(
        `INSERT INTO critical_alerts (id, tenant_id, result_id, patient_id, status, acknowledged_by, acknowledged_at, created_at, updated_at, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
        [c.id, tenant.id, c.resultId, c.patientId, c.status, c.acknowledgedBy ?? null, c.acknowledgedAt ?? null, c.createdAt, c.updatedAt, c.createdBy, c.updatedBy]
      );
    }
    for (const log of snapshot.auditLogs ?? []) {
      // audit_logs.id is a generated uuid; the fixture's string ids don't fit, so let the default fill it.
      await client.query(
        `INSERT INTO audit_logs (tenant_id, actor_name, actor_role, entity_type, entity_id, action, before_state, after_state, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9)`,
        [
          tenant.id,
          log.actorName,
          log.actorRole,
          log.entityType,
          log.entityId,
          log.action,
          log.beforeState == null ? null : JSON.stringify(log.beforeState),
          log.afterState == null ? null : JSON.stringify(log.afterState),
          log.createdAt
        ]
      );
    }
  }
}

/** Wipe all workflow + org rows (keeps tenants/staff_users) then re-seed — demo reset. */
export async function resetToFixtures(client: PoolClient): Promise<void> {
  await client.query(
    `TRUNCATE
       audit_logs, report_amendments, critical_alerts, reports, results,
       invoices, samples, lab_orders, appointments, patients,
       panel_doctors, staff, outlets
     RESTART IDENTITY CASCADE`
  );
  await seedFromFixtures(client);
}
