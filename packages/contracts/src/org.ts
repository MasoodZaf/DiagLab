import type { TenantId, UserRole } from "./domain";

export const outletTypes = ["central_lab", "processing_hub", "collection_center"] as const;
export type OutletType = (typeof outletTypes)[number];

export type Outlet = {
  id: string;
  tenantId: TenantId;
  name: string;
  city: string;
  type: OutletType;
  address?: string;
  phone?: string;
  active: boolean;
};

export const doctorStatuses = ["active", "inactive"] as const;
export type DoctorStatus = (typeof doctorStatuses)[number];

/** A consultant / specialist on the lab's reporting panel. */
export type PanelDoctor = {
  id: string;
  tenantId: TenantId;
  name: string;
  specialty: string;
  qualification: string;
  /** Outlets this consultant is assigned to (a lab spans multiple outlets). */
  outletIds: string[];
  status: DoctorStatus;
};

export const staffStatuses = ["active", "on_leave", "inactive"] as const;
export type StaffStatus = (typeof staffStatuses)[number];

/** An employee or rider, with an assigned operational role and home outlet. */
export type StaffMember = {
  id: string;
  tenantId: TenantId;
  name: string;
  role: UserRole;
  outletId: string;
  phone?: string;
  status: StaffStatus;
  /** Login identifier — present when this staff member has a system account. */
  email?: string;
  /** Whether a role-scoped system login is active for this staff member. */
  loginEnabled?: boolean;
};

/** Which outlets offer a given catalog test — the outlet ↔ test-menu join. */
export type OutletTestAvailability = {
  tenantId: TenantId;
  /** Catalog test code (see TestCatalog). */
  testCode: string;
  /** Outlet ids that currently offer this test. */
  outletIds: string[];
};

export const weekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof weekdays)[number];

export const clinicSessions = ["off", "morning", "evening", "full_day"] as const;
export type ClinicSession = (typeof clinicSessions)[number];

/** A consultant's availability for one weekday (omit/`off` means unavailable). */
export type DoctorAvailability = {
  doctorId: string;
  day: Weekday;
  session: ClinicSession;
};

export const reagentStatuses = ["ok", "low", "out"] as const;
export type ReagentStatus = (typeof reagentStatuses)[number];

/** A reagent / consumable tracked per outlet; status is derived from stock vs reorderLevel. */
export type ReagentItem = {
  id: string;
  tenantId: TenantId;
  outletId: string;
  name: string;
  unit: string;
  stock: number;
  reorderLevel: number;
};

/** Derived stock status: out at zero, low at/under the reorder level, else ok. */
export function reagentStatus(item: Pick<ReagentItem, "stock" | "reorderLevel">): ReagentStatus {
  if (item.stock <= 0) return "out";
  if (item.stock <= item.reorderLevel) return "low";
  return "ok";
}

/** A tenant's organisation config — outlets, panel, team, schedule and inventory. */
export type TenantOrg = {
  outlets: Outlet[];
  doctors: PanelDoctor[];
  staff: StaffMember[];
  schedule: DoctorAvailability[];
  inventory: ReagentItem[];
};
