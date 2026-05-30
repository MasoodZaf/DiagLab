import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PlatformStoreService } from "../src/modules/platform-data/platform-store.service";

const tenantId = "tenant_lumen";
const pathologist = {
  role: "pathologist" as const,
  displayName: "Dr. Mehak Ali",
  branchName: "Central Lab"
};
const technician = {
  role: "technician" as const,
  displayName: "Usman Tariq",
  branchName: "Central Lab"
};
const receptionist = {
  role: "receptionist" as const,
  displayName: "Sana Waheed",
  branchName: "Gulberg"
};

describe("clinical workflow guardrails", () => {
  test("rejects invalid sample state transitions and preserves the current state", () => {
    const store = new PlatformStoreService();

    assert.throws(
      () =>
        store.transitionSample(tenantId, technician, {
          sampleId: "sam_lum_2",
          nextStatus: "processing",
          checkpoint: "Attempted downgrade"
        }),
      /Invalid sample transition from verified to processing/
    );

    const snapshot = store.getSnapshot(tenantId);
    assert.equal(snapshot.samples.find((sample) => sample.id === "sam_lum_2")?.status, "verified");
  });

  test("requires critical alert acknowledgment before report release", () => {
    const store = new PlatformStoreService();

    assert.throws(
      () => store.releaseReport(tenantId, "rep_lum_1", pathologist),
      /Release blocked until all critical alerts are acknowledged/
    );

    const snapshot = store.getSnapshot(tenantId);
    assert.equal(snapshot.reports.find((report) => report.id === "rep_lum_1")?.status, "draft");
  });

  test("blocks report release for non-pathologist actors", () => {
    const store = new PlatformStoreService();

    assert.throws(
      () => store.releaseReport(tenantId, "rep_lum_1", receptionist),
      /Role receptionist is not allowed/
    );
  });

  test("validates critical-alert acknowledgment then releases the report cascade", () => {
    const store = new PlatformStoreService();

    const alert = store.acknowledgeCriticalAlert(tenantId, "crit_lum_1", pathologist);
    assert.equal(alert.status, "acknowledged");
    assert.equal(alert.acknowledgedBy, pathologist.displayName);

    const release = store.releaseReport(tenantId, "rep_lum_1", pathologist);
    assert.equal(release.report.status, "released");
    assert.equal(release.order.status, "released");
    assert.equal(release.results.every((result) => result.status === "released"), true);

    const snapshot = store.getSnapshot(tenantId);
    assert.equal(snapshot.samples.find((sample) => sample.id === "sam_lum_2")?.status, "released");
    assert.equal(snapshot.auditLogs.some((entry) => entry.action === "acknowledge" && entry.entityId === "crit_lum_1"), true);
    assert.equal(snapshot.auditLogs.some((entry) => entry.action === "release" && entry.entityType === "report"), true);
  });

  test("pathologist validation records the validator on entered results", () => {
    const store = new PlatformStoreService();

    const result = store.validateResult(tenantId, "res_lum_1", pathologist);
    assert.equal(result.status, "validated");
    assert.equal(result.validatorName, pathologist.displayName);
    assert.equal(result.updatedBy, pathologist.displayName);

    const snapshot = store.getSnapshot(tenantId);
    const audit = snapshot.auditLogs.find((entry) => entry.action === "validate" && entry.entityId === "res_lum_1");
    assert.equal(audit?.actorName, pathologist.displayName);
    assert.equal(audit?.tenantId, tenantId);
  });

  test("keeps audit logs isolated per tenant", () => {
    const store = new PlatformStoreService();

    store.validateResult(tenantId, "res_lum_1", pathologist);

    assert.equal(store.getSnapshot(tenantId).auditLogs.length, 1);
    assert.equal(store.getSnapshot("tenant_cedar").auditLogs.length, 0);
  });

  test("records invoice payments and audits payment confirmation", () => {
    const store = new PlatformStoreService();

    const invoice = store.recordInvoicePayment(tenantId, "inv_lum_2", 2300, receptionist);
    assert.equal(invoice.status, "paid");
    assert.equal(invoice.paidAmount, invoice.totalAmount);

    const snapshot = store.getSnapshot(tenantId);
    const audit = snapshot.auditLogs.find((entry) => entry.action === "record_payment" && entry.entityId === "inv_lum_2");
    assert.equal(audit?.actorName, receptionist.displayName);
    assert.equal(audit?.entityType, "invoice");
  });

  test("rejects invoice overpayments", () => {
    const store = new PlatformStoreService();

    assert.throws(
      () => store.recordInvoicePayment(tenantId, "inv_lum_2", 999999, receptionist),
      /cannot exceed outstanding balance/
    );
  });

  test("amends released reports with immutable amendment history", () => {
    const store = new PlatformStoreService();

    store.acknowledgeCriticalAlert(tenantId, "crit_lum_1", pathologist);
    store.releaseReport(tenantId, "rep_lum_1", pathologist);
    const amendment = store.amendReport(tenantId, "rep_lum_1", "Corrected interpretive note.", pathologist);

    assert.equal(amendment.report.status, "amended");
    assert.equal(amendment.amendment.version, 1);
    assert.equal(amendment.amendment.note, "Corrected interpretive note.");

    const snapshot = store.getSnapshot(tenantId);
    assert.equal(snapshot.reportAmendments.length, 1);
    assert.equal(snapshot.auditLogs.some((entry) => entry.action === "amend" && entry.entityId === "rep_lum_1"), true);
  });

  test("blocks amendment before report release", () => {
    const store = new PlatformStoreService();

    assert.throws(
      () => store.amendReport(tenantId, "rep_lum_1", "Premature correction", pathologist),
      /Only released reports can be amended/
    );
  });
});
