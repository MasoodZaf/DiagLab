import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  roleCapabilities,
  resultWorkflowRules,
  sampleWorkflowRules,
  userRoles,
  type AuditLogRecord,
  type CriticalAlertRecord,
  type InvoiceRecord,
  type OrderRecord,
  type PatientRecord,
  type ReportAmendmentRecord,
  type ReportRecord,
  type ResultRecord,
  type SampleRecord,
  type SessionActor,
  type TenantSnapshot,
  type UserRole
} from "@lab/contracts";
import { getTenantSnapshot, sessionActors } from "@lab/demo-data";

type AuditActorInput = {
  role: UserRole;
  displayName: string;
  branchName?: string;
};

type RegisterPatientInput = {
  fullName: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  sex: PatientRecord["sex"];
  branchName: string;
  scheduledAt: string;
  channel: "walk_in" | "portal" | "whatsapp" | "home_collection";
  tests: string[];
  homeCollection: boolean;
  totalAmount: number;
  currency: InvoiceRecord["currency"];
};

type TransitionSampleInput = {
  sampleId: string;
  nextStatus: SampleRecord["status"];
  checkpoint: string;
  reason?: string;
};

@Injectable()
export class PlatformStoreService {
  private readonly snapshots = new Map<string, TenantSnapshot>();
  private readonly sessions = new Map<string, SessionActor[]>();

  constructor() {
    for (const [tenantId, actors] of Object.entries(sessionActors)) {
      this.sessions.set(tenantId, actors.map((actor) => ({ ...actor, capabilities: [...actor.capabilities] })));
    }

    for (const tenantId of Object.keys(sessionActors)) {
      this.snapshots.set(tenantId, structuredClone(getTenantSnapshot(tenantId)));
    }
  }

  listPatients(tenantId: string) {
    return this.requireSnapshot(tenantId).patients;
  }

  listOrders(tenantId: string) {
    return this.requireSnapshot(tenantId).orders;
  }

  listReports(tenantId: string) {
    return this.requireSnapshot(tenantId).reports;
  }

  getSnapshot(tenantId: string) {
    return this.requireSnapshot(tenantId);
  }

  getActor(tenantId: string, role: UserRole) {
    return this.requireActor(tenantId, role);
  }

  registerPatientAndOrder(tenantId: string, actorInput: AuditActorInput, input: RegisterPatientInput) {
    this.assertRole(actorInput.role, ["receptionist", "super_admin"]);
    const snapshot = this.requireSnapshot(tenantId);
    const actor = this.requireActor(tenantId, actorInput.role, actorInput.displayName, actorInput.branchName);
    const now = new Date().toISOString();
    const nextNumber = snapshot.patients.length + 1;
    const tenantPrefix = tenantId === "tenant_cedar" ? "CD" : "LM";
    const patientId = `pat_${tenantPrefix.toLowerCase()}_${nextNumber + 10}`;
    const appointmentId = `apt_${tenantPrefix.toLowerCase()}_${nextNumber + 10}`;
    const orderId = `ord_${tenantPrefix.toLowerCase()}_${nextNumber + 10}`;
    const sampleId = `sam_${tenantPrefix.toLowerCase()}_${nextNumber + 10}`;
    const invoiceId = `inv_${tenantPrefix.toLowerCase()}_${nextNumber + 10}`;

    const patient: PatientRecord = {
      id: patientId,
      tenantId,
      mrn: `${tenantPrefix}-${String(240220 + nextNumber).padStart(6, "0")}`,
      fullName: input.fullName,
      phone: input.phone,
      nationalId: input.nationalId,
      dateOfBirth: input.dateOfBirth,
      sex: input.sex,
      consentedAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: actor.displayName,
      updatedBy: actor.displayName
    };

    const appointmentStatus = input.channel === "home_collection" ? "assigned" : "scheduled";
    const orderStatus = input.channel === "home_collection" ? "in_progress" : "registered";

    const appointment = {
      id: appointmentId,
      tenantId,
      patientId: patient.id,
      status: appointmentStatus,
      channel: input.channel,
      scheduledAt: input.scheduledAt,
      branchName: input.branchName,
      createdAt: now,
      updatedAt: now,
      createdBy: actor.displayName,
      updatedBy: actor.displayName
    } as const;

    const order: OrderRecord = {
      id: orderId,
      tenantId,
      patientId: patient.id,
      appointmentId: appointment.id,
      orderNumber: `${tenantPrefix}-2026-${String(5000 + nextNumber)}`,
      tests: input.tests,
      status: orderStatus,
      branchName: input.branchName,
      homeCollection: input.homeCollection,
      createdAt: now,
      updatedAt: now,
      createdBy: actor.displayName,
      updatedBy: actor.displayName
    };

    const sample: SampleRecord = {
      id: sampleId,
      tenantId,
      orderId: order.id,
      barcode: `${tenantPrefix}BC${5000 + nextNumber}`,
      specimen: input.tests.length > 1 ? "Multi-tube set" : "Serum",
      status: input.homeCollection ? "scheduled" : "registered",
      lastCheckpoint: input.homeCollection ? "Route assigned to phlebotomist" : "Awaiting collection desk",
      createdAt: now,
      updatedAt: now,
      createdBy: actor.displayName,
      updatedBy: actor.displayName
    };

    const invoice: InvoiceRecord = {
      id: invoiceId,
      tenantId,
      orderId: order.id,
      invoiceNumber: `INV-${tenantPrefix}-${6000 + nextNumber}`,
      status: "issued",
      totalAmount: input.totalAmount,
      paidAmount: 0,
      currency: input.currency,
      createdAt: now,
      updatedAt: now,
      createdBy: actor.displayName,
      updatedBy: actor.displayName
    };

    snapshot.patients.push(patient);
    snapshot.appointments.push(appointment);
    snapshot.orders.push(order);
    snapshot.samples.push(sample);
    snapshot.invoices.push(invoice);
    this.audit(snapshot, actor, "order", order.id, "register_patient_order", undefined, {
      patientId: patient.id,
      appointmentId: appointment.id,
      sampleId: sample.id,
      invoiceId: invoice.id
    });

    return { patient, appointment, order, sample, invoice };
  }

