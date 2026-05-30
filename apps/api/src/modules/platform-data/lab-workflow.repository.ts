import type {
  SessionActor,
  SampleRecord,
  TenantSnapshot
} from "@lab/contracts";

export type RegisterPatientAndOrderCommand = {
  actor: SessionActor;
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
  currency: "PKR" | "GBP" | "SAR";
};

export type WorkflowMutationResult = {
  message: string;
  snapshot: TenantSnapshot;
};

export interface LabWorkflowRepository {
  getSnapshot(tenantId: string): Promise<TenantSnapshot>;
  registerPatientAndOrder(tenantId: string, command: RegisterPatientAndOrderCommand): Promise<WorkflowMutationResult>;
  transitionSample(tenantId: string, sampleId: string, nextStatus: SampleRecord["status"], actor: SessionActor): Promise<WorkflowMutationResult>;
  validateResult(tenantId: string, resultId: string, actor: SessionActor): Promise<WorkflowMutationResult>;
  acknowledgeCriticalAlert(tenantId: string, alertId: string, actor: SessionActor): Promise<WorkflowMutationResult>;
  releaseReport(tenantId: string, reportId: string, actor: SessionActor): Promise<WorkflowMutationResult>;
  amendReport(tenantId: string, reportId: string, note: string, actor: SessionActor): Promise<WorkflowMutationResult>;
  createDraftReportForOrder(tenantId: string, orderId: string, actor: SessionActor): Promise<WorkflowMutationResult>;
  recordInvoicePayment(tenantId: string, invoiceId: string, amount: number, actor: SessionActor): Promise<WorkflowMutationResult>;
}
