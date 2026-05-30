import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { PlatformDataModule } from "../platform-data/platform-data.module";
import { TenantsModule } from "../tenants/tenants.module";

@Module({
  imports: [PlatformDataModule, TenantsModule],
  controllers: [OrdersController]
})
export class OrdersModule {}