  transitionSample(tenantId: string, actorInput: AuditActorInput, input: TransitionSampleInput) {
    const actor = this.requireActor(tenantId, actorInput.role, actorInput.displayName, actorInput.branchName);
    const snapshot = this.requireSnapshot(tenantId);
    const sample = snapshot.samples.find((entry) => entry.id === input.sampleId);

    if (!sample) {
      throw new NotFoundException(`Unknown sample: ${input.sampleId}`);
    }

    const rule = sampleWorkflowRules.find((entry) => entry.from === sample.status && entry.to === input.nextStatus);

    if (!rule) {
      throw new BadRequestException(`Invalid sample transition from ${sample.status} to ${input.nextStatus}`);
    }

    if (!rule.allowedRoles.includes(actor.role)) {
      throw new BadRequestException(`Role ${actor.role} cannot move sample from ${sample.status} to ${input.nextStatus}`);
    }

    if (rule.requiresReason && !input.reason) {
      throw new BadRequestException("A reason is required for this transition");
    }

    const before = structuredClone(sample);
    const now = new Date().toISOString();
    sample.status = input.nextStatus;
    sample.lastCheckpoint = input.checkpoint;
    sample.updatedAt = now;
    sample.updatedBy = actor.displayName;
    if (input.nextStatus === "collected") {
      sample.collectedAt = now;
    }

    const order = snapshot.orders.find((entry) => entry.id === sample.orderId);
    if (order) {
      const orderBefore = structuredClone(order);
      order.updatedAt = now;
      order.updatedBy = actor.displayName;
      if (input.nextStatus === "processing") {
        order.status = "in_progress";
      }
      if (input.nextStatus === "verified") {
        order.status = "awaiting_release";
      }
      if (input.nextStatus === "released") {
        order.status = "released";
      }
      this.audit(snapshot, actor, "order", order.id, "sample_transition_sync", orderBefore, order);
    }

    this.audit(snapshot, actor, "sample", sample.id, "transition", before, sample);
    return sample;
  }

  acknowledgeCriticalAlert(tenantId: string, alertId: string, actorInput: AuditActorInput) {
    this.assertRole(actorInput.role, ["pathologist", "super_admin"]);
    const snapshot = this.requireSnapshot(tenantId);
    const actor = this.requireActor(tenantId, actorInput.role, actorInput.displayName, actorInput.branchName);
    const alert = snapshot.criticalAlerts.find((entry) => entry.id === alertId);

    if (!alert) {
      throw new NotFoundException(`Unknown critical alert: ${alertId}`);
    }

    const before = structuredClone(alert);
    const now = new Date().toISOString();
    alert.status = "acknowledged";
    alert.acknowledgedBy = actor.displayName;
    alert.acknowledgedAt = now;
    alert.updatedAt = now;
    alert.updatedBy = actor.displayName;
    this.audit(snapshot, actor, "critical_alert", alert.id, "acknowledge", before, alert);

    return alert;
  }

