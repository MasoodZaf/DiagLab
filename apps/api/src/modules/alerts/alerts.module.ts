import { Module } from "@nestjs/common";
import { AlertsController } from "./alerts.controller";
import { PlatformDataModule } from "../platform-data/platform-data.module";
import { TenantsModule } from "../tenants/tenants.module";

@Module({
  imports: [PlatformDataModule, TenantsModule],
  controllers: [AlertsController]
})
export class AlertsModule {}
