export type ThemeTokens = {
  fontDisplay: string;
  fontBody: string;
  colorPrimary: string;
  colorPrimaryForeground: string;
  colorAccentSurface: string;
  colorCanvas: string;
  colorPanel: string;
  colorPanelMuted: string;
  colorLine: string;
  colorText: string;
  colorTextMuted: string;
  colorSuccess: string;
  colorWarning: string;
  colorDanger: string;
  radius: string;
  density: "comfortable" | "compact";
};

export type ReportTemplate = {
  headerLabel: string;
  footerNote: string;
  showQrVerification: boolean;
};

export const notificationChannels = ["email", "sms", "whatsapp", "push", "in_app"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export const notificationTemplateKeys = [
  "appointmentBooked",
  "sampleCollected",
  "paymentReceived",
  "reportReleased",
  "criticalFollowup"
] as const;
export type NotificationTemplateKey = (typeof notificationTemplateKeys)[number];

export type NotificationChannelTemplate = {
  subject?: string;
  body: string;
  ctaLabel?: string;
};

export type NotificationTemplates = {
  emailFromName: string;
  smsSender: string;
  whatsappSender: string;
  templates: Record<NotificationTemplateKey, Partial<Record<NotificationChannel, NotificationChannelTemplate>>>;
};

export type TenantFeatures = {
  onlineBooking: boolean;
  homeCollection: boolean;
  payments: boolean;
  aiPatientExplanation: boolean;
  aiResultSummary: boolean;
  phlebotomyApp: boolean;
};

export type TenantPolicies = {
  allowCreditBilling: boolean;
  requireOtpForReports: boolean;
  requirePathologistApproval: boolean;
  enableCriticalCallLogging: boolean;
};

export type TenantConfig = {
  id: string;
  slug: string;
  brandName: string;
  domains: string[];
  locale: "en-PK" | "ar-SA" | "en-GB";
  timezone: string;
  heroStyle: "editorial" | "clinical" | "minimal";
  logos: {
    horizontal: string;
    square: string;
    favicon: string;
  };
  tokens: ThemeTokens;
  reportTemplate: ReportTemplate;
  notifications: NotificationTemplates;
  features: TenantFeatures;
  policies: TenantPolicies;
};