  recordInvoicePayment(tenantId: string, invoiceId: string, amount: number, actorInput: AuditActorInput) {
    this.assertRole(actorInput.role, ["patient", "receptionist", "super_admin"]);
    const snapshot = this.requireSnapshot(tenantId);
    const actor = this.requireActor(tenantId, actorInput.role, actorInput.displayName, actorInput.branchName);
    const invoice = snapshot.invoices.find((entry) => entry.id === invoiceId);

    if (!invoice) {
      throw new NotFoundException(`Unknown invoice: ${invoiceId}`);
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException("Payment amount must be greater than zero");
    }

    const outstanding = invoice.totalAmount - invoice.paidAmount;
    if (amount > outstanding) {
      throw new BadRequestException("Payment amount cannot exceed outstanding balance");
    }

    const before = structuredClone(invoice);
    const now = new Date().toISOString();
    invoice.paidAmount += amount;
    invoice.status = invoice.paidAmount >= invoice.totalAmount ? "paid" : "partially_paid";
    invoice.updatedAt = now;
    invoice.updatedBy = actor.displayName;
    this.audit(snapshot, actor, "invoice", invoice.id, "record_payment", before, invoice);

    return invoice;
  }

  validateResult(tenantId: string, resultId: string, actorInput: AuditActorInput) {
    const snapshot = this.requireSnapshot(tenantId);
    const actor = this.requireActor(tenantId, actorInput.role, actorInput.displayName, actorInput.branchName);
    const result = snapshot.results.find((entry) => entry.id === resultId);

    if (!result) {
      throw new NotFoundException(`Unknown result: ${resultId}`);
    }

    const rule = resultWorkflowRules.find((entry) => entry.from === result.status && entry.to === "validated");
    if (!rule) {
      throw new BadRequestException(`Invalid result transition from ${result.status} to validated`);
    }

    if (!rule.allowedRoles.includes(actor.role)) {
      throw new BadRequestException(`Role ${actor.role} cannot validate result ${resultId}`);
    }

    const before = structuredClone(result);
    const now = new Date().toISOString();
    result.status = "validated";
    result.validatorName = actor.displayName;
    result.updatedAt = now;
    result.updatedBy = actor.displayName;
    this.audit(snapshot, actor, "result", result.id, "validate", before, result);

    return result;
  }

  releaseReport(tenantId: string, reportId: string, actorInput: AuditActorInput) {
    this.assertRole(actorInput.role, ["pathologist"]);
    const snapshot = this.requireSnapshot(tenantId);
    const actor = this.requireActor(tenantId, actorInput.role, actorInput.displayName, actorInput.branchName);
    const report = snapshot.reports.find((entry) => entry.id === reportId);

    if (!report) {
      throw new NotFoundException(`Unknown report: ${reportId}`);
    }

    const order = snapshot.orders.find((entry) => entry.id === report.orderId);
    if (!order) {
      throw new NotFoundException(`Missing order for report: ${reportId}`);
    }

    const orderResults = snapshot.results.filter((entry) => entry.orderId === order.id);
    const openAlerts = snapshot.criticalAlerts.filter(
      (entry) => entry.status === "open" && orderResults.some((result) => result.id === entry.resultId)
    );

    if (openAlerts.length > 0) {
      throw new BadRequestException("Release blocked until all critical alerts are acknowledged");
    }

    if (orderResults.length === 0 || orderResults.some((entry) => entry.status !== "validated")) {
      throw new BadRequestException("Release blocked until all order results are validated");
    }

    const reportBefore = structuredClone(report);
    const orderBefore = structuredClone(order);
    const resultBefore = orderResults.map((result) => structuredClone(result));
    const sampleBefore = snapshot.samples.filter((entry) => entry.orderId === order.id).map((sample) => structuredClone(sample));
    const now = new Date().toISOString();
    report.status = "released";
    report.releasedAt = now;
    report.releasedBy = actor.displayName;
    report.updatedAt = now;
    report.updatedBy = actor.displayName;

    for (const result of orderResults) {
      result.status = "released";
      result.updatedAt = now;
      result.updatedBy = actor.displayName;
      result.validatorName = actor.displayName;
    }

    for (const sample of snapshot.samples.filter((entry) => entry.orderId === order.id)) {
      sample.status = "released";
      sample.lastCheckpoint = "Released to patient channels";
      sample.updatedAt = now;
      sample.updatedBy = actor.displayName;
    }

    order.status = "released";
    order.updatedAt = now;
    order.updatedBy = actor.displayName;

    this.audit(snapshot, actor, "report", report.id, "release", reportBefore, report);
    this.audit(snapshot, actor, "order", order.id, "release", orderBefore, order);
    for (const result of orderResults) {
      this.audit(snapshot, actor, "result", result.id, "release", resultBefore.find((entry) => entry.id === result.id), result);
    }
    for (const sample of snapshot.samples.filter((entry) => entry.orderId === order.id)) {
      this.audit(snapshot, actor, "sample", sample.id, "release", sampleBefore.find((entry) => entry.id === sample.id), sample);
    }

    return {
      report,
      order,
      results: orderResults
    };
  }

