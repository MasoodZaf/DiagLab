import { Injectable } from "@nestjs/common";
import { roleCapabilities, type InvoiceRecord, type SampleRecord, type SessionActor, type UserRole } from "@lab/contracts";
import { PlatformStoreService } from "./platform-store.service";
import { PostgresLabWorkflowRepository } from "./postgres-lab-workflow.repository";

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
  sex: "female" | "male" | "other";
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
export class PlatformDataService {
  private postgresRepository?: PostgresLabWorkflowRepository;

  constructor(private readonly memoryStore: PlatformStoreService) {}

  async listPatients(tenantId: string) {
    return (await this.getSnapshot(tenantId)).patients;
  }

  async listOrders(tenantId: string) {
    return (await this.getSnapshot(tenantId)).orders;
  }

  async listReports(tenantId: string) {
    return (await this.getSnapshot(tenantId)).reports;
  }

  async getSnapshot(tenantId: string) {
    if (this.usePostgres) {
      return this.postgres.getSnapshot(tenantId);
    }

    return this.memoryStore.getSnapshot(tenantId);
  }

  async registerPatientAndOrder(tenantId: string, actorInput: AuditActorInput, input: RegisterPatientInput) {
    if (this.usePostgres) {
      return this.postgres.registerPatientAndOrder(tenantId, {
        actor: this.toSessionActor(tenantId, actorInput),
        ...input
      });
    }

    return this.memoryStore.registerPatientAndOrder(tenantId, actorInput, input);
  }

  async transitionSample(tenantId: string, actorInput: AuditActorInput, input: TransitionSampleInput) {
    if (this.usePostgres) {
      return this.postgres.transitionSample(
        tenantId,
        input.sampleId,
        input.nextStatus,
        this.toSessionActor(tenantId, actorInput),
        {
          checkpoint: input.checkpoint,
          reason: input.reason
        }
      );
    }

    return this.memoryStore.transitionSample(tenantId, actorInput, input);
  }

  async acknowledgeCriticalAlert(tenantId: string, alertId: string, actorInput: AuditActorInput) {
    if (this.usePostgres) {
      return this.postgres.acknowledgeCriticalAlert(tenantId, alertId, this.toSessionActor(tenantId, actorInput));
    }

    return this.memoryStore.acknowledgeCriticalAlert(tenantId, alertId, actorInput);
  }

  async validateResult(tenantId: string, resultId: string, actorInput: AuditActorInput) {
    if (this.usePostgres) {
      return this.postgres.validateResult(tenantId, resultId, this.toSessionActor(tenantId, actorInput));
    }

    return this.memoryStore.validateResult(tenantId, resultId, actorInput);
  }

  async recordInvoicePayment(tenantId: string, invoiceId: string, amount: number, actorInput: AuditActorInput) {
    if (this.usePostgres) {
      return this.postgres.recordInvoicePayment(tenantId, invoiceId, amount, this.toSessionActor(tenantId, actorInput));
    }

    return this.memoryStore.recordInvoicePayment(tenantId, invoiceId, amount, actorInput);
  }

  async releaseReport(tenantId: string, reportId: string, actorInput: AuditActorInput) {
    if (this.usePostgres) {
      return this.postgres.releaseReport(tenantId, reportId, this.toSessionActor(tenantId, actorInput));
    }

    return this.memoryStore.releaseReport(tenantId, reportId, actorInput);
  }

  async amendReport(tenantId: string, reportId: string, note: string, actorInput: AuditActorInput) {
    if (this.usePostgres) {
      return this.postgres.amendReport(tenantId, reportId, note, this.toSessionActor(tenantId, actorInput));
    }

    return this.memoryStore.amendReport(tenantId, reportId, note, actorInput);
  }

  async createDraftReportForOrder(tenantId: string, orderId: string, actorInput: AuditActorInput) {
    if (this.usePostgres) {
      return this.postgres.createDraftReportForOrder(tenantId, orderId, this.toSessionActor(tenantId, actorInput));
    }

    return this.memoryStore.createDraftReportForOrder(tenantId, orderId, actorInput);
  }

  private get usePostgres() {
    return process.env.WORKFLOW_REPOSITORY_MODE === "postgres";
  }

  private get postgres() {
    this.postgresRepository ??= new PostgresLabWorkflowRepository();
    return this.postgresRepository;
  }

  private toSessionActor(tenantId: string, actorInput: AuditActorInput): SessionActor {
    const role = roleCapabilities.find((entry) => entry.role === actorInput.role);

    return {
      id: `${tenantId}_${actorInput.role}`,
      tenantId,
      role: actorInput.role,
      displayName: actorInput.displayName,
      branchName: actorInput.branchName,
      capabilities: role?.capabilities ?? []
    };
  }
}
