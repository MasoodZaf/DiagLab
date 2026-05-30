import { Module } from "@nestjs/common";
import { PlatformDataModule } from "../platform-data/platform-data.module";
import { TenantsModule } from "../tenants/tenants.module";
import { MobileSyncController } from "./mobile-sync.controller";
import { MobileSyncService } from "./mobile-sync.service";

@Module({
  imports: [PlatformDataModule, TenantsModule],
  controllers: [MobileSyncController],
  providers: [MobileSyncService],
  exports: [MobileSyncService]
})
export class MobileSyncModule {}
