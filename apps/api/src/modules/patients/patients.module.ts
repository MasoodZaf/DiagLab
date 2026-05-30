import { Module } from "@nestjs/common";
import { PlatformDataModule } from "../platform-data/platform-data.module";
import { PatientsController } from "./patients.controller";
import { TenantsModule } from "../tenants/tenants.module";

@Module({
  imports: [PlatformDataModule, TenantsModule],
  controllers: [PatientsController]
})
export class PatientsModule {}
