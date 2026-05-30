import type { CatalogCurrency } from "./catalog";
import type { TenantId } from "./domain";

export const subscriptionPlans = ["starter", "growth", "enterprise"] as const;
export type SubscriptionPlan = (typeof subscriptionPlans)[number];

export const accountStates = ["trial", "active", "past_due", "suspended"] as const;
export type AccountState = (typeof accountStates)[number];

/** A tenant's commercial account with the platform owner (Super Admin view). */
export type TenantAccount = {
  tenantId: TenantId;
  slug: string;
  brandName: string;
  city: string;
  country: string;
  primaryContact: string;
  plan: SubscriptionPlan;
  state: AccountState;
  currency: CatalogCurrency;
  /** One-time onboarding / setup fee. */
  setupFee: number;
  setupPaid: boolean;
  /** Recurring annual licence fee. */
  annualFee: number;
  signedUpAt: string;
  /** Next annual renewal / invoice date. */
  renewalAt: string;
  /** Set while state === "trial". */
  trialEndsAt?: string;
  outletCount: number;
  /** True when a full white-label tenant config exists (lumen/cedar). */
  configured: boolean;
};

export const ticketCategories = ["billing", "technical", "clinical", "onboarding", "feature_request"] as const;
export type TicketCategory = (typeof ticketCategories)[number];

export const ticketSeverities = ["low", "normal", "high", "urgent"] as const;
export type TicketSeverity = (typeof ticketSeverities)[number];

export const ticketStatuses = ["open", "in_progress", "resolved"] as const;
export type TicketStatus = (typeof ticketStatuses)[number];

/** A complaint / support ticket raised by a tenant. */
export type SupportTicket = {
  id: string;
  tenantId: TenantId;
  brandName: string;
  subject: string;
  category: TicketCategory;
  severity: TicketSeverity;
  status: TicketStatus;
  openedAt: string;
};

export type PlatformData = {
  accounts: TenantAccount[];
  tickets: SupportTicket[];
};
