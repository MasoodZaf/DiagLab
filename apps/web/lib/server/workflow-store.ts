import {
  sampleWorkflowRules,
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
  type TenantSnapshot
} from "@lab/contracts";
import { getTenantConfig } from "@lab/branding";
import { getTenantSnapshot } from "@lab/demo-data";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type RegistrationInput = {
  actor: SessionActor;
  fullName: string;
  phone: string;
  nationalId: string;
  tests: string[];
  totalAmount: number;
  homeCollection: boolean;
};

/** Locale-agnostic status message: a dictionary key + interpolation params.
 * The client renders it with the active locale's translator. */
export type StatusMessage = {
  code: string;
  params?: Record<string, string | number>;
};

type MutationResult = {
  message: StatusMessage;
  snapshot: TenantSnapshot;
};

/** Thrown for guardrail / validation failures, carrying a translatable code. */
export class WorkflowError extends Error {
  code: string;
  params?: Record<string, string | number>;
  constructor(code: string, params?: Record<string, string | number>) {
    super(code);
    this.name = "WorkflowError";
    this.code = code;
    this.params = params;
  }
}

/** Convert any thrown error into a translatable StatusMessage for the API response. */
export function statusFromError(error: unknown): StatusMessage {
  if (error instanceof WorkflowError) {
    return { code: error.code, params: error.params };
  }
  return { code: "status.unknownError" };
}

const stateFilePath = resolve(process.cwd(), ".data", "workflow-state.json");
const snapshots = new Map<string, TenantSnapshot>();
let hasLoadedPersistedState = false;

function cloneSnapshot(snapshot: TenantSnapshot): TenantSnapshot {
  return structuredClone(normalizeSnapshot(snapshot));
}

function normalizeSnapshot(snapshot: TenantSnapshot): TenantSnapshot {
  snapshot.auditLogs ??= [];
  snapshot.reportAmendments ??= [];
  return snapshot;
}

function getMutableSnapshot(tenantSlug: string) {
  loadPersistedState();
  const tenant = getTenantConfig(tenantSlug);
  const existing = snapshots.get(tenant.id);

  if (existing) {
    return existing;
  }

  const seeded = cloneSnapshot(getTenantSnapshot(tenant.id));
  snapshots.set(tenant.id, seeded);
  return seeded;
}

function loadPersistedState() {
  if (hasLoadedPersistedState) {
    return;
  }

  hasLoadedPersistedState = true;

  if (!existsSync(stateFilePath)) {
    return;
  }

  try {
    const persisted = JSON.parse(readFileSync(stateFilePath, "utf8")) as Record<string, TenantSnapshot>;
    for (const [tenantId, snapshot] of Object.entries(persisted)) {
      snapshots.set(tenantId, normalizeSnapshot(snapshot));
    }
  } catch {
    snapshots.clear();
  }
}

function persistState() {
  mkdirSync(dirname(stateFilePath), { recursive: true });
  writeFileSync(stateFilePath, JSON.stringify(Object.fromEntries(snapshots), null, 2));
}

function tenantPrefix(tenantId: string) {
  return tenantId === "tenant_cedar" ? "CD" : "LM";
}

function nextId(prefix: string, count: number) {
  return `${prefix}_${count + 100}`;
}

function response(code: string, params: StatusMessage["params"], snapshot: TenantSnapshot): MutationResult {
  return {
    message: { code, params },
    snapshot: cloneSnapshot(snapshot)
  };
}

function audit(
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
}

