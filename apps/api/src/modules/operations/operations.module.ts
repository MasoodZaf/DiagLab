import { Module } from "@nestjs/common";
import { PlatformDataModule } from "../platform-data/platform-data.module";
import { OperationsController } from "./operations.controller";
import { TenantsModule } from "../tenants/tenants.module";

@Module({
  imports: [PlatformDataModule, TenantsModule],
  controllers: [OperationsController]
})
export class OperationsModule {}
