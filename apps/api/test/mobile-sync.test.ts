import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { MobileSyncAction } from "@lab/contracts";
import { MobileSyncService } from "../src/modules/mobile-sync/mobile-sync.service";
import { PlatformDataService } from "../src/modules/platform-data/platform-data.service";
import { PlatformStoreService } from "../src/modules/platform-data/platform-store.service";

const tenantId = "tenant_lumen";
const technician = {
  id: "sess_lumen_tech",
  tenantId,
  role: "technician" as const,
  displayName: "Usman Tariq",
  branchName: "Central Lab",
  capabilities: ["receive_sample", "enter_result", "manage_qc", "reject_sample"]
};

function createSyncService() {
  const store = new PlatformStoreService();
  const platformData = new PlatformDataService(store);
  return {
    store,
    sync: new MobileSyncService(platformData)
  };
}

function sampleTransition(overrides: Partial<MobileSyncAction> = {}): MobileSyncAction {
  return {
    clientActionId: "mobile-action-1",
    tenantId,
    actor: technician,
    type: "sample_transition",
    entityId: "sam_lum_1",
    occurredAt: "2026-05-29T08:00:00Z",
    payload: {
      nextStatus: "completed",
      checkpoint: "Mobile bench completion"
    },
    ...overrides
  };
}

describe("mobile sync reconciliation", () => {
  test("accepts valid queued sample transitions and mutates sample state", async () => {
    const { store, sync } = createSyncService();

    const response = await sync.reconcile({
      deviceId: "phleb-device-1",
      tenantId,
      actions: [sampleTransition()]
    });

    assert.equal(response.accepted.length, 1);
    assert.equal(response.conflicts.length, 0);
    assert.equal(store.getSnapshot(tenantId).samples.find((sample) => sample.id === "sam_lum_1")?.status, "completed");
  });

  test("prevents duplicate submission from mutating twice", async () => {
    const { sync } = createSyncService();
    const action = sampleTransition();

    await sync.reconcile({ deviceId: "phleb-device-1", tenantId, actions: [action] });
    const second = await sync.reconcile({ deviceId: "phleb-device-1", tenantId, actions: [action] });

    assert.equal(second.duplicates.length, 1);
    assert.equal(second.duplicates[0]?.clientActionId, action.clientActionId);
  });

  test("classifies invalid workflow transitions as conflicts", async () => {
    const { sync } = createSyncService();

    const response = await sync.reconcile({
      deviceId: "phleb-device-1",
      tenantId,
      actions: [
        sampleTransition({
          clientActionId: "mobile-action-conflict",
          payload: {
            nextStatus: "collected",
            checkpoint: "Invalid mobile downgrade"
          }
        })
      ]
    });

    assert.equal(response.conflicts.length, 1);
    assert.match(response.conflicts[0]?.message ?? "", /Invalid sample transition/);
  });

  test("rejects malformed sample transition payloads", async () => {
    const { sync } = createSyncService();

    const response = await sync.reconcile({
      deviceId: "phleb-device-1",
      tenantId,
      actions: [
        sampleTransition({
          clientActionId: "mobile-action-reject",
          payload: {
            checkpoint: "Missing next status"
          }
        })
      ]
    });

    assert.equal(response.rejected.length, 1);
    assert.match(response.rejected[0]?.message ?? "", /valid nextStatus/);
  });
});
