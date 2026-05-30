import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { renderTenantNotification } from "../src/notifications";
import { getTenantConfig } from "../src/tenants";

describe("tenant notification rendering", () => {
  test("renders report release email with tenant branding and variables", () => {
    const notification = renderTenantNotification(getTenantConfig("lumen"), "reportReleased", "email", {
      reportNumber: "RPT-LUM-4401",
      releasedBy: "Dr. Mehak Ali"
    });

    assert.equal(notification.fromName, "Lumen Diagnostics");
    assert.equal(notification.subject, "Lumen Diagnostics report ready: RPT-LUM-4401");
    assert.match(notification.body, /Dr\. Mehak Ali/);
    assert.equal(notification.ctaLabel, "Open report");
  });

  test("keeps tenant wording distinct across brands", () => {
    const lumen = renderTenantNotification(getTenantConfig("lumen"), "appointmentBooked", "sms", {
      patientName: "Areeba Khan",
      appointmentTime: "29 May, 10:00",
      branchName: "Gulberg",
      orderNumber: "LUM-2026-4013"
    });
    const cedar = renderTenantNotification(getTenantConfig("cedar"), "appointmentBooked", "sms", {
      patientName: "Sophia Reed",
      appointmentTime: "29 May, 10:00",
      branchName: "London City",
      orderNumber: "CED-2026-8007"
    });

    assert.equal(lumen.sender, "LUMEN");
    assert.equal(cedar.sender, "CEDAR");
    assert.match(lumen.body, /^Lumen:/);
    assert.match(cedar.body, /^Cedar:/);
  });

  test("fails loudly when a channel template is not configured", () => {
    assert.throws(
      () => renderTenantNotification(getTenantConfig("cedar"), "criticalFollowup", "sms", { testName: "HbA1c" }),
      /Missing sms notification template/
    );
  });
});
