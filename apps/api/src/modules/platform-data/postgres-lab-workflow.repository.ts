import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Pool } from "pg";
import type { PoolClient } from "pg";
import type {
  AppointmentRecord,
  AuditLogRecord,
  CriticalAlertRecord,
  InvoiceRecord,
  OrderRecord,
  PatientRecord,
  ReportAmendmentRecord,
  ReportRecord,
  ResultRecord,
  SampleRecord,
  SessionActor,
  TenantSnapshot
} from "@lab/contracts";
import { resultWorkflowRules as resultRules, sampleWorkflowRules as sampleRules } from "@lab/contracts";
import type {
  LabWorkflowRepository,
  RegisterPatientAndOrderCommand,
  WorkflowMutationResult
} from "./lab-workflow.repository";

type DbRow = Record<string, unknown>;
type AuditEntity = "patient" | "appointment" | "order" | "sample" | "result" | "invoice" | "report" | "critical_alert";

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  return new Pool({
    connectionString,
    host: connectionString ? undefined : process.env.POSTGRES_HOST ?? "127.0.0.1",
    port: connectionString ? undefined : Number(process.env.POSTGRES_PORT ?? 5432),
    database: connectionString ? undefined : process.env.POSTGRES_DB ?? "ai_lab",
    user: connectionString ? undefined : process.env.POSTGRES_USER ?? "ai_lab",
    password: connectionString ? undefined : process.env.POSTGRES_PASSWORD ?? "ai_lab_password"
  });
}

