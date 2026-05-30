import { BadRequestException, Injectable } from "@nestjs/common";
import {
  sampleStatuses,
  type MobileSyncAction,
  type MobileSyncActionResult,
  type MobileSyncRequest,
  type MobileSyncResponse
} from "@lab/contracts";
import { PlatformDataService } from "../platform-data/platform-data.service";

@Injectable()
export class MobileSyncService {
  private readonly processedActionIds = new Set<string>();

  constructor(private readonly platformData: PlatformDataService) {}

  async reconcile(request: MobileSyncRequest): Promise<MobileSyncResponse> {
    if (!request.actions.every((action) => action.tenantId === request.tenantId)) {
      throw new BadRequestException("All sync actions must match the request tenant");
    }

    const response: MobileSyncResponse = {
      deviceId: request.deviceId,
      tenantId: request.tenantId,
      accepted: [],
      rejected: [],
      conflicts: [],
      duplicates: [],
      reconciledAt: new Date().toISOString()
    };

    for (const action of request.actions) {
      const result = await this.processAction(action);
      if (result.status === "accepted") {
        response.accepted.push(result);
      }
      if (result.status === "duplicate") {
        response.duplicates.push(result);
      }
      if (result.status === "rejected") {
        response.rejected.push(result);
      }
      if (result.status === "conflict") {
        response.conflicts.push(result);
      }
    }

    return response;
  }

  private async processAction(action: MobileSyncAction): Promise<MobileSyncActionResult> {
    const now = new Date().toISOString();

    if (this.processedActionIds.has(action.clientActionId)) {
      return {
        clientActionId: action.clientActionId,
        status: "duplicate",
        message: "Action already reconciled",
        serverProcessedAt: now
      };
    }

    try {
      if (action.type !== "sample_transition") {
        this.processedActionIds.add(action.clientActionId);
        return {
          clientActionId: action.clientActionId,
          status: "accepted",
          message: `${action.type} evidence queued for audit reconciliation`,
          serverProcessedAt: now
        };
      }

      if (!action.payload.nextStatus || !sampleStatuses.includes(action.payload.nextStatus)) {
        return {
          clientActionId: action.clientActionId,
          status: "rejected",
          message: "Sample transition action requires a valid nextStatus",
          serverProcessedAt: now
        };
      }

      await this.platformData.transitionSample(
        action.tenantId,
        {
          role: action.actor.role,
          displayName: action.actor.displayName,
          branchName: action.actor.branchName
        },
        {
          sampleId: action.entityId,
          nextStatus: action.payload.nextStatus,
          checkpoint: action.payload.checkpoint ?? `Mobile sync ${action.payload.nextStatus}`,
          reason: action.payload.reason
        }
      );
      this.processedActionIds.add(action.clientActionId);

      return {
        clientActionId: action.clientActionId,
        status: "accepted",
        message: `Sample ${action.entityId} moved to ${action.payload.nextStatus}`,
        serverProcessedAt: now
      };
    } catch (error) {
      return {
        clientActionId: action.clientActionId,
        status: "conflict",
        message: error instanceof Error ? error.message : "Unable to reconcile mobile action",
        serverProcessedAt: now
      };
    }
  }
}
