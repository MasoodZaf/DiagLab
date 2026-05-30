import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { notificationChannels, notificationTemplateKeys, type NotificationChannel, type NotificationTemplateKey } from "@lab/contracts";
import { renderTenantNotification, type NotificationRenderVariables } from "@lab/branding";
import { TenantsService } from "../tenants/tenants.service";

type NotificationPreviewRequest = {
  key: NotificationTemplateKey;
  channel: NotificationChannel;
  variables?: NotificationRenderVariables;
};

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get("contract")
  getContract() {
    return {
      channels: notificationChannels,
      templateKeys: notificationTemplateKeys
    };
  }

  @Get("templates")
  getTemplates(@Query("tenant") tenantSlug = "lumen") {
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return tenant.notifications;
  }

  @Post("preview")
  preview(@Query("tenant") tenantSlug = "lumen", @Body() body: NotificationPreviewRequest) {
    const tenant = this.tenantsService.getBySlug(tenantSlug);
    return renderTenantNotification(tenant, body.key, body.channel, body.variables ?? {});
  }
}
