import { Module } from "@nestjs/common";
import { TenantsModule } from "../tenants/tenants.module";
import { NotificationsController } from "./notifications.controller";

@Module({
  imports: [TenantsModule],
  controllers: [NotificationsController]
})
export class NotificationsModule {}
