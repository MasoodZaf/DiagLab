export type TenantId = string;

export const userRoles = [
  "patient",
  "receptionist",
  "phlebotomist",
  "rider",
  "technician",
  "pathologist",
  "branch_manager",
  "lab_admin",
  "super_admin"
] as const;

export type UserRole = (typeof userRoles)[number];

export const appointmentStatuses = [
  "draft",
  "scheduled",
  "confirmed",
  "assigned",
  "completed",
  "cancelled",
  "no_show"
] as const;

export const sampleStatuses = [
  "registered",
  "scheduled",
  "collected",
  "in_transit",
  "received",
  "processing",
  "completed",
  "verified",
  "released",
  "rejected",
  "cancelled",
  "amended"
] as const;

export const resultStatuses = [
  "draft",
  "entered",
  "flagged",
  "validated",
  "released",
  "amended"
] as const;

export const invoiceStatuses = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "refunded",
  "void"
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];
export type SampleStatus = (typeof sampleStatuses)[number];
export type ResultStatus = (typeof resultStatuses)[number];
export type InvoiceStatus = (typeof invoiceStatuses)[number];

export type AuditStamped = {
  tenantId: TenantId;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type WorkflowRule = {
  from: string;
  to: string;
  allowedRoles: UserRole[];
  requiresReason?: boolean;
};

export const sampleWorkflowRules: WorkflowRule[] = [
  { from: "registered", to: "scheduled", allowedRoles: ["receptionist", "super_admin"] },
  { from: "scheduled", to: "collected", allowedRoles: ["phlebotomist"] },
  { from: "collected", to: "in_transit", allowedRoles: ["phlebotomist"] },
  { from: "in_transit", to: "received", allowedRoles: ["technician"] },
  { from: "received", to: "processing", allowedRoles: ["technician"] },
  { from: "processing", to: "completed", allowedRoles: ["technician"] },
  { from: "completed", to: "verified", allowedRoles: ["pathologist"] },
  { from: "verified", to: "released", allowedRoles: ["pathologist"] },
  { from: "collected", to: "rejected", allowedRoles: ["phlebotomist", "technician"], requiresReason: true },
  { from: "received", to: "rejected", allowedRoles: ["technician"], requiresReason: true },
  { from: "released", to: "amended", allowedRoles: ["pathologist", "super_admin"], requiresReason: true }
];

export const resultWorkflowRules: WorkflowRule[] = [
  { from: "draft", to: "entered", allowedRoles: ["technician"] },
  { from: "entered", to: "flagged", allowedRoles: ["technician"] },
  { from: "entered", to: "validated", allowedRoles: ["pathologist"] },
  { from: "flagged", to: "validated", allowedRoles: ["pathologist"] },
  { from: "validated", to: "released", allowedRoles: ["pathologist"] },
  { from: "released", to: "amended", allowedRoles: ["pathologist", "super_admin"], requiresReason: true }
];

export type RoleCapability = {
  role: UserRole;
  capabilities: string[];
};

export const roleCapabilities: RoleCapability[] = [
  { role: "patient", capabilities: ["self_book", "view_reports", "pay_invoice", "track_status"] },
  { role: "receptionist", capabilities: ["register_patient", "create_order", "issue_invoice", "assign_collection"] },
  { role: "phlebotomist", capabilities: ["view_assignments", "collect_sample", "capture_signature", "update_transit_status"] },
  { role: "rider", capabilities: ["view_routes", "pickup_sample", "update_transit_status", "confirm_delivery"] },
  { role: "technician", capabilities: ["receive_sample", "enter_result", "manage_qc", "reject_sample"] },
  { role: "pathologist", capabilities: ["validate_result", "release_report", "amend_report", "acknowledge_critical_alert"] },
  { role: "branch_manager", capabilities: ["monitor_branch", "view_financials", "manage_staff_policies"] },
  { role: "lab_admin", capabilities: ["manage_outlets", "manage_staff", "manage_panel", "assign_roles", "manage_test_pricing"] },
  { role: "super_admin", capabilities: ["manage_tenants", "configure_brand", "configure_ai", "view_audit_logs"] }
];

export type SessionActor = {
  id: string;
  tenantId: TenantId;
  role: UserRole;
  displayName: string;
  branchName?: string;
  capabilities: string[];
};

export type PatientRecord = AuditStamped & {
  id: string;
  mrn: string;
  fullName: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  sex: "female" | "male" | "other";
  consentedAt: string;
};

export type AppointmentRecord = AuditStamped & {
  id: string;
  patientId: string;
  status: AppointmentStatus;
  channel: "walk_in" | "portal" | "whatsapp" | "home_collection";
  scheduledAt: string;
  branchName: string;
};

export type OrderRecord = AuditStamped & {
  id: string;
  patientId: string;
  appointmentId: string;
  orderNumber: string;
  tests: string[];
  status: "registered" | "in_progress" | "awaiting_release" | "released";
  branchName: string;
  homeCollection: boolean;
};

export type SampleRecord = AuditStamped & {
  id: string;
  orderId: string;
  barcode: string;
  specimen: string;
  status: SampleStatus;
  collectedAt?: string;
  lastCheckpoint: string;
};

export type ResultRecord = AuditStamped & {
  id: string;
  orderId: string;
  sampleId: string;
  testName: string;
  status: ResultStatus;
  value: string;
  referenceRange: string;
  abnormal: boolean;
  critical: boolean;
  validatorName?: string;
};

export type InvoiceRecord = AuditStamped & {
  id: string;
  orderId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: number;
  paidAmount: number;
  currency: "PKR" | "GBP" | "SAR";
};

export type ReportRecord = AuditStamped & {
  id: string;
  orderId: string;
  reportNumber: string;
  status: "draft" | "released" | "amended";
  releasedAt?: string;
  releasedBy?: string;
  amendmentNote?: string;
};

export type ReportAmendmentRecord = {
  id: string;
  tenantId: TenantId;
  reportId: string;
  version: number;
  note: string;
  amendedBy: string;
  amendedAt: string;
};

export type CriticalAlertRecord = AuditStamped & {
  id: string;
  resultId: string;
  patientId: string;
  status: "open" | "acknowledged" | "closed";
  acknowledgedBy?: string;
  acknowledgedAt?: string;
};

export type AuditLogRecord = {
  id: string;
  tenantId: TenantId;
  actorName: string;
  actorRole: UserRole;
  entityType: string;
  entityId: string;
  action: string;
  beforeState?: unknown;
  afterState?: unknown;
  createdAt: string;
};

export const mobileSyncActionTypes = ["sample_transition", "signature_capture", "gps_checkpoint"] as const;
export type MobileSyncActionType = (typeof mobileSyncActionTypes)[number];

export type MobileSyncAction = {
  clientActionId: string;
  tenantId: TenantId;
  actor: SessionActor;
  type: MobileSyncActionType;
  entityId: string;
  occurredAt: string;
  payload: {
    nextStatus?: SampleStatus;
    checkpoint?: string;
    reason?: string;
    signatureName?: string;
    latitude?: number;
    longitude?: number;
  };
};

export type MobileSyncActionStatus = "accepted" | "duplicate" | "rejected" | "conflict";

export type MobileSyncActionResult = {
  clientActionId: string;
  status: MobileSyncActionStatus;
  message: string;
  serverProcessedAt: string;
};

export type MobileSyncRequest = {
  deviceId: string;
  tenantId: TenantId;
  actions: MobileSyncAction[];
};

export type MobileSyncResponse = {
  deviceId: string;
  tenantId: TenantId;
  accepted: MobileSyncActionResult[];
  rejected: MobileSyncActionResult[];
  conflicts: MobileSyncActionResult[];
  duplicates: MobileSyncActionResult[];
  reconciledAt: string;
};

export type TenantSnapshot = {
  tenantId: TenantId;
  patients: PatientRecord[];
  appointments: AppointmentRecord[];
  orders: OrderRecord[];
  samples: SampleRecord[];
  results: ResultRecord[];
  invoices: InvoiceRecord[];
  reports: ReportRecord[];
  reportAmendments: ReportAmendmentRecord[];
  criticalAlerts: CriticalAlertRecord[];
  auditLogs: AuditLogRecord[];
};
