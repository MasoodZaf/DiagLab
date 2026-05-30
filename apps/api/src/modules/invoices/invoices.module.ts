import { Module } from "@nestjs/common";
import { PlatformDataModule } from "../platform-data/platform-data.module";
import { TenantsModule } from "../tenants/tenants.module";
import { InvoicesController } from "./invoices.controller";

@Module({
  imports: [PlatformDataModule, TenantsModule],
  controllers: [InvoicesController]
})
export class InvoicesModule {}
