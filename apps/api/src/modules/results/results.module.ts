import { Module } from "@nestjs/common";
import { PlatformDataModule } from "../platform-data/platform-data.module";
import { TenantsModule } from "../tenants/tenants.module";
import { ResultsController } from "./results.controller";

@Module({
  imports: [PlatformDataModule, TenantsModule],
  controllers: [ResultsController]
})
export class ResultsModule {}