  amendReport(tenantId: string, reportId: string, note: string, actorInput: AuditActorInput) {
    this.assertRole(actorInput.role, ["pathologist", "super_admin"]);
    const snapshot = this.requireSnapshot(tenantId);
    const actor = this.requireActor(tenantId, actorInput.role, actorInput.displayName, actorInput.branchName);
    const report = snapshot.reports.find((entry) => entry.id === reportId);

    if (!report) {
      throw new NotFoundException(`Unknown report: ${reportId}`);
    }
    if (report.status !== "released" && report.status !== "amended") {
      throw new BadRequestException("Only released reports can be amended");
    }
    if (!note.trim()) {
      throw new BadRequestException("Amendment note is required");
    }

    const before = structuredClone(report);
    const now = new Date().toISOString();
    const version = snapshot.reportAmendments.filter((entry) => entry.reportId === report.id).length + 1;
    const amendment: ReportAmendmentRecord = {
      id: `amd_${report.id}_${version}`,
      tenantId,
      reportId: report.id,
      version,
      note,
      amendedBy: actor.displayName,
      amendedAt: now
    };

    report.status = "amended";
    report.amendmentNote = note;
    report.updatedAt = now;
    report.updatedBy = actor.displayName;
    snapshot.reportAmendments.push(amendment);
    this.audit(snapshot, actor, "report", report.id, "amend", before, { report, amendment });

    return {
      report,
      amendment
    };
  }

  createDraftReportForOrder(tenantId: string, orderId: string, actorInput: AuditActorInput) {
    this.assertRole(actorInput.role, ["pathologist", "super_admin"]);
    const snapshot = this.requireSnapshot(tenantId);
    const actor = this.requireActor(tenantId, actorInput.role, actorInput.displayName, actorInput.branchName);
    const order = snapshot.orders.find((entry) => entry.id === orderId);

    if (!order) {
      throw new NotFoundException(`Unknown order: ${orderId}`);
    }

    const existing = snapshot.reports.find((entry) => entry.orderId === order.id);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const tenantPrefix = tenantId === "tenant_cedar" ? "CED" : "LUM";
    const report: ReportRecord = {
      id: `rep_${tenantPrefix.toLowerCase()}_${snapshot.reports.length + 20}`,
      tenantId,
      orderId,
      reportNumber: `RPT-${tenantPrefix}-${4500 + snapshot.reports.length}`,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      createdBy: actor.displayName,
      updatedBy: actor.displayName
    };

    snapshot.reports.push(report);
    this.audit(snapshot, actor, "report", report.id, "create", undefined, report);
    return report;
  }

  private requireSnapshot(tenantId: string) {
    const snapshot = this.snapshots.get(tenantId);

    if (!snapshot) {
      throw new NotFoundException(`Unknown tenant snapshot: ${tenantId}`);
    }

    return snapshot;
  }

  private requireActor(tenantId: string, role: UserRole, displayName?: string, branchName?: string) {
    const actors = this.sessions.get(tenantId) ?? [];
    const existing = actors.find((entry) => entry.role === role && (!displayName || entry.displayName === displayName));

    if (existing) {
      return existing;
    }

    const capabilities = roleCapabilities.find((entry) => entry.role === role)?.capabilities ?? [];
    const fallback: SessionActor = {
      id: `generated_${tenantId}_${role}`,
      tenantId,
      role,
      displayName: displayName ?? role.replaceAll("_", " "),
      branchName,
      capabilities
    };

    actors.push(fallback);
    this.sessions.set(tenantId, actors);
    return fallback;
  }

  private audit(
    snapshot: TenantSnapshot,
    actor: SessionActor,
    entityType: string,
    entityId: string,
    action: string,
    beforeState: unknown,
    afterState: unknown
  ) {
    const now = new Date().toISOString();
    const record: AuditLogRecord = {
      id: `audit_${snapshot.auditLogs.length + 1}`,
      tenantId: snapshot.tenantId,
      actorName: actor.displayName,
      actorRole: actor.role,
      entityType,
      entityId,
      action,
      beforeState,
      afterState,
      createdAt: now
    };

    snapshot.auditLogs.unshift(record);
    return record;
  }

  private assertRole(role: UserRole, allowed: UserRole[]) {
    if (!userRoles.includes(role) || !allowed.includes(role)) {
      throw new BadRequestException(`Role ${role} is not allowed for this operation`);
    }
  }
}