function iso(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

function textArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export class PostgresLabWorkflowRepository implements LabWorkflowRepository {
  private readonly pool = getPool();

  async getSnapshot(tenantId: string): Promise<TenantSnapshot> {
    const [patients, appointments, orders, samples, results, invoices, reports, reportAmendments, criticalAlerts, auditLogs] = await Promise.all([
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

  async registerPatientAndOrder(tenantId: string, command: RegisterPatientAndOrderCommand): Promise<WorkflowMutationResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const now = new Date();
      const prefix = tenantId === "tenant_cedar" ? "CD" : "LM";
      const countResult = await client.query<{ count: string }>("SELECT count(*) FROM patients WHERE tenant_id = $1", [tenantId]);
      const next = Number(countResult.rows[0]?.count ?? 0) + 1;
      const patientId = `pat_${next + 100}`;
      const appointmentId = `apt_${next + 100}`;
      const orderId = `ord_${next + 100}`;
      const sampleId = `sam_${next + 100}`;
      const invoiceId = `inv_${next + 100}`;

      await client.query(
        `INSERT INTO patients (id, tenant_id, mrn, full_name, phone, national_id, date_of_birth, sex, consented_at, created_at, updated_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $9, $10, $10)`,
        [
          patientId,
          tenantId,
          `${prefix}-${240220 + next}`,
          command.fullName,
          command.phone,
          command.nationalId,
          command.dateOfBirth,
          command.sex,
          now,
          command.actor.displayName
        ]
      );
      await client.query(
        `INSERT INTO appointments (id, tenant_id, patient_id, status, channel, scheduled_at, branch_name, created_at, updated_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $9)`,
        [
          appointmentId,
          tenantId,
          patientId,
          command.channel === "home_collection" ? "assigned" : "scheduled",
          command.channel,
          command.scheduledAt,
          command.branchName,
          now,
          command.actor.displayName
        ]
      );
      await client.query(
        `INSERT INTO lab_orders (id, tenant_id, patient_id, appointment_id, order_number, tests, status, branch_name, home_collection, created_at, updated_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $10, $11, $11)`,
        [
          orderId,
          tenantId,
          patientId,
          appointmentId,
          `${prefix}-2026-${5000 + next}`,
          JSON.stringify(command.tests),
          command.homeCollection ? "in_progress" : "registered",
          command.branchName,
          command.homeCollection,
          now,
          command.actor.displayName
        ]
      );
      await client.query(
        `INSERT INTO samples (id, tenant_id, order_id, barcode, specimen, status, last_checkpoint, created_at, updated_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $9)`,
        [
          sampleId,
          tenantId,
          orderId,
          `${prefix}BC${5000 + next}`,
          command.tests.length > 1 ? "Multi-tube set" : "Serum",
          command.homeCollection ? "scheduled" : "registered",
          command.homeCollection ? "Route assigned to phlebotomist" : "Awaiting collection desk",
          now,
          command.actor.displayName
        ]
      );
      await client.query(
        `INSERT INTO invoices (id, tenant_id, order_id, invoice_number, status, total_amount, paid_amount, currency, created_at, updated_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, 'issued', $5, 0, $6, $7, $7, $8, $8)`,
        [invoiceId, tenantId, orderId, `INV-${prefix}-${6000 + next}`, command.totalAmount, command.currency, now, command.actor.displayName]
      );
      await this.insertAudit(client, tenantId, command.actor, "patient", patientId, "create", null, { id: patientId, fullName: command.fullName });
      await this.insertAudit(client, tenantId, command.actor, "appointment", appointmentId, "create", null, { id: appointmentId, patientId });
      await this.insertAudit(client, tenantId, command.actor, "order", orderId, "create", null, { id: orderId, tests: command.tests });
      await this.insertAudit(client, tenantId, command.actor, "sample", sampleId, "create", null, { id: sampleId, orderId });
      await this.insertAudit(client, tenantId, command.actor, "invoice", invoiceId, "create", null, { id: invoiceId, orderId });
      await client.query("COMMIT");
      return { message: `Registered ${command.fullName} and created ${prefix}-2026-${5000 + next}.`, snapshot: await this.getSnapshot(tenantId) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async transitionSample(
    tenantId: string,
    sampleId: string,
    nextStatus: SampleRecord["status"],
    actor: SessionActor,
    options?: { checkpoint?: string; reason?: string }
  ): Promise<WorkflowMutationResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const sampleResult = await client.query("SELECT * FROM samples WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, sampleId]);
      const sample = sampleResult.rows[0] as DbRow | undefined;
      if (!sample) {
        throw new NotFoundException(`Unknown sample: ${sampleId}`);
      }

      const currentStatus = sample.status as SampleRecord["status"];
      const rule = sampleRules.find((entry) => entry.from === currentStatus && entry.to === nextStatus);
      if (!rule) {
        throw new BadRequestException(`Invalid sample transition from ${currentStatus} to ${nextStatus}`);
      }
      if (!rule.allowedRoles.includes(actor.role)) {
        throw new BadRequestException(`Role ${actor.role} cannot move sample from ${currentStatus} to ${nextStatus}`);
      }
      if (rule.requiresReason && !options?.reason) {
        throw new BadRequestException("A reason is required for this transition");
      }

      const now = new Date();
      const checkpoint = options?.checkpoint ?? `${nextStatus} by ${actor.displayName}`;
      const updateResult = await client.query(
        `UPDATE samples
         SET status = $1,
             collected_at = CASE WHEN $1 = 'collected' THEN $2 ELSE collected_at END,
             last_checkpoint = $3,
             updated_at = $2,
             updated_by = $4
         WHERE tenant_id = $5 AND id = $6
         RETURNING *`,
        [nextStatus, now, checkpoint, actor.displayName, tenantId, sampleId]
      );

      const orderStatus = nextStatus === "processing" ? "in_progress" : nextStatus === "verified" ? "awaiting_release" : nextStatus === "released" ? "released" : null;
      if (orderStatus) {
        await client.query(
          `UPDATE lab_orders
           SET status = $1, updated_at = $2, updated_by = $3
           WHERE tenant_id = $4 AND id = $5`,
          [orderStatus, now, actor.displayName, tenantId, String(sample.order_id)]
        );
      }

      await this.insertAudit(client, tenantId, actor, "sample", sampleId, "transition", sample, updateResult.rows[0]);
      await client.query("COMMIT");
      return { message: `Sample ${String(sample.barcode)} moved to ${nextStatus}.`, snapshot: await this.getSnapshot(tenantId) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async validateResult(tenantId: string, resultId: string, actor: SessionActor): Promise<WorkflowMutationResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query("SELECT * FROM results WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, resultId]);
      const row = result.rows[0] as DbRow | undefined;
      if (!row) {
        throw new NotFoundException(`Unknown result: ${resultId}`);
      }

      const currentStatus = row.status as ResultRecord["status"];
      const rule = resultRules.find((entry) => entry.from === currentStatus && entry.to === "validated");
      if (!rule) {
        throw new BadRequestException(`Invalid result transition from ${currentStatus} to validated`);
      }
      if (!rule.allowedRoles.includes(actor.role)) {
        throw new BadRequestException(`Role ${actor.role} cannot validate result ${resultId}`);
      }

      const now = new Date();
      const updateResult = await client.query(
        `UPDATE results
         SET status = 'validated', validator_name = $1, updated_at = $2, updated_by = $1
         WHERE tenant_id = $3 AND id = $4
         RETURNING *`,
        [actor.displayName, now, tenantId, resultId]
      );
      await this.insertAudit(client, tenantId, actor, "result", resultId, "validate", row, updateResult.rows[0]);
      await client.query("COMMIT");
      return { message: `${String(row.test_name)} validated.`, snapshot: await this.getSnapshot(tenantId) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async acknowledgeCriticalAlert(tenantId: string, alertId: string, actor: SessionActor): Promise<WorkflowMutationResult> {
    if (actor.role !== "pathologist" && actor.role !== "super_admin") {
      throw new BadRequestException(`Role ${actor.role} cannot acknowledge critical alerts`);
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const alert = await client.query("SELECT * FROM critical_alerts WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, alertId]);
      const row = alert.rows[0] as DbRow | undefined;
      if (!row) {
        throw new NotFoundException(`Unknown critical alert: ${alertId}`);
      }

      const now = new Date();
      const updateResult = await client.query(
        `UPDATE critical_alerts
         SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = $2, updated_at = $2, updated_by = $1
         WHERE tenant_id = $3 AND id = $4
         RETURNING *`,
        [actor.displayName, now, tenantId, alertId]
      );
      await this.insertAudit(client, tenantId, actor, "critical_alert", alertId, "acknowledge", row, updateResult.rows[0]);
      await client.query("COMMIT");
      return { message: "Critical alert acknowledged.", snapshot: await this.getSnapshot(tenantId) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async recordInvoicePayment(tenantId: string, invoiceId: string, amount: number, actor: SessionActor): Promise<WorkflowMutationResult> {
    if (actor.role !== "patient" && actor.role !== "receptionist" && actor.role !== "super_admin") {
      throw new BadRequestException(`Role ${actor.role} cannot record invoice payments`);
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException("Payment amount must be greater than zero");
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const invoiceResult = await client.query("SELECT * FROM invoices WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, invoiceId]);
      const invoice = invoiceResult.rows[0] as DbRow | undefined;
      if (!invoice) {
        throw new NotFoundException(`Unknown invoice: ${invoiceId}`);
      }

      const totalAmount = Number(invoice.total_amount);
      const paidAmount = Number(invoice.paid_amount);
      const outstanding = totalAmount - paidAmount;
      if (amount > outstanding) {
        throw new BadRequestException("Payment amount cannot exceed outstanding balance");
      }

      const now = new Date();
      const nextPaidAmount = paidAmount + amount;
      const nextStatus = nextPaidAmount >= totalAmount ? "paid" : "partially_paid";
      const updatedInvoice = await client.query(
        `UPDATE invoices
         SET paid_amount = $1, status = $2, updated_at = $3, updated_by = $4
         WHERE tenant_id = $5 AND id = $6
         RETURNING *`,
        [nextPaidAmount, nextStatus, now, actor.displayName, tenantId, invoiceId]
      );
      await this.insertAudit(client, tenantId, actor, "invoice", invoiceId, "record_payment", invoice, updatedInvoice.rows[0]);
      await client.query("COMMIT");
      return { message: `Payment recorded for ${String(invoice.invoice_number)}.`, snapshot: await this.getSnapshot(tenantId) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async releaseReport(tenantId: string, reportId: string, actor: SessionActor): Promise<WorkflowMutationResult> {
    if (actor.role !== "pathologist") {
      throw new BadRequestException(`Role ${actor.role} cannot release reports`);
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const reportResult = await client.query("SELECT * FROM reports WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, reportId]);
      const report = reportResult.rows[0] as DbRow | undefined;
      if (!report) {
        throw new NotFoundException(`Unknown report: ${reportId}`);
      }

      const orderId = String(report.order_id);
      const orderResult = await client.query("SELECT * FROM lab_orders WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, orderId]);
      const order = orderResult.rows[0] as DbRow | undefined;
      if (!order) {
        throw new NotFoundException(`Missing order for report: ${reportId}`);
      }

      const results = (await client.query("SELECT * FROM results WHERE tenant_id = $1 AND order_id = $2 FOR UPDATE", [tenantId, orderId])).rows as DbRow[];
      const openAlerts = await client.query(
        `SELECT critical_alerts.*
         FROM critical_alerts
         JOIN results ON results.id = critical_alerts.result_id AND results.tenant_id = critical_alerts.tenant_id
         WHERE critical_alerts.tenant_id = $1
           AND results.order_id = $2
           AND critical_alerts.status = 'open'`,
        [tenantId, orderId]
      );

      if (openAlerts.rows.length > 0) {
        throw new BadRequestException("Release blocked until all critical alerts are acknowledged");
      }
      if (results.length === 0 || results.some((entry) => entry.status !== "validated")) {
        throw new BadRequestException("Release blocked until all order results are validated");
      }

      const now = new Date();
      const releasedReport = await client.query(
        `UPDATE reports
         SET status = 'released', released_at = $1, released_by = $2, updated_at = $1, updated_by = $2
         WHERE tenant_id = $3 AND id = $4
         RETURNING *`,
        [now, actor.displayName, tenantId, reportId]
      );
      const releasedResults = await client.query(
        `UPDATE results
         SET status = 'released', validator_name = $1, updated_at = $2, updated_by = $1
         WHERE tenant_id = $3 AND order_id = $4
         RETURNING *`,
        [actor.displayName, now, tenantId, orderId]
      );
      const samples = (await client.query("SELECT * FROM samples WHERE tenant_id = $1 AND order_id = $2 FOR UPDATE", [tenantId, orderId])).rows as DbRow[];
      const releasedSamples = await client.query(
        `UPDATE samples
         SET status = 'released', last_checkpoint = 'Released to patient channels', updated_at = $1, updated_by = $2
         WHERE tenant_id = $3 AND order_id = $4
         RETURNING *`,
        [now, actor.displayName, tenantId, orderId]
      );
      const releasedOrder = await client.query(
        `UPDATE lab_orders
         SET status = 'released', updated_at = $1, updated_by = $2
         WHERE tenant_id = $3 AND id = $4
         RETURNING *`,
        [now, actor.displayName, tenantId, orderId]
      );

      await this.insertAudit(client, tenantId, actor, "report", reportId, "release", report, releasedReport.rows[0]);
      await this.insertAudit(client, tenantId, actor, "order", orderId, "release", order, releasedOrder.rows[0]);
      for (const result of releasedResults.rows as DbRow[]) {
        const before = results.find((entry) => entry.id === result.id) ?? null;
        await this.insertAudit(client, tenantId, actor, "result", String(result.id), "release", before, result);
      }
      for (const sample of releasedSamples.rows as DbRow[]) {
        const before = samples.find((entry) => entry.id === sample.id) ?? null;
        await this.insertAudit(client, tenantId, actor, "sample", String(sample.id), "release", before, sample);
      }

      await client.query("COMMIT");
      return { message: `${String(report.report_number)} released.`, snapshot: await this.getSnapshot(tenantId) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async amendReport(tenantId: string, reportId: string, note: string, actor: SessionActor): Promise<WorkflowMutationResult> {
    if (actor.role !== "pathologist" && actor.role !== "super_admin") {
      throw new BadRequestException(`Role ${actor.role} cannot amend reports`);
    }
    if (!note.trim()) {
      throw new BadRequestException("Amendment note is required");
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const reportResult = await client.query("SELECT * FROM reports WHERE tenant_id = $1 AND id = $2 FOR UPDATE", [tenantId, reportId]);
      const report = reportResult.rows[0] as DbRow | undefined;
      if (!report) {
        throw new NotFoundException(`Unknown report: ${reportId}`);
      }
      if (report.status !== "released" && report.status !== "amended") {
        throw new BadRequestException("Only released reports can be amended");
      }

      const versionResult = await client.query<{ next_version: number }>(
        "SELECT COALESCE(max(version), 0) + 1 AS next_version FROM report_amendments WHERE tenant_id = $1 AND report_id = $2",
        [tenantId, reportId]
      );
      const version = Number(versionResult.rows[0]?.next_version ?? 1);
      const now = new Date();
      const amendmentId = `amd_${reportId}_${version}`;
      const amendment = await client.query(
        `INSERT INTO report_amendments (id, tenant_id, report_id, version, note, amended_by, amended_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [amendmentId, tenantId, reportId, version, note, actor.displayName, now]
      );
      const updatedReport = await client.query(
        `UPDATE reports
         SET status = 'amended', amendment_note = $1, updated_at = $2, updated_by = $3
         WHERE tenant_id = $4 AND id = $5
         RETURNING *`,
        [note, now, actor.displayName, tenantId, reportId]
      );

      await this.insertAudit(client, tenantId, actor, "report", reportId, "amend", report, {
        report: updatedReport.rows[0],
        amendment: amendment.rows[0]
      });
      await client.query("COMMIT");
      return { message: `${String(report.report_number)} amended with version ${version}.`, snapshot: await this.getSnapshot(tenantId) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createDraftReportForOrder(tenantId: string, orderId: string, actor: SessionActor): Promise<WorkflowMutationResult> {
    if (actor.role !== "pathologist" && actor.role !== "super_admin") {
      throw new BadRequestException(`Role ${actor.role} cannot create draft reports`);
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const orderResult = await client.query("SELECT * FROM lab_orders WHERE tenant_id = $1 AND id = $2", [tenantId, orderId]);
      const order = orderResult.rows[0] as DbRow | undefined;
      if (!order) {
        throw new NotFoundException(`Unknown order: ${orderId}`);
      }

      const existing = await client.query("SELECT * FROM reports WHERE tenant_id = $1 AND order_id = $2", [tenantId, orderId]);
      if (existing.rows[0]) {
        await client.query("COMMIT");
        return { message: `${String(existing.rows[0].report_number)} already exists.`, snapshot: await this.getSnapshot(tenantId) };
      }

      const countResult = await client.query<{ count: string }>("SELECT count(*) FROM reports WHERE tenant_id = $1", [tenantId]);
      const next = Number(countResult.rows[0]?.count ?? 0) + 1;
      const prefix = tenantId === "tenant_cedar" ? "CED" : "LUM";
      const now = new Date();
      const reportId = `rep_${prefix.toLowerCase()}_${next + 20}`;
      const reportNumber = `RPT-${prefix}-${4500 + next}`;
      const report = await client.query(
        `INSERT INTO reports (id, tenant_id, order_id, report_number, status, created_at, updated_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, 'draft', $5, $5, $6, $6)
         RETURNING *`,
        [reportId, tenantId, orderId, reportNumber, now, actor.displayName]
      );
      await this.insertAudit(client, tenantId, actor, "report", reportId, "create", null, report.rows[0]);
      await client.query("COMMIT");
      return { message: `${reportNumber} drafted.`, snapshot: await this.getSnapshot(tenantId) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async query(sql: string, values: unknown[]) {
    const result = await this.pool.query(sql, values);
    return result.rows as DbRow[];
  }

  private async insertAudit(
    client: PoolClient,
    tenantId: string,
    actor: SessionActor,
    entityType: AuditEntity,
    entityId: string,
    action: string,
    beforeState: unknown,
    afterState: unknown
  ) {
    await client.query(
      `INSERT INTO audit_logs (tenant_id, actor_name, actor_role, entity_type, entity_id, action, before_state, after_state)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
      [
        tenantId,
        actor.displayName,
        actor.role,
        entityType,
        entityId,
        action,
        beforeState === null ? null : JSON.stringify(beforeState),
        afterState === null ? null : JSON.stringify(afterState)
      ]
    );
  }

  private mapAudit(row: DbRow) {
    return {
      tenantId: String(row.tenant_id),
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at),
      createdBy: String(row.created_by),
      updatedBy: String(row.updated_by)
    };
  }

  private mapPatient = (row: DbRow): PatientRecord => ({
    ...this.mapAudit(row),
    id: String(row.id),
    mrn: String(row.mrn),
    fullName: String(row.full_name),
    phone: String(row.phone),
    nationalId: String(row.national_id),
    dateOfBirth: String(row.date_of_birth),
    sex: row.sex as PatientRecord["sex"],
    consentedAt: iso(row.consented_at)
  });

  private mapAppointment = (row: DbRow): AppointmentRecord => ({
    ...this.mapAudit(row),
    id: String(row.id),
    patientId: String(row.patient_id),
    status: row.status as AppointmentRecord["status"],
    channel: row.channel as AppointmentRecord["channel"],
    scheduledAt: iso(row.scheduled_at),
    branchName: String(row.branch_name)
  });

  private mapOrder = (row: DbRow): OrderRecord => ({
    ...this.mapAudit(row),
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
    ...this.mapAudit(row),
    id: String(row.id),
    orderId: String(row.order_id),
    barcode: String(row.barcode),
    specimen: String(row.specimen),
    status: row.status as SampleRecord["status"],
    collectedAt: row.collected_at ? iso(row.collected_at) : undefined,
    lastCheckpoint: String(row.last_checkpoint)
  });

  private mapResult = (row: DbRow): ResultRecord => ({
    ...this.mapAudit(row),
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
    ...this.mapAudit(row),
    id: String(row.id),
    orderId: String(row.order_id),
    invoiceNumber: String(row.invoice_number),
    status: row.status as InvoiceRecord["status"],
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    currency: row.currency as InvoiceRecord["currency"]
  });

  private mapReport = (row: DbRow): ReportRecord => ({
    ...this.mapAudit(row),
    id: String(row.id),
    orderId: String(row.order_id),
    reportNumber: String(row.report_number),
    status: row.status as ReportRecord["status"],
    releasedAt: row.released_at ? iso(row.released_at) : undefined,
    releasedBy: row.released_by ? String(row.released_by) : undefined,
    amendmentNote: row.amendment_note ? String(row.amendment_note) : undefined
  });

  private mapCriticalAlert = (row: DbRow): CriticalAlertRecord => ({
    ...this.mapAudit(row),
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
}
