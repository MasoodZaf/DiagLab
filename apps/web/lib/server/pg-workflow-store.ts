/**
 * Postgres-backed workflow store — the single source of truth for the demo's
 * operational data. Ported from the NestJS PostgresLabWorkflowRepository, adapted
 * to: take a tenant *slug* (resolved to a tenant id), return locale-agnostic
 * StatusMessage codes, and add the creation flows the demo needs to be driven
 * end-to-end (enter result, draft report, order for an existing patient, add
 * doctor / staff). Every mutation runs in a transaction and writes an audit row.
 */
import type { PoolClient } from "pg";
import type {
  AppointmentRecord,
  AuditLogRecord,
  CriticalAlertRecord,
  InvoiceRecord,
  OrderRecord,
  PanelDoctor,
  PatientRecord,
  ReportAmendmentRecord,
  ReportRecord,
  ResultRecord,
  SampleRecord,
  SessionActor,
  StaffMember,
  TenantSnapshot,
  UserRole
} from "@lab/contracts";
import { resultWorkflowRules, sampleWorkflowRules } from "@lab/contracts";
import { getTenantConfig } from "@lab/branding";
import { getPool, ensureReady } from "./db";
import { resetToFixtures } from "./seed";
import { WorkflowError, type MutationResult } from "./workflow-types";

type DbRow = Record<string, unknown>;
type AuditEntity =
  | "patient"
  | "appointment"
  | "order"
  | "sample"
  | "result"
  | "invoice"
  | "report"
  | "critical_alert"
  | "doctor"
  | "staff";

export type RegistrationInput = {
  actor: SessionActor;
  fullName: string;
  phone: string;
  nationalId: string;
  tests: string[];
  totalAmount: number;
  homeCollection: boolean;
};

export type ExistingPatientOrderInput = {
  actor: SessionActor;
  patientId: string;
  tests: string[];
  totalAmount: number;
  homeCollection: boolean;
};

export type EnterResultInput = {
  actor: SessionActor;
  sampleId: string;
  testName: string;
  value: string;
  referenceRange: string;
  abnormal: boolean;
  critical: boolean;
};

export type AddDoctorInput = {
  actor: SessionActor;
  name: string;
  specialty: string;
  qualification: string;
  outletIds?: string[];
};

export type AddStaffInput = {
  actor: SessionActor;
  name: string;
  role: UserRole;
  outletId?: string;
  phone?: string;
  email?: string;
};

