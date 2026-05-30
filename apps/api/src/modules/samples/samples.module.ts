import { Module } from "@nestjs/common";
import { PlatformDataModule } from "../platform-data/platform-data.module";
import { SamplesController } from "./samples.controller";
import { TenantsModule } from "../tenants/tenants.module";

@Module({
  imports: [PlatformDataModule, TenantsModule],
  controllers: [SamplesController]
})
export class SamplesModule {}
