import type { PlatformData, SupportTicket, TenantAccount } from "@lab/contracts";

// Platform Owner / Super Admin view: every tenant's commercial account with the
// platform, plus the complaints/support backlog. lumen + cedar mirror the two
// fully-configured white-label tenants; harbor (trial) and noor (past_due) show
// the other lifecycle states the Super Admin must manage.
export const tenantAccounts: TenantAccount[] = [
  {
    tenantId: "tenant_lumen",
    slug: "lumen",
    brandName: "Lumen Diagnostics",
    city: "Lahore",
    country: "Pakistan",
    primaryContact: "Dr. Mehak Ali",
    plan: "enterprise",
    state: "active",
    currency: "PKR",
    setupFee: 750000,
    setupPaid: true,
    annualFee: 3600000,
    signedUpAt: "2025-02-18T09:00:00Z",
    renewalAt: "2026-08-18T00:00:00Z",
    outletCount: 4,
    configured: true
  },
  {
    tenantId: "tenant_cedar",
    slug: "cedar",
    brandName: "Cedar PathLab",
    city: "London",
    country: "United Kingdom",
    primaryContact: "Dr. Hannah Cole",
    plan: "growth",
    state: "active",
    currency: "GBP",
    setupFee: 6000,
    setupPaid: true,
    annualFee: 24000,
    signedUpAt: "2025-09-04T09:00:00Z",
    renewalAt: "2026-09-04T00:00:00Z",
    outletCount: 2,
    configured: true
  },
  {
    tenantId: "tenant_harbor",
    slug: "harbor",
    brandName: "Harbor Labs",
    city: "Riyadh",
    country: "Saudi Arabia",
    primaryContact: "Dr. Khalid Al-Otaibi",
    plan: "starter",
    state: "trial",
    currency: "SAR",
    setupFee: 18000,
    setupPaid: false,
    annualFee: 84000,
    signedUpAt: "2026-05-12T09:00:00Z",
    renewalAt: "2026-06-11T00:00:00Z",
    trialEndsAt: "2026-06-11T00:00:00Z",
    outletCount: 1,
    configured: false
  },
  {
    tenantId: "tenant_noor",
    slug: "noor",
    brandName: "Noor Medical Lab",
    city: "Dubai",
    country: "United Arab Emirates",
    primaryContact: "Dr. Yusra Rahman",
    plan: "growth",
    state: "past_due",
    currency: "AED",
    setupFee: 22000,
    setupPaid: true,
    annualFee: 96000,
    signedUpAt: "2025-04-22T09:00:00Z",
    renewalAt: "2026-04-22T00:00:00Z",
    outletCount: 3,
    configured: false
  }
];

export const supportTickets: SupportTicket[] = [
  {
    id: "tic_1",
    tenantId: "tenant_noor",
    brandName: "Noor Medical Lab",
    subject: "Annual invoice unpaid — portal access at risk",
    category: "billing",
    severity: "urgent",
    status: "open",
    openedAt: "2026-05-28T07:40:00Z"
  },
  {
    id: "tic_2",
    tenantId: "tenant_harbor",
    brandName: "Harbor Labs",
    subject: "Help configuring Arabic report template",
    category: "onboarding",
    severity: "normal",
    status: "in_progress",
    openedAt: "2026-05-26T11:15:00Z"
  },
  {
    id: "tic_3",
    tenantId: "tenant_lumen",
    brandName: "Lumen Diagnostics",
    subject: "WhatsApp report delivery delayed for one branch",
    category: "technical",
    severity: "high",
    status: "open",
    openedAt: "2026-05-29T05:20:00Z"
  },
  {
    id: "tic_4",
    tenantId: "tenant_cedar",
    brandName: "Cedar PathLab",
    subject: "Request: bulk import of historical reference ranges",
    category: "feature_request",
    severity: "low",
    status: "open",
    openedAt: "2026-05-21T14:05:00Z"
  },
  {
    id: "tic_5",
    tenantId: "tenant_lumen",
    brandName: "Lumen Diagnostics",
    subject: "Critical-result call log export for ISO audit",
    category: "clinical",
    severity: "normal",
    status: "resolved",
    openedAt: "2026-05-18T08:30:00Z"
  }
];

export function getPlatformData(): PlatformData {
  return { accounts: tenantAccounts, tickets: supportTickets };
}