export const workflowStore = {
  getSnapshot(tenantSlug: string) {
    return cloneSnapshot(getMutableSnapshot(tenantSlug));
  },

  /** Demo reset: drop all in-memory + persisted workflow state so the next read
   *  reseeds clean from @lab/demo-data. Keeps the demo from ever getting stuck. */
  reset() {
    snapshots.clear();
    hasLoadedPersistedState = false;
    try {
      if (existsSync(stateFilePath)) {
        rmSync(stateFilePath);
      }
    } catch {
      // best-effort; an unreadable/locked file simply gets overwritten on next persist
    }
  },

  registerPatientAndOrder(tenantSlug: string, input: RegistrationInput): MutationResult {
    const tenant = getTenantConfig(tenantSlug);
    const snapshot = getMutableSnapshot(tenantSlug);
    const now = new Date().toISOString();
    const prefix = tenantPrefix(tenant.id);
    const patientCount = snapshot.patients.length + 1;

    const patient: PatientRecord = {
      id: nextId("pat", patientCount),
      tenantId: tenant.id,
      mrn: `${prefix}-${240220 + patientCount}`,
      fullName: input.fullName,
      phone: input.phone,
      nationalId: input.nationalId,
      dateOfBirth: "1996-03-18",
      sex: "female",
      consentedAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: input.actor.displayName,
      updatedBy: input.actor.displayName
    };

    const appointment = {
      id: nextId("apt", snapshot.appointments.length + 1),
      tenantId: tenant.id,
      patientId: patient.id,
      status: input.homeCollection ? "assigned" : "scheduled",
      channel: input.homeCollection ? "home_collection" : "walk_in",
      scheduledAt: now,
      branchName: input.actor.branchName ?? "Central Lab",
      createdAt: now,
      updatedAt: now,
      createdBy: input.actor.displayName,
      updatedBy: input.actor.displayName
    } as const;

    const order: OrderRecord = {
      id: nextId("ord", snapshot.orders.length + 1),
      tenantId: tenant.id,
      patientId: patient.id,
      appointmentId: appointment.id,
      orderNumber: `${prefix}-2026-${5000 + snapshot.orders.length + 1}`,
      tests: input.tests,
      status: input.homeCollection ? "in_progress" : "registered",
      branchName: appointment.branchName,
      homeCollection: input.homeCollection,
      createdAt: now,
      updatedAt: now,
      createdBy: input.actor.displayName,
      updatedBy: input.actor.displayName
    };

    const sample: SampleRecord = {
      id: nextId("sam", snapshot.samples.length + 1),
      tenantId: tenant.id,
      orderId: order.id,
      barcode: `${prefix}BC${5000 + snapshot.samples.length + 1}`,
      specimen: input.tests.length > 1 ? "Multi-tube set" : "Serum",
      status: input.homeCollection ? "scheduled" : "registered",
      lastCheckpoint: input.homeCollection ? "Route assigned to phlebotomist" : "Awaiting collection desk",
      createdAt: now,
      updatedAt: now,
      createdBy: input.actor.displayName,
      updatedBy: input.actor.displayName
    };

    const invoice: InvoiceRecord = {
      id: nextId("inv", snapshot.invoices.length + 1),
      tenantId: tenant.id,
      orderId: order.id,
      invoiceNumber: `INV-${prefix}-${6000 + snapshot.invoices.length + 1}`,
      status: "issued",
      totalAmount: input.totalAmount,
      paidAmount: 0,
      currency: tenant.locale === "en-GB" ? "GBP" : "PKR",
      createdAt: now,
      updatedAt: now,
      createdBy: input.actor.displayName,
      updatedBy: input.actor.displayName
    };

    snapshot.patients.push(patient);
    snapshot.appointments.push(appointment);
    snapshot.orders.push(order);
    snapshot.samples.push(sample);
    snapshot.invoices.push(invoice);
    audit(snapshot, input.actor, "order", order.id, "register_patient_order", undefined, {
      patientId: patient.id,
      appointmentId: appointment.id,
      sampleId: sample.id,
      invoiceId: invoice.id
    });
    persistState();

    return response("status.orderRegistered", { name: patient.fullName, orderNumber: order.orderNumber }, snapshot);
  },

  transitionSample(tenantSlug: string, sampleId: string, nextStatus: SampleRecord["status"], actor: SessionActor): MutationResult {
    const snapshot = getMutableSnapshot(tenantSlug);
    const sample = snapshot.samples.find((entry) => entry.id === sampleId);

    if (!sample) {
      throw new WorkflowError("status.sampleNotFound");
    }

    const rule = sampleWorkflowRules.find((entry) => entry.from === sample.status && entry.to === nextStatus);
    if (!rule || !rule.allowedRoles.includes(actor.role)) {
      throw new WorkflowError("status.invalidTransition");
    }

    const before = structuredClone(sample);
    const now = new Date().toISOString();
    sample.status = nextStatus;
    sample.collectedAt = nextStatus === "collected" ? now : sample.collectedAt;
    sample.lastCheckpoint = `${nextStatus} by ${actor.displayName}`;
    sample.updatedAt = now;
    sample.updatedBy = actor.displayName;

    const order = snapshot.orders.find((entry) => entry.id === sample.orderId);
    if (order) {
      const orderBefore = structuredClone(order);
      order.status = nextStatus === "verified" ? "awaiting_release" : nextStatus === "released" ? "released" : order.status;
      order.updatedAt = now;
      order.updatedBy = actor.displayName;
      audit(snapshot, actor, "order", order.id, "sample_transition_sync", orderBefore, order);
    }
    audit(snapshot, actor, "sample", sample.id, "transition", before, sample);
    persistState();

    return response("status.sampleMoved", { barcode: sample.barcode, status: nextStatus }, snapshot);
  },

  validateResult(tenantSlug: string, resultId: string, actor: SessionActor): MutationResult {
    const snapshot = getMutableSnapshot(tenantSlug);
    const result = snapshot.results.find((entry) => entry.id === resultId);

    if (!result) {
      throw new WorkflowError("status.resultNotFound");
    }

    const before = structuredClone(result);
    const now = new Date().toISOString();
    result.status = "validated";
    result.validatorName = actor.displayName;
    result.updatedAt = now;
    result.updatedBy = actor.displayName;
    audit(snapshot, actor, "result", result.id, "validate", before, result);
    persistState();

    return response("status.resultValidated", { test: result.testName }, snapshot);
  },

  acknowledgeAlert(tenantSlug: string, alertId: string, actor: SessionActor): MutationResult {
    const snapshot = getMutableSnapshot(tenantSlug);
    const alert = snapshot.criticalAlerts.find((entry) => entry.id === alertId);

    if (!alert) {
      throw new WorkflowError("status.alertNotFound");
    }

    const before = structuredClone(alert);
    const now = new Date().toISOString();
    alert.status = "acknowledged";
    alert.acknowledgedAt = now;
    alert.acknowledgedBy = actor.displayName;
    alert.updatedAt = now;
    alert.updatedBy = actor.displayName;
    audit(snapshot, actor, "critical_alert", alert.id, "acknowledge", before, alert);
    persistState();

    return response("status.alertAcknowledged", undefined, snapshot);
  },

  recordInvoicePayment(tenantSlug: string, invoiceId: string, amount: number, actor: SessionActor): MutationResult {
    const snapshot = getMutableSnapshot(tenantSlug);
    const invoice = snapshot.invoices.find((entry) => entry.id === invoiceId);

    if (!invoice) {
      throw new WorkflowError("status.invoiceNotFound");
    }
    if (!["patient", "receptionist", "super_admin"].includes(actor.role)) {
      throw new WorkflowError("status.roleCannotPay");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new WorkflowError("status.paymentMustBePositive");
    }

    const outstanding = invoice.totalAmount - invoice.paidAmount;
    if (amount > outstanding) {
      throw new WorkflowError("status.paymentExceedsOutstanding");
    }

    const before = structuredClone(invoice);
    const now = new Date().toISOString();
    invoice.paidAmount += amount;
    invoice.status = invoice.paidAmount >= invoice.totalAmount ? "paid" : "partially_paid";
    invoice.updatedAt = now;
    invoice.updatedBy = actor.displayName;
    audit(snapshot, actor, "invoice", invoice.id, "record_payment", before, invoice);
    persistState();

    return response("status.paymentRecorded", { invoice: invoice.invoiceNumber }, snapshot);
  },

  releaseReport(tenantSlug: string, reportId: string, actor: SessionActor): MutationResult {
    const snapshot = getMutableSnapshot(tenantSlug);
    const report = snapshot.reports.find((entry) => entry.id === reportId);

    if (!report) {
      throw new WorkflowError("status.reportNotFound");
    }

    const results = snapshot.results.filter((entry) => entry.orderId === report.orderId);
    const openAlerts = snapshot.criticalAlerts.filter((alert) =>
      alert.status === "open" && results.some((result) => result.id === alert.resultId)
    );

    if (openAlerts.length > 0) {
      throw new WorkflowError("status.criticalAlertMustAck");
    }

    if (results.length === 0 || results.some((result) => result.status !== "validated" && result.status !== "released")) {
      throw new WorkflowError("status.allResultsMustValidate");
    }

    const reportBefore = structuredClone(report);
    const resultBefore = results.map((result) => structuredClone(result));
    const orderBefore = snapshot.orders.find((entry) => entry.id === report.orderId);
    const clonedOrderBefore = orderBefore ? structuredClone(orderBefore) : undefined;
    const sampleBefore = snapshot.samples.filter((entry) => entry.orderId === report.orderId).map((sample) => structuredClone(sample));
    const now = new Date().toISOString();
    report.status = "released";
    report.releasedAt = now;
    report.releasedBy = actor.displayName;
    report.updatedAt = now;
    report.updatedBy = actor.displayName;

    for (const result of results) {
      result.status = "released";
      result.updatedAt = now;
      result.updatedBy = actor.displayName;
    }

    const order = snapshot.orders.find((entry) => entry.id === report.orderId);
    if (order) {
      order.status = "released";
      order.updatedAt = now;
      order.updatedBy = actor.displayName;
    }

    for (const sample of snapshot.samples.filter((entry) => entry.orderId === report.orderId)) {
      sample.status = "released";
      sample.lastCheckpoint = "Released to patient portal";
      sample.updatedAt = now;
      sample.updatedBy = actor.displayName;
    }
    audit(snapshot, actor, "report", report.id, "release", reportBefore, report);
    if (order) {
      audit(snapshot, actor, "order", order.id, "release", clonedOrderBefore, order);
    }
    for (const result of results) {
      audit(snapshot, actor, "result", result.id, "release", resultBefore.find((entry) => entry.id === result.id), result);
    }
    for (const sample of snapshot.samples.filter((entry) => entry.orderId === report.orderId)) {
      audit(snapshot, actor, "sample", sample.id, "release", sampleBefore.find((entry) => entry.id === sample.id), sample);
    }
    persistState();

    return response("status.reportReleased", { report: report.reportNumber }, snapshot);
  },

  amendReport(tenantSlug: string, reportId: string, note: string, actor: SessionActor): MutationResult {
    const snapshot = getMutableSnapshot(tenantSlug);
    const report = snapshot.reports.find((entry) => entry.id === reportId);

    if (!report) {
      throw new WorkflowError("status.reportNotFound");
    }
    if (report.status !== "released" && report.status !== "amended") {
      throw new WorkflowError("status.onlyReleasedCanAmend");
    }
    if (!note.trim()) {
      throw new WorkflowError("status.amendmentNoteRequired");
    }

    const before = structuredClone(report);
    const now = new Date().toISOString();
    const version = snapshot.reportAmendments.filter((entry) => entry.reportId === report.id).length + 1;
    const amendment: ReportAmendmentRecord = {
      id: `amd_${report.id}_${version}`,
      tenantId: snapshot.tenantId,
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
    audit(snapshot, actor, "report", report.id, "amend", before, { report, amendment });
    persistState();

    return response("status.reportAmended", { report: report.reportNumber, version }, snapshot);
  }
};