function iso(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function textArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function tenantIdFromSlug(slug: string) {
  return getTenantConfig(slug).id;
}

function currencyForTenant(slug: string): InvoiceRecord["currency"] {
  return getTenantConfig(slug).locale === "en-GB" ? "GBP" : "PKR";
}

function prefixFor(tenantId: string) {
  return tenantId === "tenant_cedar" ? "CD" : "LM";
}

class PgWorkflowStore {
  async getSnapshot(slug: string): Promise<TenantSnapshot> {
    await ensureReady();
    const tenantId = tenantIdFromSlug(slug);
    const [patients, appointments, orders, samples, results, invoices, reports, reportAmendments, criticalAlerts, auditLogs] =
      await Promise.all([
        this.query("SELECT * FROM patients WHERE tenant_id = $1 ORDER BY created_at", [tenantId]),
        this.query("SELECT * FROM appointments WHERE tenant_id = $1 ORDER BY created_at", [tenantId]),
        this.query("SELECT * FROM lab_orders WHERE tenant_id = $1 ORDER BY created_at", [tenantId]),
        this.query("SELECT * FROM samples WHERE tenant_id = $1 ORDER BY created_at", [tenantId]),
        this.query("SELECT * FROM results WHERE tenant_id = $1 ORDER BY created_at", [tenantId]),
        this.query("SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at", [tenantId]),
        this.query("SELECT * FROM reports WHERE tenant_id = $1 ORDER BY created_at", [tenantId]),
        this.query("SELECT * FROM report_amendments WHERE tenant_id = $1 ORDER BY amended_at", [tenantId]),
        this.query("SELECT * FROM critical_alerts WHERE tenant_id = $1 ORDER BY created_at", [tenantId]),
        this.query("SELECT * FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId])
      ]);

    return {
      tenantId,
      patients: patients.map(this.mapPatient),
      appointments: appointments.map(this.mapAppointment),
      orders: orders.map(this.mapOrder),
      samples: samples.map(this.mapSample),
      results: results.map(this.mapResult),
      invoices: invoices.map(this.mapInvoice),
      reports: reports.map(this.mapReport),
      reportAmendments: reportAmendments.map(this.mapReportAmendment),
      criticalAlerts: criticalAlerts.map(this.mapCriticalAlert),
      auditLogs: auditLogs.map(this.mapAuditLog)
    };
  }

  async listDoctors(slug: string): Promise<PanelDoctor[]> {
    await ensureReady();
    const tenantId = tenantIdFromSlug(slug);
    const rows = await this.query("SELECT * FROM panel_doctors WHERE tenant_id = $1 ORDER BY created_at", [tenantId]);
    return rows.map(this.mapDoctor);
  }

  async listStaff(slug: string): Promise<StaffMember[]> {
    await ensureReady();
    const tenantId = tenantIdFromSlug(slug);
    const rows = await this.query("SELECT * FROM staff WHERE tenant_id = $1 ORDER BY created_at", [tenantId]);
    return rows.map(this.mapStaff);
  }

  async registerPatientAndOrder(slug: string, input: RegistrationInput): Promise<MutationResult> {
    return this.tx(slug, async (client, tenantId) => {
      const now = new Date();
      const seq = await this.nextSeq(client, tenantId);
      const patientId = `pat_${seq + 100}`;
      await client.query(
        `INSERT INTO patients (id, tenant_id, mrn, full_name, phone, national_id, date_of_birth, sex, consented_at, created_at, updated_at, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$9,$10,$10)`,
        [patientId, tenantId, `${prefixFor(tenantId)}-${240220 + seq}`, input.fullName, input.phone, input.nationalId, "1996-03-18", "female", now, input.actor.displayName]
      );
      await this.insertAudit(client, tenantId, input.actor, "patient", patientId, "create", null, { id: patientId, fullName: input.fullName });
      const { order } = await this.createOrderBundle(client, tenantId, slug, input.actor, patientId, input.tests, input.totalAmount, input.homeCollection, seq);
      return { code: "status.orderRegistered", params: { name: input.fullName, orderNumber: order.orderNumber }, tenantId };
    });
  }

  async createOrderForExistingPatient(slug: string, input: ExistingPatientOrderInput): Promise<MutationResult> {
    this.requireRole(input.actor, ["receptionist", "super_admin"]);
    return this.tx(slug, async (client, tenantId) => {
      const patient = (await client.query("SELECT * FROM patients WHERE tenant_id = $1 AND id = $2", [tenantId, input.patientId])).rows[0] as DbRow | undefined;
      if (!patient) {
        throw new WorkflowError("status.patientNotFound");
      }
      const seq = await this.nextSeq(client, tenantId);
      const { order } = await this.createOrderBundle(client, tenantId, slug, input.actor, input.patientId, input.tests, input.totalAmount, input.homeCollection, seq);
      return { code: "status.orderCreated", params: { name: String(patient.full_name), orderNumber: order.orderNumber }, tenantId };
    });
  }

  async enterResult(slug: string, input: EnterResultInput): Promise<MutationResult> {
    this.requireRole(input.actor, ["technician", "super_admin"]);
    return this.tx(slug, async (client, tenantId) => {
      const sample = (await client.query("SELECT * FROM samples WHERE tenant_id = $1 AND id = $2", [tenantId, input.sampleId])).rows[0] as DbRow | undefined;
      if (!sample) {
        throw new WorkflowError("status.sampleNotFound");
      }
      const orderId = String(sample.order_id);
      const order = (await client.query("SELECT patient_id FROM lab_orders WHERE tenant_id = $1 AND id = $2", [tenantId, orderId])).rows[0] as DbRow | undefined;
      const now = new Date();
      const seq = await this.nextSeq(client, tenantId);
      const resultId = `res_${seq + 100}`;
      const status: ResultRecord["status"] = input.critical ? "flagged" : "entered";
      const inserted = await client.query(
        `INSERT INTO results (id, tenant_id, order_id, sample_id, test_name, status, value, reference_range, abnormal, critical, created_at, updated_at, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,$12,$12) RETURNING *`,
        [resultId, tenantId, orderId, input.sampleId, input.testName, status, input.value, input.referenceRange, input.abnormal, input.critical, now, input.actor.displayName]
      );
      await this.insertAudit(client, tenantId, input.actor, "result", resultId, "enter", null, inserted.rows[0]);

      if (input.critical && order) {
        const alertId = `crit_${seq + 100}`;
        const alert = await client.query(
          `INSERT INTO critical_alerts (id, tenant_id, result_id, patient_id, status, created_at, updated_at, created_by, updated_by)
           VALUES ($1,$2,$3,$4,'open',$5,$5,$6,$6) RETURNING *`,
          [alertId, tenantId, resultId, String(order.patient_id), now, input.actor.displayName]
        );
        await this.insertAudit(client, tenantId, input.actor, "critical_alert", alertId, "raise", null, alert.rows[0]);
      }
      return { code: "status.resultEntered", params: { test: input.testName }, tenantId };
    });
  }

  async transitionSample(slug: string, sampleId: string, nextStatus: SampleRecord["status"], actor: SessionActor): Promise<MutationResult> {
    return this.tx(slug, async (client, tenantId) => {
      const sample = (await client.query("SELECT * FROM samples WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, sampleId])).rows[0] as DbRow | undefined;
      if (!sample) {
        throw new WorkflowError("status.sampleNotFound");
      }
      const currentStatus = sample.status as SampleRecord["status"];
      const rule = sampleWorkflowRules.find((entry) => entry.from === currentStatus && entry.to === nextStatus);
      if (!rule || !rule.allowedRoles.includes(actor.role)) {
        throw new WorkflowError("status.invalidTransition");
      }
      const now = new Date();
      const checkpoint = `${nextStatus} by ${actor.displayName}`;
      const updated = await client.query(
        `UPDATE samples
         SET status = $1, collected_at = CASE WHEN $1 = 'collected' THEN $2 ELSE collected_at END,
             last_checkpoint = $3, updated_at = $2, updated_by = $4
         WHERE tenant_id = $5 AND id = $6 RETURNING *`,
        [nextStatus, now, checkpoint, actor.displayName, tenantId, sampleId]
      );
      const orderStatus = nextStatus === "verified" ? "awaiting_release" : nextStatus === "released" ? "released" : null;
      if (orderStatus) {
        await client.query("UPDATE lab_orders SET status = $1, updated_at = $2, updated_by = $3 WHERE tenant_id = $4 AND id = $5", [
          orderStatus,
          now,
          actor.displayName,
          tenantId,
          String(sample.order_id)
        ]);
      }
      await this.insertAudit(client, tenantId, actor, "sample", sampleId, "transition", sample, updated.rows[0]);
      return { code: "status.sampleMoved", params: { barcode: String(sample.barcode), status: nextStatus }, tenantId };
    });
  }

  async validateResult(slug: string, resultId: string, actor: SessionActor): Promise<MutationResult> {
    return this.tx(slug, async (client, tenantId) => {
      const row = (await client.query("SELECT * FROM results WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, resultId])).rows[0] as DbRow | undefined;
      if (!row) {
        throw new WorkflowError("status.resultNotFound");
      }
      const currentStatus = row.status as ResultRecord["status"];
      const rule = resultWorkflowRules.find((entry) => entry.from === currentStatus && entry.to === "validated");
      if (!rule || !rule.allowedRoles.includes(actor.role)) {
        throw new WorkflowError("status.invalidTransition");
      }
      const now = new Date();
      const updated = await client.query(
        "UPDATE results SET status = 'validated', validator_name = $1, updated_at = $2, updated_by = $1 WHERE tenant_id = $3 AND id = $4 RETURNING *",
        [actor.displayName, now, tenantId, resultId]
      );
      await this.insertAudit(client, tenantId, actor, "result", resultId, "validate", row, updated.rows[0]);
      return { code: "status.resultValidated", params: { test: String(row.test_name) }, tenantId };
    });
  }

  async acknowledgeAlert(slug: string, alertId: string, actor: SessionActor): Promise<MutationResult> {
    this.requireRole(actor, ["pathologist", "super_admin"]);
    return this.tx(slug, async (client, tenantId) => {
      const row = (await client.query("SELECT * FROM critical_alerts WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, alertId])).rows[0] as DbRow | undefined;
      if (!row) {
        throw new WorkflowError("status.alertNotFound");
      }
      const now = new Date();
      const updated = await client.query(
        "UPDATE critical_alerts SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = $2, updated_at = $2, updated_by = $1 WHERE tenant_id = $3 AND id = $4 RETURNING *",
        [actor.displayName, now, tenantId, alertId]
      );
      await this.insertAudit(client, tenantId, actor, "critical_alert", alertId, "acknowledge", row, updated.rows[0]);
      return { code: "status.alertAcknowledged", tenantId };
    });
  }

  async recordInvoicePayment(slug: string, invoiceId: string, amount: number, actor: SessionActor): Promise<MutationResult> {
    if (!["patient", "receptionist", "super_admin"].includes(actor.role)) {
      throw new WorkflowError("status.roleCannotPay");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new WorkflowError("status.paymentMustBePositive");
    }
    return this.tx(slug, async (client, tenantId) => {
      const invoice = (await client.query("SELECT * FROM invoices WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, invoiceId])).rows[0] as DbRow | undefined;
      if (!invoice) {
        throw new WorkflowError("status.invoiceNotFound");
      }
      const outstanding = Number(invoice.total_amount) - Number(invoice.paid_amount);
      if (amount > outstanding) {
        throw new WorkflowError("status.paymentExceedsOutstanding");
      }
      const now = new Date();
      const nextPaid = Number(invoice.paid_amount) + amount;
      const nextStatus = nextPaid >= Number(invoice.total_amount) ? "paid" : "partially_paid";
      const updated = await client.query(
        "UPDATE invoices SET paid_amount = $1, status = $2, updated_at = $3, updated_by = $4 WHERE tenant_id = $5 AND id = $6 RETURNING *",
        [nextPaid, nextStatus, now, actor.displayName, tenantId, invoiceId]
      );
      await this.insertAudit(client, tenantId, actor, "invoice", invoiceId, "record_payment", invoice, updated.rows[0]);
      return { code: "status.paymentRecorded", params: { invoice: String(invoice.invoice_number) }, tenantId };
    });
  }

  async createDraftReport(slug: string, orderId: string, actor: SessionActor): Promise<MutationResult> {
    this.requireRole(actor, ["pathologist", "super_admin"]);
    return this.tx(slug, async (client, tenantId) => {
      const order = (await client.query("SELECT * FROM lab_orders WHERE tenant_id = $1 AND id = $2", [tenantId, orderId])).rows[0] as DbRow | undefined;
      if (!order) {
        throw new WorkflowError("status.orderNotFound");
      }
      const existing = (await client.query("SELECT report_number FROM reports WHERE tenant_id = $1 AND order_id = $2", [tenantId, orderId])).rows[0] as DbRow | undefined;
      if (existing) {
        throw new WorkflowError("status.reportExists");
      }
      const seq = await this.nextSeq(client, tenantId);
      const prefix = tenantId === "tenant_cedar" ? "CED" : "LUM";
      const reportId = `rep_${prefix.toLowerCase()}_${seq + 20}`;
      const reportNumber = `RPT-${prefix}-${4500 + seq}`;
      const now = new Date();
      const inserted = await client.query(
        `INSERT INTO reports (id, tenant_id, order_id, report_number, status, created_at, updated_at, created_by, updated_by)
         VALUES ($1,$2,$3,$4,'draft',$5,$5,$6,$6) RETURNING *`,
        [reportId, tenantId, orderId, reportNumber, now, actor.displayName]
      );
      await this.insertAudit(client, tenantId, actor, "report", reportId, "create", null, inserted.rows[0]);
      return { code: "status.reportDrafted", params: { report: reportNumber }, tenantId };
    });
  }

  async releaseReport(slug: string, reportId: string, actor: SessionActor): Promise<MutationResult> {
    this.requireRole(actor, ["pathologist"]);
    return this.tx(slug, async (client, tenantId) => {
      const report = (await client.query("SELECT * FROM reports WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, reportId])).rows[0] as DbRow | undefined;
      if (!report) {
        throw new WorkflowError("status.reportNotFound");
      }
      const orderId = String(report.order_id);
      const order = (await client.query("SELECT * FROM lab_orders WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, orderId])).rows[0] as DbRow | undefined;
      const results = (await client.query("SELECT * FROM results WHERE tenant_id = $1 AND order_id = $2 FOR UPDATE", [tenantId, orderId])).rows as DbRow[];
      const openAlerts = await client.query(
        `SELECT critical_alerts.id FROM critical_alerts
         JOIN results ON results.id = critical_alerts.result_id AND results.tenant_id = critical_alerts.tenant_id
         WHERE critical_alerts.tenant_id = $1 AND results.order_id = $2 AND critical_alerts.status = 'open'`,
        [tenantId, orderId]
      );
      if (openAlerts.rows.length > 0) {
        throw new WorkflowError("status.criticalAlertMustAck");
      }
      if (results.length === 0 || results.some((entry) => entry.status !== "validated" && entry.status !== "released")) {
        throw new WorkflowError("status.allResultsMustValidate");
      }
      const now = new Date();
      const released = await client.query(
        "UPDATE reports SET status = 'released', released_at = $1, released_by = $2, updated_at = $1, updated_by = $2 WHERE tenant_id = $3 AND id = $4 RETURNING *",
        [now, actor.displayName, tenantId, reportId]
      );
      await client.query("UPDATE results SET status = 'released', updated_at = $1, updated_by = $2 WHERE tenant_id = $3 AND order_id = $4", [now, actor.displayName, tenantId, orderId]);
      await client.query(
        "UPDATE samples SET status = 'released', last_checkpoint = 'Released to patient portal', updated_at = $1, updated_by = $2 WHERE tenant_id = $3 AND order_id = $4",
        [now, actor.displayName, tenantId, orderId]
      );
      const releasedOrder = await client.query("UPDATE lab_orders SET status = 'released', updated_at = $1, updated_by = $2 WHERE tenant_id = $3 AND id = $4 RETURNING *", [
        now,
        actor.displayName,
        tenantId,
        orderId
      ]);
      await this.insertAudit(client, tenantId, actor, "report", reportId, "release", report, released.rows[0]);
      if (order) {
        await this.insertAudit(client, tenantId, actor, "order", orderId, "release", order, releasedOrder.rows[0]);
      }
      return { code: "status.reportReleased", params: { report: String(report.report_number) }, tenantId };
    });
  }

  async amendReport(slug: string, reportId: string, note: string, actor: SessionActor): Promise<MutationResult> {
    this.requireRole(actor, ["pathologist", "super_admin"]);
    if (!note.trim()) {
      throw new WorkflowError("status.amendmentNoteRequired");
    }
    return this.tx(slug, async (client, tenantId) => {
      const report = (await client.query("SELECT * FROM reports WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, reportId])).rows[0] as DbRow | undefined;
      if (!report) {
        throw new WorkflowError("status.reportNotFound");
      }
      if (report.status !== "released" && report.status !== "amended") {
        throw new WorkflowError("status.onlyReleasedCanAmend");
      }
      const version = Number(
        (await client.query<{ next_version: number }>("SELECT COALESCE(max(version), 0) + 1 AS next_version FROM report_amendments WHERE tenant_id = $1 AND report_id = $2", [tenantId, reportId])).rows[0]
          ?.next_version ?? 1
      );
      const now = new Date();
      const amendment = await client.query(
        `INSERT INTO report_amendments (id, tenant_id, report_id, version, note, amended_by, amended_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [`amd_${reportId}_${version}`, tenantId, reportId, version, note, actor.displayName, now]
      );
      const updated = await client.query(
        "UPDATE reports SET status = 'amended', amendment_note = $1, updated_at = $2, updated_by = $3 WHERE tenant_id = $4 AND id = $5 RETURNING *",
        [note, now, actor.displayName, tenantId, reportId]
      );
      await this.insertAudit(client, tenantId, actor, "report", reportId, "amend", report, { report: updated.rows[0], amendment: amendment.rows[0] });
      return { code: "status.reportAmended", params: { report: String(report.report_number), version }, tenantId };
    });
  }

  async addDoctor(slug: string, input: AddDoctorInput): Promise<MutationResult> {
    this.requireRole(input.actor, ["lab_admin", "super_admin"]);
    if (!input.name.trim() || !input.specialty.trim()) {
      throw new WorkflowError("status.fieldsRequired");
    }
    return this.tx(slug, async (client, tenantId) => {
      const count = Number((await client.query<{ count: string }>("SELECT count(*) FROM panel_doctors WHERE tenant_id = $1", [tenantId])).rows[0]?.count ?? 0);
      const id = `doc_${slug}_${count + 1 + 100}`;
      const inserted = await client.query(
        `INSERT INTO panel_doctors (id, tenant_id, name, specialty, qualification, outlet_ids, status)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,'active') RETURNING *`,
        [id, tenantId, input.name.trim(), input.specialty.trim(), input.qualification.trim() || "—", JSON.stringify(input.outletIds ?? [])]
      );
      await this.insertAudit(client, tenantId, input.actor, "doctor", id, "create", null, inserted.rows[0]);
      return { code: "status.doctorAdded", params: { name: input.name.trim() }, tenantId };
    });
  }

  async addStaff(slug: string, input: AddStaffInput): Promise<MutationResult> {
    this.requireRole(input.actor, ["lab_admin", "super_admin"]);
    if (!input.name.trim()) {
      throw new WorkflowError("status.fieldsRequired");
    }
    return this.tx(slug, async (client, tenantId) => {
      const count = Number((await client.query<{ count: string }>("SELECT count(*) FROM staff WHERE tenant_id = $1", [tenantId])).rows[0]?.count ?? 0);
      const id = `stf_${slug}_${count + 1 + 100}`;
      const inserted = await client.query(
        `INSERT INTO staff (id, tenant_id, name, role, outlet_id, phone, status, email, login_enabled)
         VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8) RETURNING *`,
        [id, tenantId, input.name.trim(), input.role, input.outletId ?? null, input.phone ?? null, input.email ?? null, Boolean(input.email)]
      );
      await this.insertAudit(client, tenantId, input.actor, "staff", id, "create", null, inserted.rows[0]);
      return { code: "status.staffAdded", params: { name: input.name.trim() }, tenantId };
    });
  }

  /** Demo reset: wipe workflow + org rows and re-seed from fixtures. */
  async reset(): Promise<void> {
    await ensureReady();
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      await resetToFixtures(client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  // --- helpers -------------------------------------------------------------

  /** Shared transaction wrapper: resolves tenant id, commits, returns {message, snapshot}. */
  private async tx(slug: string, work: (client: PoolClient, tenantId: string) => Promise<{ code: string; params?: Record<string, string | number>; tenantId: string }>): Promise<MutationResult> {
    await ensureReady();
    const tenantId = tenantIdFromSlug(slug);
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const outcome = await work(client, tenantId);
      await client.query("COMMIT");
      return { message: { code: outcome.code, params: outcome.params }, snapshot: await this.getSnapshot(slug) };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  /** Creates appointment + order + sample + invoice for a known patient. */
  private async createOrderBundle(
    client: PoolClient,
    tenantId: string,
    slug: string,
    actor: SessionActor,
    patientId: string,
    tests: string[],
    totalAmount: number,
    homeCollection: boolean,
    seq: number
  ) {
    const now = new Date();
    const prefix = prefixFor(tenantId);
    const branchName = actor.branchName ?? "Central Lab";
    const appointmentId = `apt_${seq + 100}`;
    const orderId = `ord_${seq + 100}`;
    const sampleId = `sam_${seq + 100}`;
    const invoiceId = `inv_${seq + 100}`;
    const orderNumber = `${prefix}-2026-${5000 + seq}`;

    await client.query(
      `INSERT INTO appointments (id, tenant_id, patient_id, status, channel, scheduled_at, branch_name, created_at, updated_at, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$6,$6,$8,$8)`,
      [appointmentId, tenantId, patientId, homeCollection ? "assigned" : "scheduled", homeCollection ? "home_collection" : "walk_in", now, branchName, actor.displayName]
    );
    const order = await client.query(
      `INSERT INTO lab_orders (id, tenant_id, patient_id, appointment_id, order_number, tests, status, branch_name, home_collection, created_at, updated_at, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$10,$11,$11) RETURNING *`,
      [orderId, tenantId, patientId, appointmentId, orderNumber, JSON.stringify(tests), homeCollection ? "in_progress" : "registered", branchName, homeCollection, now, actor.displayName]
    );
    await client.query(
      `INSERT INTO samples (id, tenant_id, order_id, barcode, specimen, status, last_checkpoint, created_at, updated_at, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$9)`,
      [sampleId, tenantId, orderId, `${prefix}BC${5000 + seq}`, tests.length > 1 ? "Multi-tube set" : "Serum", homeCollection ? "scheduled" : "registered", homeCollection ? "Route assigned to phlebotomist" : "Awaiting collection desk", now, actor.displayName]
    );
    await client.query(
      `INSERT INTO invoices (id, tenant_id, order_id, invoice_number, status, total_amount, paid_amount, currency, created_at, updated_at, created_by, updated_by)
       VALUES ($1,$2,$3,$4,'issued',$5,0,$6,$7,$7,$8,$8)`,
      [invoiceId, tenantId, orderId, `INV-${prefix}-${6000 + seq}`, totalAmount, currencyForTenant(slug), now, actor.displayName]
    );
    await this.insertAudit(client, tenantId, actor, "appointment", appointmentId, "create", null, { id: appointmentId, patientId });
    await this.insertAudit(client, tenantId, actor, "order", orderId, "create", null, order.rows[0]);
    await this.insertAudit(client, tenantId, actor, "sample", sampleId, "create", null, { id: sampleId, orderId });
    await this.insertAudit(client, tenantId, actor, "invoice", invoiceId, "create", null, { id: invoiceId, orderId });
    return { order: { id: orderId, orderNumber } };
  }

  /** A monotonically-increasing per-tenant sequence used to mint demo ids. */
  private async nextSeq(client: PoolClient, tenantId: string): Promise<number> {
    const counts = await Promise.all(
      ["patients", "lab_orders", "samples", "results", "reports"].map((table) =>
        client.query<{ count: string }>(`SELECT count(*) FROM ${table} WHERE tenant_id = $1`, [tenantId])
      )
    );
    return counts.reduce((sum, result) => sum + Number(result.rows[0]?.count ?? 0), 0) + 1;
  }

  private requireRole(actor: SessionActor, roles: UserRole[]) {
    if (!roles.includes(actor.role)) {
      throw new WorkflowError("status.roleNotAllowed");
    }
  }

  private async query(sql: string, values: unknown[]) {
    const result = await getPool().query(sql, values);
    return result.rows as DbRow[];
  }

  private async insertAudit(client: PoolClient, tenantId: string, actor: SessionActor, entityType: AuditEntity, entityId: string, action: string, beforeState: unknown, afterState: unknown) {
    await client.query(
      `INSERT INTO audit_logs (tenant_id, actor_name, actor_role, entity_type, entity_id, action, before_state, after_state)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)`,
      [tenantId, actor.displayName, actor.role, entityType, entityId, action, beforeState == null ? null : JSON.stringify(beforeState), afterState == null ? null : JSON.stringify(afterState)]
    );
  }

  private mapStamp(row: DbRow) {
    return {
      tenantId: String(row.tenant_id),
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at),
      createdBy: String(row.created_by),
      updatedBy: String(row.updated_by)
    };
  }

  private mapPatient = (row: DbRow): PatientRecord => ({
    ...this.mapStamp(row),
    id: String(row.id),
    mrn: String(row.mrn),
    fullName: String(row.full_name),
    phone: String(row.phone),
    nationalId: String(row.national_id),
    dateOfBirth: iso(row.date_of_birth).slice(0, 10),
    sex: row.sex as PatientRecord["sex"],
    consentedAt: iso(row.consented_at)
  });

  private mapAppointment = (row: DbRow): AppointmentRecord => ({
    ...this.mapStamp(row),
    id: String(row.id),
    patientId: String(row.patient_id),
    status: row.status as AppointmentRecord["status"],
    channel: row.channel as AppointmentRecord["channel"],
    scheduledAt: iso(row.scheduled_at),
    branchName: String(row.branch_name)
  });

  private mapOrder = (row: DbRow): OrderRecord => ({
    ...this.mapStamp(row),
    id: String(row.id),
    patientId: String(row.patient_id),
    appointmentId: String(row.appointment_id),
    orderNumber: String(row.order_number),
    tests: textArray(row.tests),
    status: row.status as OrderRecord["status"],
    branchName: String(row.branch_name),
    homeCollection: Boolean(row.home_collection)
  });

  private mapSample = (row: DbRow): SampleRecord => ({
    ...this.mapStamp(row),
    id: String(row.id),
    orderId: String(row.order_id),
    barcode: String(row.barcode),
    specimen: String(row.specimen),
    status: row.status as SampleRecord["status"],
    collectedAt: row.collected_at ? iso(row.collected_at) : undefined,
    lastCheckpoint: String(row.last_checkpoint)
  });

  private mapResult = (row: DbRow): ResultRecord => ({
    ...this.mapStamp(row),
    id: String(row.id),
    orderId: String(row.order_id),
    sampleId: String(row.sample_id),
    testName: String(row.test_name),
    status: row.status as ResultRecord["status"],
    value: String(row.value),
    referenceRange: String(row.reference_range),
    abnormal: Boolean(row.abnormal),
    critical: Boolean(row.critical),
    validatorName: row.validator_name ? String(row.validator_name) : undefined
  });

  private mapInvoice = (row: DbRow): InvoiceRecord => ({
    ...this.mapStamp(row),
    id: String(row.id),
    orderId: String(row.order_id),
    invoiceNumber: String(row.invoice_number),
    status: row.status as InvoiceRecord["status"],
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    currency: row.currency as InvoiceRecord["currency"]
  });

  private mapReport = (row: DbRow): ReportRecord => ({
    ...this.mapStamp(row),
    id: String(row.id),
    orderId: String(row.order_id),
    reportNumber: String(row.report_number),
    status: row.status as ReportRecord["status"],
    releasedAt: row.released_at ? iso(row.released_at) : undefined,
    releasedBy: row.released_by ? String(row.released_by) : undefined,
    amendmentNote: row.amendment_note ? String(row.amendment_note) : undefined
  });

  private mapCriticalAlert = (row: DbRow): CriticalAlertRecord => ({
    ...this.mapStamp(row),
    id: String(row.id),
    resultId: String(row.result_id),
    patientId: String(row.patient_id),
    status: row.status as CriticalAlertRecord["status"],
    acknowledgedBy: row.acknowledged_by ? String(row.acknowledged_by) : undefined,
    acknowledgedAt: row.acknowledged_at ? iso(row.acknowledged_at) : undefined
  });

  private mapReportAmendment = (row: DbRow): ReportAmendmentRecord => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    reportId: String(row.report_id),
    version: Number(row.version),
    note: String(row.note),
    amendedBy: String(row.amended_by),
    amendedAt: iso(row.amended_at)
  });

  private mapAuditLog = (row: DbRow): AuditLogRecord => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    actorName: String(row.actor_name),
    actorRole: row.actor_role as AuditLogRecord["actorRole"],
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    action: String(row.action),
    beforeState: row.before_state,
    afterState: row.after_state,
    createdAt: iso(row.created_at)
  });

  private mapDoctor = (row: DbRow): PanelDoctor => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    name: String(row.name),
    specialty: String(row.specialty),
    qualification: String(row.qualification),
    outletIds: textArray(row.outlet_ids),
    status: row.status as PanelDoctor["status"]
  });

  private mapStaff = (row: DbRow): StaffMember => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    name: String(row.name),
    role: row.role as StaffMember["role"],
    outletId: String(row.outlet_id ?? ""),
    phone: row.phone ? String(row.phone) : undefined,
    status: row.status as StaffMember["status"],
    email: row.email ? String(row.email) : undefined,
    loginEnabled: Boolean(row.login_enabled)
  });
}

export const store = new PgWorkflowStore();
