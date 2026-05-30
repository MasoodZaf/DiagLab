import type { NotificationChannel, NotificationTemplateKey, TenantConfig } from "@lab/contracts";

export type NotificationRenderVariables = Record<string, string | number | boolean | null | undefined>;

export type RenderedNotification = {
  channel: NotificationChannel;
  key: NotificationTemplateKey;
  fromName?: string;
  sender?: string;
  subject?: string;
  body: string;
  ctaLabel?: string;
};

export function renderTenantNotification(
  tenant: TenantConfig,
  key: NotificationTemplateKey,
  channel: NotificationChannel,
  variables: NotificationRenderVariables
): RenderedNotification {
  const template = tenant.notifications.templates[key]?.[channel];

  if (!template) {
    throw new Error(`Missing ${channel} notification template for ${key}`);
  }

  const mergedVariables: NotificationRenderVariables = {
    brandName: tenant.brandName,
    tenantSlug: tenant.slug,
    locale: tenant.locale,
    ...variables
  };

  return {
    channel,
    key,
    fromName: channel === "email" ? tenant.notifications.emailFromName : undefined,
    sender: channel === "sms" ? tenant.notifications.smsSender : channel === "whatsapp" ? tenant.notifications.whatsappSender : undefined,
    subject: template.subject ? interpolate(template.subject, mergedVariables) : undefined,
    body: interpolate(template.body, mergedVariables),
    ctaLabel: template.ctaLabel ? interpolate(template.ctaLabel, mergedVariables) : undefined
  };
}

function interpolate(template: string, variables: NotificationRenderVariables) {
  return template.replaceAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value === null || value === undefined ? "" : String(value);
  });
}
